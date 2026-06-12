// Pure classification / enrichment helpers. No fetches, no state, no React.
// Unit-testable in isolation.

import {
  ACTIVE_ACTIVITY_DAYS,
  BUDGET_KEYWORDS,
  COLUMN_IDS,
  EXCLUDED_STATUSES,
  PIPELINE_COLUMNS,
  STALE_MIN_DAYS,
  UPCOMING_WINDOW_DAYS,
  NEXT_CONTACT_FIELD,
} from "./pipelineConstants";
import {
  daysSince,
  isBeforeToday,
  isToday,
  isWithinNextDays,
} from "./dateHelpers";

const lower = (s) => String(s ?? "").toLowerCase();
const containsAny = (haystack, needles) => {
  const h = lower(haystack);
  return needles.some((n) => h.includes(lower(n)));
};

/** Get the lead's next-contact datetime, regardless of which field the API used. */
const getNextContact = (lead) =>
  lead?.[NEXT_CONTACT_FIELD] ?? lead?.cNextContactAt ?? null;

/** Best-effort "last activity" timestamp — modifiedAt is the cheapest proxy. */
const getLastActivity = (lead) =>
  lead?.modifiedAt ?? lead?.streamUpdatedAt ?? lead?.createdAt ?? null;

/**
 * Returns one of COLUMN_IDS (or null to exclude this lead from the board).
 * Priority order is the source of truth — first match wins.
 */
export const classifyDeal = (lead) => {
  if (!lead) return null;

  // 0. Terminal statuses are excluded outright.
  const status = lower(lead.status);
  if (EXCLUDED_STATUSES.some((s) => status.includes(s))) {
    return null;
  }

  // 1. Budget Issue — beats overdue / due-today / etc.
  if (containsAny(lead.status, BUDGET_KEYWORDS)) {
    return COLUMN_IDS.BUDGET_ISSUE;
  }

  const nextContact = getNextContact(lead);

  // 2. Overdue
  if (nextContact && isBeforeToday(nextContact)) {
    return COLUMN_IDS.OVERDUE;
  }

  // 3. Due Today
  if (nextContact && isToday(nextContact)) {
    return COLUMN_IDS.DUE_TODAY;
  }

  // 4. Upcoming (next N days)
  if (nextContact && isWithinNextDays(nextContact, UPCOMING_WINDOW_DAYS)) {
    return COLUMN_IDS.UPCOMING;
  }

  // 5. Active (recent activity even without a scheduled next contact)
  const lastActivity = getLastActivity(lead);
  if (lastActivity) {
    const d = daysSince(lastActivity);
    if (d <= ACTIVE_ACTIVITY_DAYS) return COLUMN_IDS.ACTIVE;
    if (d >= STALE_MIN_DAYS) return COLUMN_IDS.STALE;
  }

  // 6. Stale fallback.
  return COLUMN_IDS.STALE;
};

/**
 * Map a raw EspoCRM lead into the UI-friendly deal shape used by the kanban.
 * Adds: category (column id), priority (urgency hint), and a normalized
 * nextContact for cards/sorting. Returns null if the lead should be excluded.
 */
const enrichDeal = (lead) => {
  const category = classifyDeal(lead);
  if (!category) return null;

  // Crude priority hint — useful for sorting within a column.
  let priority = "low";
  if (category === COLUMN_IDS.OVERDUE) priority = "high";
  else if (category === COLUMN_IDS.DUE_TODAY) priority = "high";
  else if (category === COLUMN_IDS.UPCOMING) priority = "medium";
  else if (category === COLUMN_IDS.BUDGET_ISSUE) priority = "medium";

  return {
    ...lead,
    category,
    priority,
    nextContact: getNextContact(lead),
    lastActivity: getLastActivity(lead),
  };
};

/** Take the merged raw list and produce the classified, board-ready list. */
export const buildPipelineDeals = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const out = [];
  for (const lead of rawList) {
    const enriched = enrichDeal(lead);
    if (enriched) out.push(enriched);
  }
  return out;
};

/** Bucket the enriched deals by column id. Returns an object keyed by column. */
export const groupDealsByCategory = (deals) => {
  const empty = Object.fromEntries(PIPELINE_COLUMNS.map((c) => [c.id, []]));
  if (!Array.isArray(deals)) return empty;
  for (const d of deals) {
    if (empty[d.category]) empty[d.category].push(d);
  }
  return empty;
};

/**
 * Pull distinct option values from a deals array — for populating filter
 * dropdowns (owner/status/source/etc.) without hard-coding.
 * Returns: [{ value, label, count }]
 */
export const getDistinctOptions = (deals, field, labelField) => {
  if (!Array.isArray(deals) || !field) return [];
  const counts = new Map();
  for (const d of deals) {
    const value = d?.[field];
    if (!value) continue;
    const label = labelField && d?.[labelField] ? d[labelField] : value;
    const existing = counts.get(value);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(value, { value, label, count: 1 });
    }
  }
  return Array.from(counts.values()).sort((a, b) =>
    String(a.label).localeCompare(String(b.label))
  );
};

// --- Optimistic patch application (used by the data hook) ---

/**
 * Apply the store's optimistic patches + removed-id set to a raw list.
 * Patches: { [id]: partialLead }
 * Removed: Set<string>
 */
export const applyOptimisticState = (rawList, patches, removedIds) => {
  if (!Array.isArray(rawList)) return [];
  const removed = removedIds instanceof Set ? removedIds : new Set();
  return rawList.reduce((acc, lead) => {
    if (!lead?.id) return acc;
    if (removed.has(lead.id)) return acc;
    const patch = patches?.[lead.id];
    acc.push(patch ? { ...lead, ...patch } : lead);
    return acc;
  }, []);
};
