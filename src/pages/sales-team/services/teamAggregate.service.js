// Team metrics in a handful of requests instead of a thousand.
//
// The first version asked the gateway one COUNT per metric per rep. That is
// fine for five people and catastrophic for 116: 116 reps x 9 counts was over
// a thousand round trips, which is why the page sat spinning.
//
// This fetches the period's RECORDS once — a few hundred rows, a few fields
// each — and tallies every metric from them in memory. Sixty-seven leads this
// month is ONE request. Even 5,000 leads is 25. The tally also solves the
// "116 reps" problem on its own: only people who actually hold leads in the
// period appear, because only they show up in the data.

import { API_BASE, SUCCESS_STATUSES } from "../utils/teamConstants";
import { parseEspoToLocal } from "pages/pipeline/utils/dateHelpers";
import {
  isClosedLeadStatus,
  isNoChaseStatus,
  isUnworkableLeadStatus,
} from "utils/leadStatus";

const PAGE = 200;

// A guard, not a limit anyone should hit: 40 pages is 8,000 records. Beyond
// that the aggregate belongs on the server, and we stop rather than hammer the
// gateway in a loop.
const MAX_PAGES = 40;

const DATE_TYPES = [
  "today",
  "yesterday",
  "currentMonth",
  "lastMonth",
  "lastSevenDays",
  "between",
  "before",
  "after",
];

/**
 * One filter clause, in the ONLY spelling this gateway accepts for list
 * endpoints: `whereGroup[...]`, with the attribute always present.
 *
 * Copied from `fetchNewLeads`, which is the proven call in this codebase. An
 * earlier version of this file sent `where[...]` and `whereGroup[...]`
 * together plus a `select` parameter, and the gateway returned nothing for
 * all three requests — hence an empty board.
 */
const buildClause = (i, clause) => {
  let q = `whereGroup[${i}][type]=${clause.type}`;
  q += `&whereGroup[${i}][attribute]=${clause.attribute || "createdAt"}`;

  if (clause.value != null && clause.value !== "") {
    q += `&whereGroup[${i}][value]=${encodeURIComponent(clause.value)}`;
  }
  if (clause.dateTime || DATE_TYPES.includes(clause.type)) {
    q += `&whereGroup[${i}][dateTime]=true`;
  }
  return q;
};

/**
 * Every record matching the filter, paged until the server's reported total is
 * reached.
 *
 * Throws if the FIRST page fails — an empty board should say so rather than
 * read as "nobody sold anything". A later page failing returns what we have,
 * since partial numbers beat none.
 */
const fetchAll = async (entity, { clauses = [], orderBy = "createdAt" }) => {
  const token = localStorage.getItem("auth_token");
  const filter = clauses.map((c, i) => buildClause(i, c)).join("&");

  const out = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url =
      `${API_BASE}/${entity}?maxSize=${PAGE}&offset=${offset}` +
      `&orderBy=${orderBy}&order=desc${filter ? `&${filter}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
      return out;
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[sales-team] list failed", res.status, url, detail);
      if (page === 0) {
        throw new Error(`${entity} request failed (HTTP ${res.status})`);
      }
      return out;
    }

    const data = await res.json();
    const list = data?.list || [];
    out.push(...list);

    offset += PAGE;
    if (list.length < PAGE || offset >= (Number(data?.total) || 0)) break;
  }

  return out;
};

const lower = (v) => String(v ?? "").toLowerCase().trim();

/** Empty metric bucket for one rep. */
const emptyRep = (id, name) => ({
  id,
  name,
  assigned: 0,
  won: 0,
  qualified: 0,
  converted: 0,
  newLeads: 0,
  siteVisitScheduled: 0,
  siteVisitDone: 0,
  untracked: 0,
  // Counted but kept out of every rate — surfaced in the UI so the exclusion
  // is visible rather than silent.
  unworkable: 0,
  followUpsDue: 0,
  followUpsMissed: 0,
  calls: 0,
  callsHeld: 0,
});

const SUCCESS = SUCCESS_STATUSES.map(lower);

/**
 * Is anyone still expected to contact this lead?
 *
 * Only open leads can be overdue or be missing a follow-up date. A Dead or
 * Converted lead with a date in the past is finished business, not a missed
 * call, and counting it made Overdue Leads read far higher than the work
 * actually outstanding. Qualified is excluded for the same reason the leads
 * table stopped flagging it red: the lead moved forward, it is not neglected.
 *
 * Note this does NOT affect `assigned` or the conversion rate. A lost lead is
 * still a lead the rep was given and did not convert.
 */
const isStillChaseable = (status) =>
  !isClosedLeadStatus(status) &&
  !isNoChaseStatus(status) &&
  !isUnworkableLeadStatus(status);


/**
 * Three list requests, one tally. Returns a map of userId -> metrics plus the
 * team totals, so nothing downstream needs a second round of queries.
 */
export const fetchTeamAggregate = async ({ dateType }) => {
  const [leads, dueLeads, calls] = await Promise.all([
    // Leads created in the period — the basis for assigned / won / qualified /
    // converted / contacted / untracked.
    fetchAll("Lead", {
      clauses: [{ type: dateType, attribute: "createdAt" }],
      orderBy: "createdAt",
    }),

    // Leads whose FOLLOW-UP fell in the period. A different set from the
    // above: a lead created last year can be due this week.
    fetchAll("Lead", {
      clauses: [{ type: dateType, attribute: "cNextContact" }],
      orderBy: "cNextContact",
    }),

    // Calls are optional: if this deployment does not use the Call entity, a
    // failure here must not blank out every lead metric beside it.
    fetchAll("Call", {
      clauses: [{ type: dateType, attribute: "dateStart" }],
      orderBy: "dateStart",
    }).catch(() => []),
  ]);

  const reps = new Map();
  const bucket = (record) => {
    const id = record?.assignedUserId;
    if (!id) return null; // Unassigned work belongs to nobody's score.
    if (!reps.has(id)) {
      reps.set(id, emptyRep(id, record?.assignedUserName || "Unassigned"));
    }
    return reps.get(id);
  };

  // Guard against a record appearing twice across pages (an insert between
  // page fetches shifts the offset window), which would inflate a rep's count.
  const seen = new Set();

  for (const lead of leads) {
    if (seen.has(`l:${lead.id}`)) continue;
    seen.add(`l:${lead.id}`);

    const rep = bucket(lead);
    if (!rep) continue;

    const status = lower(lead.status);

    // Invalid / Duplicate / archived imports never reach the denominator.
    // They are tallied separately so the board can show how much of a rep's
    // intake was unusable — which is a lead-source problem worth seeing, not
    // something to hide.
    if (isUnworkableLeadStatus(status)) {
      rep.unworkable += 1;
      continue;
    }

    rep.assigned += 1;
    if (SUCCESS.includes(status)) rep.won += 1;
    if (status === "qualified") rep.qualified += 1;
    if (status === "converted") rep.converted += 1;
    if (status === "new") rep.newLeads += 1;
    if (status === "site visit scheduled") rep.siteVisitScheduled += 1;
    if (status === "site visit done") rep.siteVisitDone += 1;
    if (!lead.cNextContact && isStillChaseable(status)) rep.untracked += 1;
  }

  const now = Date.now();
  for (const lead of dueLeads) {
    if (seen.has(`d:${lead.id}`)) continue;
    seen.add(`d:${lead.id}`);

    const rep = bucket(lead);
    if (!rep) continue;

    if (!isStillChaseable(lead.status)) continue;

    rep.followUpsDue += 1;
    const due = parseEspoToLocal(lead.cNextContact);
    if (due && due.getTime() < now) rep.followUpsMissed += 1;
  }

  for (const call of calls) {
    if (seen.has(`c:${call.id}`)) continue;
    seen.add(`c:${call.id}`);

    const rep = bucket(call);
    if (!rep) continue;

    rep.calls += 1;
    if (lower(call.status) === "held") rep.callsHeld += 1;
  }

  const list = [...reps.values()];
  const sum = (key) => list.reduce((acc, r) => acc + r[key], 0);

  return {
    reps: list,
    totals: {
      assigned: sum("assigned"),
      won: sum("won"),
      calls: sum("calls"),
      callsHeld: sum("callsHeld"),
      overdue: sum("followUpsMissed"),
      unworkable: sum("unworkable"),
    },
    fetchedAt: Date.now(),
  };
};
