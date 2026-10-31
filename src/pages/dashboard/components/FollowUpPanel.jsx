// "What needs your attention today" — the one thing on the dashboard that
// asks for an action rather than reporting a number.
//
// Shows leads whose follow-up is due today or already past, due-today first:
// today is the bucket you can still make good on, overdue has already slipped.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Icon from "components/AppIcon";
import { useFollowUpAlerts } from "hooks/useFollowUpAlerts";
import { CHIP_PALETTE, STATUS_COLORS } from "utils/leadStatus";
import { canReadField } from "utils/permissions";
import {
  formatDueClock,
  formatDueDate,
  getInitials,
  getSeverity,
  getUrgencyLabel,
} from "utils/followUpUrgency";

const LIST_MAX_HEIGHT = "17.5rem";

// Only the freshest few rows. A dashboard panel is a prompt to act, not a
// worklist — past about ten rows it stops being something you clear and turns
// into a backlog you scroll. The header keeps the true totals, and the board
// behind "View overdue leads" holds the rest.
const MAX_ROWS = 10;

const NEUTRAL_PILL = "bg-slate-100 text-slate-700";

/** Status to pill classes, via the palette the rest of the app already uses. */
const pillClassFor = (status) => {
  const key = String(status ?? "").trim();
  const colour = STATUS_COLORS[key];
  return CHIP_PALETTE[colour]?.pill || NEUTRAL_PILL;
};

// Avatar tints, assigned per lead rather than per row index so the same person
// keeps the same colour when the list reorders. Literal strings — Tailwind
// cannot see a computed `bg-${c}-100`.
const AVATAR_TINTS = [
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const tintFor = (key) => {
  const str = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
};

const digitsOf = (phone) => String(phone ?? "").replace(/\D/g, "");

/**
 * Two rising sine notes, ~0.4s, synthesised rather than loaded — a 10KB audio
 * file for 400ms of sound is not worth a network round trip.
 *
 * Everything is inside try/catch: autoplay policy blocks AudioContext until
 * the page has been interacted with, and a blocked chime must not take the
 * panel down with it.
 */
const playChime = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Short attack, longer decay — an abrupt gate on a sine clicks.
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.18);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
    osc.onended = () => {
      try {
        ctx.close();
      } catch {}
    };
  } catch {
    // Blocked or unsupported — silence is an acceptable outcome.
  }
};

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

/**
 * `div role="button"` rather than `<button>`: this row contains an
 * `<a href="tel:">` and a WhatsApp link, and a button may not contain
 * interactive descendants. The keydown handler restores what the native
 * element would have given us.
 */
const AlertRow = ({ lead, isDueToday, canSeePhone, onOpen }) => {
  const severity = getSeverity(lead.dueAt, isDueToday);
  const urgency = getUrgencyLabel(lead.dueAt);
  const phone = digitsOf(lead?.phoneNumber);
  const name =
    lead?.name ||
    [lead?.firstName, lead?.lastName].filter(Boolean).join(" ") ||
    "Unnamed lead";
  const note = String(lead?.description ?? "").trim();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  // Call and WhatsApp sit inside a clickable row. Without stopPropagation the
  // row navigates to the lead the instant the tap lands, and the dialer opens
  // on a page that is already unmounting.
  const stop = (e) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${name}`}
      className="group relative flex items-center gap-3 border-b border-border/60 py-3 pl-4 pr-3 text-left transition-colors last:border-b-0 hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {/* Severity stripe — the panel's whole scanning affordance. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 h-9 w-[3px] -translate-y-1/2 rounded-r-full ${severity.stripe}`}
      />

      {/* Below sm the width buys more as name than as decoration. */}
      <span
        className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:flex ${tintFor(
          lead?.id || name
        )}`}
      >
        {getInitials(name)}
      </span>

      {/* Name + note. Flexible column: everything to its right is fixed-width,
          so the pills and timings line up down the list instead of stepping
          in and out with each name length. */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-foreground sm:truncate">
          {name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {note || "No notes yet"}
        </p>
      </div>

      {lead?.status && (
        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium md:inline-block ${pillClassFor(
            lead.status
          )}`}
        >
          {lead.status}
        </span>
      )}

      <span className="hidden w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground lg:block">
        {isDueToday ? formatDueClock(lead.dueAt) : formatDueDate(lead.dueAt)}
      </span>

      <span
        className={`hidden w-24 shrink-0 items-center justify-end gap-1 text-xs font-semibold tabular-nums sm:flex ${severity.text}`}
      >
        <Icon name="Clock" size={13} />
        {urgency}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Call. When the phone is masked the control stays — its absence
            would read as "no number on file" — but href, aria-label and title
            all go, because each one is readable without placing the call. */}
        {canSeePhone && phone ? (
          <a
            href={`tel:${phone}`}
            onClick={stop}
            aria-label={`Call ${name} on ${lead.phoneNumber}`}
            title={lead.phoneNumber}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="PhoneCall" size={16} />
          </a>
        ) : (
          <span
            aria-label="Calling is restricted"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground/60"
          >
            <Icon name="PhoneOff" size={16} />
          </span>
        )}

        {/* WhatsApp is hidden outright when masked: wa.me/<number> puts the
            phone number in a URL, which is the thing masking exists to stop. */}
        {canSeePhone && phone && (
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            aria-label={`Message ${name} on WhatsApp`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="MessageCircle" size={16} />
          </a>
        )}

        <Icon
          name="ChevronRight"
          size={16}
          className="text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

const FollowUpPanel = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { dueToday, overdue, total, dataUpdatedAt } = useFollowUpAlerts();

  // Dismissal is per-visit by design: component state, not storage. Work that
  // is still overdue tomorrow morning should not stay hidden because someone
  // waved it away once today.
  const [isDismissed, setIsDismissed] = useState(false);
  const hasChimed = useRef(false);

  const canSeePhone = useMemo(() => canReadField("Lead", "phoneNumber"), []);

  // Due-today first: it is still actionable in time. Overdue has already
  // slipped, so it reads as the tail of the list rather than the headline.
  const rows = useMemo(
    () =>
      [
        ...dueToday.map((lead) => ({ lead, isDueToday: true })),
        ...overdue.map((lead) => ({ lead, isDueToday: false })),
      ].slice(0, MAX_ROWS),
    [dueToday, overdue]
  );

  // Once per visit, on first appearance. The ref guard matters because the
  // count can change mid-visit when the query refreshes, and a chime on every
  // refresh would be noise.
  useEffect(() => {
    if (hasChimed.current || isDismissed || total === 0) return;
    hasChimed.current = true;
    playChime();
  }, [total, isDismissed]);

  if (isDismissed || total === 0) return null;

  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const hiddenCount = total - rows.length;

  const viewOverdue = () => navigate("/pipeline");
  const viewAllLeads = () => navigate("/leads");

  const entrance = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        // transform + opacity only. A blur() entrance re-rasterises the whole
        // card every frame and visibly stutters on a list this size.
        initial: { opacity: 0, y: -8, scale: 0.995 },
        animate: { opacity: 1, y: 0, scale: 1 },
      };

  return (
    <motion.section
      {...entrance}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Follow-ups that need attention"
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 px-4 pt-4 sm:px-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <Icon name="BellRing" size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            What needs your attention today
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="Clock3" size={13} className="shrink-0 text-amber-500" />
            Stay on top of your leads and never miss an opportunity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {updatedAt && (
            // The dot is a liveness cue, not decoration: it says the figure
            // beside it came from a real fetch rather than page load.
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Updated {updatedAt}
            </span>
          )}

          <button
            type="button"
            onClick={viewOverdue}
            className="hidden items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
          >
            View overdue leads
            <Icon name="ArrowRight" size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss follow-up panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* Bucket counts — the true totals, not the capped row count. */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
        {dueToday.length > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-700">
            <Icon name="BellRing" size={14} />
            {dueToday.length} follow-up{dueToday.length === 1 ? "" : "s"} today
          </span>
        )}
        {overdue.length > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700">
            <Icon name="Clock" size={14} />
            {overdue.length} overdue lead{overdue.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* List — capped so a heavy day cannot push the rest of the dashboard
          below the fold. */}
      <div
        className="overflow-y-auto border-t border-border"
        style={{ maxHeight: LIST_MAX_HEIGHT }}
      >
        {rows.map(({ lead, isDueToday }) => (
          <AlertRow
            key={lead.id}
            lead={lead}
            isDueToday={isDueToday}
            canSeePhone={canSeePhone}
            onOpen={() => navigate(`/Lead/view/${lead.id}`)}
          />
        ))}
      </div>

      {/* Below sm the header pill is hidden, so the primary action comes back
          here full-width and thumb-reachable rather than vanishing. */}
      <div className="border-t border-border p-3 sm:hidden">
        <button
          type="button"
          onClick={viewOverdue}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 py-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View overdue leads
          <Icon name="ArrowRight" size={14} />
        </button>
      </div>

      {/* Footer. The left side exists because the row cap would otherwise read
          as "that is all of it". */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 sm:px-5">
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={viewOverdue}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            +{hiddenCount} more waiting — open the pipeline
            <Icon name="ArrowRight" size={13} />
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={viewAllLeads}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Show all leads
          <Icon name="ArrowUpRight" size={13} />
        </button>
      </div>
    </motion.section>
  );
};

export default FollowUpPanel;
