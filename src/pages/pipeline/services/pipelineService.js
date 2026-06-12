// Pipeline data service.
//
// Architecture:
//   1. Primary fetch  — leads filtered by NEXT_CONTACT_FIELD via whereGroup[0].
//   2. Budget fetch   — leads whose status matches `%budget%`, filtered by
//                       createdAt (so we catch leads with no scheduled follow-up).
//   3. Fan-out paginate the primary in PARALLEL once we know `total`.
//   4. Merge + dedup by lead.id.
//   5. Layer caches: service-level Map (TTL) → in-flight dedup Map → React Query.
//
// All callers should go through `fetchPipelineLeads(...)`.

import {
  API_BASE,
  LEAD_ENTITY,
  NEXT_CONTACT_FIELD,
  PIPELINE_CACHE_TTL,
  PIPELINE_PAGE_SIZE,
  DEFAULT_DATE_TYPE,
} from "../utils/pipelineConstants";

// ---------------------------------------------------------------------------
// Auth + low-level fetch
// ---------------------------------------------------------------------------

const authToken = () => localStorage.getItem("auth_token");

const handleAuthFailure = () => {
  localStorage.clear();
  // Soft redirect — the caller's catch will see the thrown error too.
  window.location.href = "/login";
};

const apiFetch = async (url, init = {}) => {
  const token = authToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      token,
    },
  });
  if (res.status === 401 || res.status === 403) {
    handleAuthFailure();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    // Try to extract a useful error body for the UI.
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    const err = new Error(
      `Pipeline request failed (HTTP ${res.status})${detail ? `: ${detail}` : ""}`
    );
    err.status = res.status;
    throw err;
  }
  return res.json();
};

// ---------------------------------------------------------------------------
// URL builders — whereGroup syntax (gateway-specific)
// ---------------------------------------------------------------------------

/**
 * Build a single whereGroup parameter string for one filter clause.
 * Always emits `value=` even for valueless types (the gateway requires it,
 * otherwise it 500s on custom datetime columns).
 */
const buildWhereGroup = (i, clause) => {
  const parts = [
    `whereGroup[${i}][type]=${encodeURIComponent(clause.type)}`,
    `whereGroup[${i}][attribute]=${encodeURIComponent(clause.attribute)}`,
  ];

  if (Array.isArray(clause.value)) {
    // `value[]=` repeated — for "between" date ranges.
    for (const v of clause.value) {
      parts.push(`whereGroup[${i}][value][]=${encodeURIComponent(v)}`);
    }
  } else {
    // Always emit value, even if empty.
    parts.push(
      `whereGroup[${i}][value]=${encodeURIComponent(clause.value ?? "")}`
    );
  }

  if (clause.dateTime) {
    parts.push(`whereGroup[${i}][dateTime]=true`);
  }
  return parts.join("&");
};

const buildListUrl = ({ limit, offset, orderBy, order, whereClauses }) => {
  const base = `${API_BASE}/${LEAD_ENTITY}?maxSize=${limit}&offset=${offset}&orderBy=${orderBy}&order=${order}`;
  const where = whereClauses
    .map((clause, i) => buildWhereGroup(i, clause))
    .join("&");
  return where ? `${base}&${where}` : base;
};

/** Normalize the dateFilter object the caller passes into a clause shape. */
const dateFilterToClause = (dateFilter, attribute) => {
  const dateType = dateFilter?.dateType || DEFAULT_DATE_TYPE;
  if (dateType === "on" && dateFilter?.closeDateFrom) {
    return {
      type: "on",
      attribute,
      value: dateFilter.closeDateFrom,
      dateTime: true,
    };
  }
  if (
    dateType === "between" &&
    dateFilter?.closeDateFrom &&
    dateFilter?.closeDateTo
  ) {
    return {
      type: "between",
      attribute,
      value: [dateFilter.closeDateFrom, dateFilter.closeDateTo],
      dateTime: true,
    };
  }
  // Valueless types (currentMonth / lastMonth / etc.) still emit value=.
  return { type: dateType, attribute, value: "", dateTime: true };
};

// ---------------------------------------------------------------------------
// Fan-out pagination
// ---------------------------------------------------------------------------

/**
 * Fetch page 1, then fan out all remaining pages in PARALLEL.
 * Returns the concatenated `.list` and the original `.total`.
 */
const fetchAllPages = async ({ limit, orderBy, order, whereClauses }) => {
  const first = await apiFetch(
    buildListUrl({ limit, offset: 0, orderBy, order, whereClauses })
  );
  const total = first?.total ?? 0;
  const firstList = first?.list || [];

  if (total <= limit) {
    return { list: firstList, total };
  }

  const pagesNeeded = Math.ceil(total / limit);
  const offsets = [];
  for (let p = 1; p < pagesNeeded; p++) {
    offsets.push(p * limit);
  }

  const pages = await Promise.all(
    offsets.map((offset) =>
      apiFetch(
        buildListUrl({ limit, offset, orderBy, order, whereClauses })
      ).then((j) => j?.list || [])
    )
  );

  return { list: [...firstList, ...pages.flat()], total };
};

// ---------------------------------------------------------------------------
// The two named fetches
// ---------------------------------------------------------------------------

const fetchPrimary = ({ limit, dateFilter }) =>
  fetchAllPages({
    limit,
    // Sort by the follow-up date ascending — earliest / most overdue first,
    // matching the urgency ordering users expect on an action pipeline.
    orderBy: NEXT_CONTACT_FIELD,
    order: "asc",
    whereClauses: [dateFilterToClause(dateFilter, NEXT_CONTACT_FIELD)],
  });

const fetchBudget = ({ limit, dateFilter }) =>
  // Single page is fine — budget leads rarely exceed 200/window.
  apiFetch(
    buildListUrl({
      limit,
      offset: 0,
      orderBy: "createdAt",
      order: "desc",
      whereClauses: [
        { type: "like", attribute: "status", value: "%budget%" },
        dateFilterToClause(dateFilter, "createdAt"),
      ],
    })
  ).then((j) => ({ list: j?.list || [], total: j?.total ?? 0 }));

// ---------------------------------------------------------------------------
// Caches
// ---------------------------------------------------------------------------

const resultCache = new Map(); // key → { value, expiresAt }
const inFlightCache = new Map(); // key → Promise

const cacheKey = ({ limit, dateFilter }) =>
  `pipeline:l${limit}:dt${dateFilter?.dateType || DEFAULT_DATE_TYPE}` +
  `:f${dateFilter?.closeDateFrom || ""}:t${dateFilter?.closeDateTo || ""}`;

export const invalidatePipelineCache = () => {
  resultCache.clear();
  inFlightCache.clear();
};

// ---------------------------------------------------------------------------
// Public read API
// ---------------------------------------------------------------------------

/**
 * Returns the merged + deduped lead list for the given window.
 *   { list: Lead[], total: { primary, budget } }
 *
 * The two fetches run in parallel. Service-level cache + in-flight dedup are
 * applied; React Query is layered on top by the caller.
 */
export const fetchPipelineLeads = async ({
  limit = PIPELINE_PAGE_SIZE,
  dateFilter = {},
} = {}) => {
  const key = cacheKey({ limit, dateFilter });

  // Layer 1: result cache.
  const cached = resultCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Layer 2: in-flight dedup — two simultaneous callers share one network call.
  if (inFlightCache.has(key)) {
    return inFlightCache.get(key);
  }

  const promise = (async () => {
    try {
      const [primary, budget] = await Promise.all([
        fetchPrimary({ limit, dateFilter }),
        fetchBudget({ limit, dateFilter }),
      ]);

      // Merge + dedup by id, primary wins on conflict.
      const byId = new Map();
      for (const lead of budget.list) {
        if (lead?.id) byId.set(lead.id, lead);
      }
      for (const lead of primary.list) {
        if (lead?.id) byId.set(lead.id, lead);
      }

      const merged = {
        list: Array.from(byId.values()),
        total: { primary: primary.total, budget: budget.total },
      };

      resultCache.set(key, {
        value: merged,
        expiresAt: Date.now() + PIPELINE_CACHE_TTL,
      });

      return merged;
    } finally {
      inFlightCache.delete(key);
    }
  })();

  inFlightCache.set(key, promise);
  return promise;
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const updateLeadFields = async (id, fields) => {
  const json = await apiFetch(`${API_BASE}/${LEAD_ENTITY}/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
  return json;
};

/**
 * Reschedule a follow-up. `nextContactDateTime` must already be in Espo format
 * ("YYYY-MM-DD HH:MM:SS"). Use `toEspoDateTime` upstream if not.
 */
export const persistDealReschedule = async (id, nextContactDateTime) => {
  if (!id) throw new Error("persistDealReschedule: id required");
  const result = await updateLeadFields(id, {
    [NEXT_CONTACT_FIELD]: nextContactDateTime,
  });
  invalidatePipelineCache();
  return result;
};

export const deletePipelineDeal = async (id) => {
  if (!id) throw new Error("deletePipelineDeal: id required");
  await apiFetch(`${API_BASE}/${LEAD_ENTITY}/${id}`, { method: "DELETE" });
  invalidatePipelineCache();
  return { id, deleted: true };
};
