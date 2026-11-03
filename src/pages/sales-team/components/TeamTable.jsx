import React from "react";
import Icon from "components/AppIcon";
import RateCell from "./RateCell";
import CountCell from "./CountCell";
import ScoreBadge from "./ScoreBadge";
import HoverHelp from "./HoverHelp";
import { getInitials } from "utils/followUpUrgency";

// Podium tints for the top three. Literal strings — Tailwind cannot see a
// class assembled from an index.
// A stable colour per person — derived from their id, so the same rep keeps
// the same colour as the table reorders. Literal strings; Tailwind cannot see
// a class built from an index.
const NAME_TINTS = [
  { text: "text-blue-700", bg: "bg-blue-100 text-blue-700" },
  { text: "text-violet-700", bg: "bg-violet-100 text-violet-700" },
  { text: "text-emerald-700", bg: "bg-emerald-100 text-emerald-700" },
  { text: "text-amber-700", bg: "bg-amber-100 text-amber-700" },
  { text: "text-rose-700", bg: "bg-rose-100 text-rose-700" },
  { text: "text-cyan-700", bg: "bg-cyan-100 text-cyan-700" },
  { text: "text-indigo-700", bg: "bg-indigo-100 text-indigo-700" },
  { text: "text-teal-700", bg: "bg-teal-100 text-teal-700" },
];

const tintFor = (key) => {
  const str = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return NAME_TINTS[Math.abs(hash) % NAME_TINTS.length];
};

const RANK_TINTS = [
  "bg-amber-100 text-amber-800 ring-amber-200",
  "bg-slate-200 text-slate-700 ring-slate-300",
  "bg-orange-100 text-orange-800 ring-orange-200",
];

// Only the columns fetched for EVERY rep can be sorted. Calls, overdue and
// connect are fetched for the visible page only, so sorting the whole board by
// them would order it on data most rows do not have yet.
const SORTS = [
  { id: "score", label: "Score" },
  { id: "conversion", label: "Conversion Rate" },
  { id: "assigned", label: "Leads Assigned" },
];

// What each column measures, in the words a manager would use. Shown on hover
// over the heading itself — there is no icon to click.
const COLUMN_HELP = {
  rank: {
    title: "How ranking works",
    body: "Position in the list as currently sorted — by default the highest performance score first. Only reps with 20 or more leads in the period are ranked: below that a single win swings every rate too far to compare fairly. Everyone else is listed underneath with a dash instead of a number.",
  },
  score: {
    title: "Performance Score",
    body: "Out of 100, from five weighted metrics: conversion rate (35), follow-up discipline (20), qualified leads (15), site visits (15) and revenue (15). Each is measured against a target you can change with the Targets button, and each is capped at its own weight. Hover a score to see the arithmetic.",
  },
  assigned: {
    title: "Leads Assigned",
    body: "Leads created during the selected period and assigned to this rep. Invalid, Duplicate and archived records are left out — they were never sellable, so dividing a rep's conversion by them would punish bad lead data rather than bad selling. Any excluded records are noted under the count. Dead and Not Interested ARE counted: those are real losses, and hiding them would make the conversion rate gameable.",
  },
  conversion: {
    title: "Conversion Rate",
    body: "Won ÷ assigned, as a percentage. 'Won' means the lead currently sits in Interested, Qualified or Converted. Both halves count only the selected period, and the raw figures are printed under the bar so you can see what the percentage is made of.",
  },
  overdue: {
    title: "Overdue Leads",
    body: "Open leads whose follow-up date fell inside the selected period and has already passed. Closed leads are not counted: a Dead, Not Interested or Converted lead with an old date is finished business, not a missed call. Nor is it an all-time backlog — only follow-ups due during the period you are looking at.",
  },
  calls: {
    title: "Calls Made",
    body: "Call records logged in the period with this rep as the owner. If your team does not log calls in the CRM, this stays at zero regardless of how much they actually dialled.",
  },
  connectRate: {
    title: "Connection Rate",
    body: "Calls marked Held ÷ every call dialled in the period. It shows how often an attempt turned into a real conversation.",
  },
  untracked: {
    title: "Follow-ups Pending",
    body: "Open leads assigned in this period with no next-contact date set at all. These are invisible everywhere else — they never reach the pipeline board or the dashboard panel, so nobody is reminded to work them. Closed and unusable leads are excluded: nobody owes them a next step.",
  },
};

const SortHeader = ({ id, label, sort, onSort, hint }) => {
  const active = sort.key === id;
  const sortable = SORTS.some((s) => s.id === id);
  const help = COLUMN_HELP[id];

  return (
    <th scope="col" className="px-3 py-3 text-left align-bottom">
      <button
        type="button"
        disabled={!sortable}
        onClick={() => onSort(id)}
        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-default ${
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {help ? (
          <HoverHelp title={help.title} body={help.body}>
            {label}
          </HoverHelp>
        ) : (
          label
        )}
        {sortable && (
          <Icon
            name={active && sort.dir === "asc" ? "ArrowUp" : "ArrowDown"}
            size={12}
            className={active ? "opacity-100" : "opacity-30"}
          />
        )}
      </button>
      {hint && (
        <p className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-muted-foreground/70">
          {hint}
        </p>
      )}
    </th>
  );
};

/** One rep, desktop. */
const DeskRow = ({ row, rank }) => (
  <tr
    className={`border-t border-border transition-colors hover:bg-muted/50 ${
      row.isMe ? "bg-primary/[0.04]" : ""
    }`}
  >
    <td className="px-3 py-4">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1 ${
          rank < 3 ? RANK_TINTS[rank] : "bg-muted text-muted-foreground ring-border"
        }`}
      >
        {rank + 1}
      </span>
    </td>

    <td className="px-3 py-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tintFor(row.id).bg}`}
        >
          {getInitials(row.name)}
        </span>
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${tintFor(row.id).text}`}>
            {row.name}
            {row.isMe && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                You
              </span>
            )}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {row.userName}
            {!row.ranked && (
              // Kept as a quiet note rather than withholding the rank: the
              // caution is about reading the rates, not about the person.
              <span className="ml-1.5 text-muted-foreground/70">· low volume</span>
            )}
          </p>
        </div>
      </div>
    </td>

    {/* Volume is context, not a score — plain and quiet, so the eye goes to
        the rates beside it. */}
    <td className="px-3 py-4">
      <CountCell
        value={row.assigned}
        caption={
          row.unworkable > 0 ? `+${row.unworkable} unusable` : undefined
        }
        isLoading={row.isLoadingCore}
      />
    </td>

    <td className="px-3 py-4">
      <RateCell
        metric="conversion"
        value={row.conversion}
        numerator={row.won}
        denominator={row.assigned}
        isLoading={row.isLoadingCore}
      />
    </td>

    <td className="px-3 py-4">
      <CountCell
        value={row.overdue}
        caption="due date missed"
        alarmAboveZero
        isLoading={row.isLoadingDetail}
      />
    </td>

    <td className="px-3 py-4">
      <CountCell value={row.calls} isLoading={row.isLoadingDetail} />
    </td>

    <td className="px-3 py-4">
      <RateCell
        metric="connectRate"
        value={row.connectRate}
        numerator={row.callsHeld}
        denominator={row.calls}
        isLoading={row.isLoadingDetail}
      />
    </td>

    <td className="px-3 py-4">
      <CountCell
        value={row.untracked}
        caption="no date set"
        alarmAboveZero
        isLoading={row.isLoadingDetail}
      />
    </td>

    {/* Score last: the columns before it are the evidence, this is the
        verdict they add up to. */}
    <td className="px-3 py-4">
      <ScoreBadge
        score={row.score}
        provisional={row.scoreProvisional}
        breakdown={row.scoreBreakdown}
        isLoading={row.isLoadingScore}
      />
    </td>
  </tr>
);

/** One rep, mobile. The table collapses rather than scrolling sideways. */
const MobileCard = ({ row, rank }) => (
  <div
    className={`rounded-2xl border border-border bg-card p-4 shadow-elevation-1 ${
      row.isMe ? "ring-1 ring-primary/30" : ""
    }`}
  >
    <div className="flex items-center gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${
          rank < 3 ? RANK_TINTS[rank] : "bg-muted text-muted-foreground ring-border"
        }`}
      >
        {rank + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${tintFor(row.id).text}`}>
          {row.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {row.assigned == null ? "—" : row.assigned} leads assigned
        </p>
      </div>

      <ScoreBadge
        score={row.score}
        provisional={row.scoreProvisional}
        breakdown={row.scoreBreakdown}
        isLoading={row.isLoadingScore}
      />
    </div>

    <div className="mt-4 grid grid-cols-2 gap-4">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Conversion Rate
        </p>
        <RateCell
          metric="conversion"
          value={row.conversion}
          numerator={row.won}
          denominator={row.assigned}
          isLoading={row.isLoadingCore}
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Overdue Leads
        </p>
        <CountCell
          value={row.overdue}
          caption="due date missed"
          alarmAboveZero
          isLoading={row.isLoadingDetail}
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Connection Rate
        </p>
        <RateCell
          metric="connectRate"
          isLoading={row.isLoadingDetail}
          value={row.connectRate}
          numerator={row.callsHeld}
          denominator={row.calls}
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Follow-ups Pending
        </p>
        <CountCell
          value={row.untracked}
          caption="no date set"
          alarmAboveZero
          isLoading={row.isLoadingDetail}
        />
      </div>
    </div>
  </div>
);

/**
 * `items` is one already-paged sequence of { row, rank }, where rank is the
 * position across the whole board rather than within the page.
 */
const TeamTable = ({ items, sort, onSort }) => (
  <>
    {/* Desktop */}
    <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-elevation-1 lg:block">
      <table className="w-full">
        <thead className="festive-thead">
          <tr>
            <SortHeader id="rank" label="Rank" sort={sort} onSort={onSort} />
            <SortHeader id="rep" label="Sales Representative" sort={sort} onSort={onSort} />
            <SortHeader id="assigned" label="Leads Assigned" sort={sort} onSort={onSort} hint="in period" />
            <SortHeader id="conversion" label="Conversion Rate" sort={sort} onSort={onSort} hint="won / assigned" />
            <SortHeader id="overdue" label="Overdue Leads" sort={sort} onSort={onSort} hint="due in period" />
            <SortHeader id="calls" label="Calls Made" sort={sort} onSort={onSort} hint="in period" />
            <SortHeader id="connectRate" label="Connection Rate" sort={sort} onSort={onSort} hint="held / dialled" />
            <SortHeader id="untracked" label="Follow-ups Pending" sort={sort} onSort={onSort} hint="of assigned" />
            <SortHeader id="score" label="Score" sort={sort} onSort={onSort} hint="out of 100" />
          </tr>
        </thead>
        <tbody>
          {items.map(({ row, rank }) => (
            <React.Fragment key={row.id}>
              <DeskRow row={row} rank={rank} />
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile */}
    <div className="space-y-3 lg:hidden">
      {items.map(({ row, rank }) => (
        <React.Fragment key={row.id}>
          <MobileCard row={row} rank={rank} />
        </React.Fragment>
      ))}
    </div>
  </>
);

export default TeamTable;
