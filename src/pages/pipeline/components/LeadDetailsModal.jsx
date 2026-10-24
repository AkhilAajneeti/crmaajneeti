import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Icon from "../../../components/AppIcon";
import { getStatusTheme } from "utils/leadStatus";
import { parseEspoToLocal } from "../utils/dateHelpers";

// Accent per classifier category, matching the board card the modal opened
// from, so the panel reads as the same object enlarged.
const CATEGORY_ACCENT = {
  overdue: { glow: "239,68,68", chip: "bg-red-50 text-red-700", icon: "AlertCircle" },
  due_today: { glow: "245,158,11", chip: "bg-amber-50 text-amber-700", icon: "CalendarClock" },
  upcoming: { glow: "59,130,246", chip: "bg-blue-50 text-blue-700", icon: "CalendarDays" },
  active: { glow: "16,185,129", chip: "bg-emerald-50 text-emerald-700", icon: "Activity" },
  budget_issue: { glow: "168,85,247", chip: "bg-purple-50 text-purple-700", icon: "Wallet" },
  stale: { glow: "156,163,175", chip: "bg-gray-100 text-gray-700", icon: "Archive" },
};

const formatDateTime = (value) => {
  const d = parseEspoToLocal(value);
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Field = ({ icon, label, children, className = "" }) => (
  <div className={`flex min-w-0 items-start gap-3 ${className}`}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-slate-500 ring-1 ring-black/5">
      <Icon name={icon} size={17} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-[14px] font-medium text-foreground">
        {children}
      </div>
    </div>
  </div>
);

/**
 * Lead details as a centred panel rather than a side drawer, matching the
 * user-details modal in Settings.
 *
 * The open animation is the macOS sheet feel: the panel springs up from 92%
 * with a short overshoot while the backdrop blurs in behind it, and collapses
 * straight back down on close.
 */
const LeadDetailsModal = ({ lead, isOpen, onClose, onOpenFullRecord }) => {
  // Esc closes, and the page behind must not scroll while the panel is up.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const accent = CATEGORY_ACCENT[lead?.category] || CATEGORY_ACCENT.stale;
  const statusTheme = getStatusTheme(lead?.status);

  const name =
    lead?.name ||
    [lead?.firstName, lead?.lastName].filter(Boolean).join(" ") ||
    "Untitled Lead";

  const subtitle =
    lead?.accountName || lead?.cProjectName || lead?.cProject || lead?.addressCity || "";

  return createPortal(
    <AnimatePresence>
      {isOpen && lead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop — blurs the board rather than blacking it out */}
          <motion.div
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} details`}
            className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-white/60 bg-white/85 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.45)] backdrop-blur-2xl"
            style={{
              boxShadow: `0 40px 90px -30px rgba(15,23,42,0.45), 0 0 0 1px rgba(${accent.glow},0.18), 0 18px 60px -28px rgba(${accent.glow},0.55)`,
            }}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.9 }}
          >
            {/* Accent wash along the top edge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28"
              style={{
                background: `linear-gradient(180deg, rgba(${accent.glow},0.16) 0%, rgba(${accent.glow},0) 100%)`,
              }}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={{ background: `rgb(${accent.glow})` }}
                >
                  <Icon name={accent.icon} size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-[19px] font-semibold leading-tight text-foreground">
                    {name}
                  </h3>
                  {subtitle && (
                    <p className="truncate text-[13px] text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-slate-500 ring-1 ring-black/5 transition-colors hover:bg-white hover:text-foreground"
              >
                <Icon name="X" size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="relative grid grid-cols-1 gap-5 overflow-y-auto px-6 py-6 sm:grid-cols-2">
              <Field icon="CircleDot" label="Status">
                {lead?.status ? (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusTheme.pill}`}
                  >
                    {lead.status}
                  </span>
                ) : (
                  "—"
                )}
              </Field>

              <Field icon="Flag" label="Priority">
                {lead?.priority || "—"}
              </Field>

              <Field icon="PhoneCall" label="Contact">
                {lead?.phoneNumber ? (
                  <a
                    href={`tel:${lead.phoneNumber}`}
                    className="text-primary hover:underline"
                  >
                    {lead.phoneNumber}
                  </a>
                ) : (
                  "—"
                )}
              </Field>

              <Field icon="Mail" label="Email">
                {lead?.emailAddress ? (
                  <a
                    href={`mailto:${lead.emailAddress}`}
                    className="break-all text-primary hover:underline"
                  >
                    {lead.emailAddress}
                  </a>
                ) : (
                  "—"
                )}
              </Field>

              <Field icon="MapPin" label="City">
                {lead?.addressCity || "—"}
              </Field>

              <Field icon="Radio" label="Source">
                {lead?.source || "—"}
              </Field>

              <Field icon="CalendarClock" label="Next follow-up">
                {formatDateTime(lead?.cNextContact)}
              </Field>

              <Field icon="UserCheck" label="Assigned to">
                {lead?.assignedUserName || "—"}
              </Field>

              {lead?.cQuestion && (
                <Field icon="MessageCircleQuestion" label="Question" className="sm:col-span-2">
                  <p className="whitespace-pre-line break-words font-normal leading-relaxed">
                    {lead.cQuestion}
                  </p>
                </Field>
              )}

              {lead?.description && (
                <Field icon="NotepadText" label="Description" className="sm:col-span-2">
                  <p className="whitespace-pre-line break-words font-normal leading-relaxed">
                    {lead.description}
                  </p>
                </Field>
              )}
            </div>

            {/* Footer */}
            <div className="relative flex items-center justify-between gap-3 border-t border-black/5 bg-white/60 px-6 py-4">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${accent.chip}`}>
                {lead?.category?.replace("_", " ") || "stale"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
                >
                  Close
                </button>
                {onOpenFullRecord && (
                  <button
                    type="button"
                    onClick={() => onOpenFullRecord(lead)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
                  >
                    Open full record
                    <Icon name="ArrowUpRight" size={15} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LeadDetailsModal;
