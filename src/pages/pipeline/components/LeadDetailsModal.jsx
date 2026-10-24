import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Icon from "../../../components/AppIcon";
import { getStatusTheme } from "utils/leadStatus";
import { parseEspoToLocal } from "../utils/dateHelpers";

// Accent per classifier category, matching the board card the panel opened
// from, so it reads as that card enlarged rather than a generic dialog.
const CATEGORY_ACCENT = {
  overdue: { glow: "239,68,68", chip: "bg-red-50 text-red-700", icon: "AlertCircle", label: "Overdue" },
  due_today: { glow: "245,158,11", chip: "bg-amber-50 text-amber-700", icon: "CalendarClock", label: "Due today" },
  upcoming: { glow: "59,130,246", chip: "bg-blue-50 text-blue-700", icon: "CalendarDays", label: "Upcoming" },
  active: { glow: "16,185,129", chip: "bg-emerald-50 text-emerald-700", icon: "Activity", label: "Active" },
  budget_issue: { glow: "168,85,247", chip: "bg-purple-50 text-purple-700", icon: "Wallet", label: "Budget issue" },
  stale: { glow: "156,163,175", chip: "bg-gray-100 text-gray-700", icon: "Archive", label: "Stale" },
};

const formatDateTime = (value) => {
  const d = parseEspoToLocal(value);
  if (!d) return null;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// EspoCRM keeps every number in phoneNumberData; the scalar phoneNumber is
// only ever the primary one, and older records may carry just the scalar.
const getPhoneRows = (record) => {
  const rows = Array.isArray(record?.phoneNumberData) ? record.phoneNumberData : [];
  if (rows.length) {
    return rows
      .map((row) => ({
        phoneNumber: row?.phoneNumber || "",
        type: row?.type || "Mobile",
        primary: !!row?.primary,
      }))
      .filter((row) => row.phoneNumber && row.phoneNumber !== "+91");
  }
  return record?.phoneNumber
    ? [{ phoneNumber: record.phoneNumber, type: "Mobile", primary: true }]
    : [];
};

const namesOf = (map) => (map ? Object.entries(map).map(([id, name]) => ({ id, name })) : []);

/** Section label trailed by a hairline that fades out across the panel. */
const Divider = ({ label }) => (
  <div className="col-span-full mt-1 flex items-center gap-3 first:mt-0">
    <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </span>
    <span className="h-px flex-1 bg-gradient-to-r from-black/[0.12] via-black/[0.06] to-transparent" />
  </div>
);

/** Frosted chip + label + value. The chip is the morphism element: a light
 *  surface with a top highlight and a soft drop, so it lifts off the glass. */
const Field = ({ icon, label, children, className = "" }) => (
  <div className={`flex min-w-0 items-start gap-3 ${className}`}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-b from-white to-white/60 text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.04]">
      <Icon name={icon} size={16} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-[14px] font-medium leading-snug text-foreground">
        {children || <span className="text-muted-foreground">None</span>}
      </div>
    </div>
  </div>
);

const Chip = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${className}`}
  >
    {children}
  </span>
);

/**
 * Lead details as a centred panel rather than a side drawer, carrying every
 * field the Leads drawer shows on its Overview and Assigned User tabs. The
 * Feedback and Activity tabs are deliberately left out — they are streams, not
 * details, and belong in the full record.
 *
 * The open animation is the macOS sheet feel: the panel springs up from 92%
 * with a short overshoot while the backdrop blurs in behind it.
 */
const LeadDetailsModal = ({ lead, isOpen, onClose, onOpenFullRecord }) => {
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
  const phones = getPhoneRows(lead);
  const followers = namesOf(lead?.followersNames);
  const teams = namesOf(lead?.teamsNames);

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
          <motion.div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[4px]"
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
            className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white/80 backdrop-blur-2xl"
            style={{
              boxShadow: `0 40px 90px -30px rgba(15,23,42,0.45), 0 0 0 1px rgba(${accent.glow},0.16), 0 18px 60px -28px rgba(${accent.glow},0.5), inset 0 1px 0 rgba(255,255,255,0.75)`,
            }}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.9 }}
          >
            {/* Accent wash down from the top edge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              style={{
                background: `linear-gradient(180deg, rgba(${accent.glow},0.16) 0%, rgba(${accent.glow},0) 100%)`,
              }}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-4 px-6 py-5">
              <div className="flex min-w-0 items-start gap-3.5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_6px_16px_-6px_rgba(15,23,42,0.6),inset_0_1px_0_rgba(255,255,255,0.4)]"
                  style={{ background: `rgb(${accent.glow})` }}
                >
                  <Icon name={accent.icon} size={21} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h3 className="truncate text-[20px] font-semibold leading-tight text-foreground">
                    {name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {subtitle && (
                      <span className="truncate text-[13px] text-muted-foreground">
                        {subtitle}
                      </span>
                    )}
                    <Chip className={accent.chip}>{accent.label}</Chip>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white to-white/70 text-slate-500 shadow-[0_1px_3px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.04] transition-colors hover:text-foreground"
              >
                <Icon name="X" size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="relative grid grid-cols-1 gap-x-6 gap-y-5 overflow-y-auto px-6 pb-6 sm:grid-cols-2">
              <Divider label="Lead" />

              <Field icon="UserRound" label="Name">
                {name}
              </Field>

              <Field icon="Mail" label="Email">
                {lead?.emailAddress ? (
                  <a
                    href={`mailto:${lead.emailAddress}`}
                    className="break-all text-primary hover:underline"
                  >
                    {lead.emailAddress}
                  </a>
                ) : null}
              </Field>

              <Field icon="PhoneCall" label="Contact" className="sm:col-span-2">
                {phones.length ? (
                  <div className="flex flex-wrap gap-2">
                    {phones.map((row, index) => (
                      <span
                        key={`${row.phoneNumber}-${index}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.04]"
                      >
                        <a
                          href={`tel:${row.phoneNumber}`}
                          className="text-[13.5px] text-primary hover:underline"
                        >
                          {row.phoneNumber}
                        </a>
                        <span className="text-[11px] text-muted-foreground">
                          {row.type}
                        </span>
                        {row.primary && phones.length > 1 && (
                          <Chip className="bg-amber-50 text-amber-700">Primary</Chip>
                        )}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Field>

              <Field icon="MapPinned" label="City">
                {lead?.addressCity}
              </Field>

              <Field icon="CalendarClock" label="Next Contact">
                {formatDateTime(lead?.cNextContact)}
              </Field>

              <Field icon="ShieldCheck" label="OTP Verified">
                {lead?.cOTPVerified || "No"}
              </Field>

              <Field icon="MessageCircleQuestion" label="Question">
                {lead?.cQuestion}
              </Field>

              <Divider label="Details" />

              <Field icon="CircleDot" label="Status">
                {lead?.status ? (
                  <Chip className={statusTheme.pill}>{lead.status}</Chip>
                ) : null}
              </Field>

              <Field icon="Radio" label="Source">
                {lead?.source}
              </Field>

              <Field icon="Flag" label="Priority">
                {lead?.priority}
              </Field>

              <Field icon="NotepadText" label="Description" className="sm:col-span-2">
                {lead?.description ? (
                  <p className="whitespace-pre-line break-words font-normal leading-relaxed">
                    {lead.description}
                  </p>
                ) : null}
              </Field>

              <Divider label="Assignment" />

              <Field icon="UserCheck" label="Assigned User">
                {lead?.assignedUserName}
              </Field>

              <Field icon="UserPlus" label="Followers">
                {followers.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {followers.map((f) => (
                      <Chip key={f.id} className="bg-sky-50 text-sky-700">
                        {f.name}
                      </Chip>
                    ))}
                  </div>
                ) : null}
              </Field>

              <Field icon="Users" label="Teams" className="sm:col-span-2">
                {teams.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {teams.map((t) => (
                      <Chip key={t.id} className="bg-teal-50 text-teal-700">
                        {t.name}
                      </Chip>
                    ))}
                  </div>
                ) : null}
              </Field>

              <Divider label="Record" />

              <Field icon="CalendarPlus" label="Created">
                {formatDateTime(lead?.createdAt)}
                {lead?.createdByName && (
                  <span className="block text-[12.5px] font-normal text-muted-foreground">
                    by {lead.createdByName}
                  </span>
                )}
              </Field>

              <Field icon="History" label="Last Modified">
                {formatDateTime(lead?.modifiedAt)}
                {lead?.modifiedByName && (
                  <span className="block text-[12.5px] font-normal text-muted-foreground">
                    by {lead.modifiedByName}
                  </span>
                )}
              </Field>
            </div>

            {/* Footer */}
            <div className="relative flex items-center justify-end gap-2 border-t border-white/70 bg-white/50 px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_6px_16px_-8px_rgba(172,35,52,0.9),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:brightness-110"
                >
                  Open full record
                  <Icon name="ArrowUpRight" size={15} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LeadDetailsModal;
