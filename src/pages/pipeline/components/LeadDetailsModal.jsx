import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Icon from "../../../components/AppIcon";
import { getStatusTheme } from "utils/leadStatus";
import { parseEspoToLocal } from "../utils/dateHelpers";

// Accent per classifier category. It tints the header badge, every icon glyph
// and the panel's glow, so the panel reads as the board card enlarged.
const CATEGORY_ACCENT = {
  overdue: { rgb: "220,38,38", icon: "AlertCircle", label: "Overdue" },
  due_today: { rgb: "217,119,6", icon: "CalendarClock", label: "Due today" },
  upcoming: { rgb: "37,99,235", icon: "CalendarDays", label: "Upcoming" },
  active: { rgb: "5,150,105", icon: "Activity", label: "Active" },
  budget_issue: { rgb: "147,51,234", icon: "Wallet", label: "Budget issue" },
  stale: { rgb: "107,114,128", icon: "Archive", label: "Stale" },
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
// only ever the primary, and older records may carry just the scalar.
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

const namesOf = (map) =>
  map ? Object.entries(map).map(([id, name]) => ({ id, name })) : [];

/* ── Building blocks ─────────────────────────────────────────────────────
   Three glass depths, lightest to darkest: the panel, the cards sitting on
   it, and the tiles nested inside those. Each step up is a touch more opaque
   with its own top highlight, which is what separates the layers without
   needing hard borders. */

const IconTile = ({ name, rgb, size = 44 }) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[0_2px_6px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.03]"
    style={{ width: size, height: size, color: `rgb(${rgb})` }}
  >
    <Icon name={name} size={size >= 44 ? 20 : 17} />
  </span>
);

const Label = ({ children }) => (
  <p className="text-[12.5px] leading-none text-slate-500">{children}</p>
);

const Value = ({ children }) => (
  <div className="mt-1.5 text-[15px] font-semibold leading-snug text-slate-900">
    {children || <span className="font-medium text-slate-400">None</span>}
  </div>
);

/** A row inside a stack card. Rows after the first carry a hairline above. */
const StackRow = ({ icon, rgb, label, children, first }) => (
  <div className={first ? "" : "border-t border-black/[0.06]"}>
    <div className="flex items-start gap-3.5 px-4 py-3.5">
      <IconTile name={icon} rgb={rgb} />
      <div className="min-w-0 flex-1 pt-0.5">
        <Label>{label}</Label>
        <Value>{children}</Value>
      </div>
    </div>
  </div>
);

const StackCard = ({ children }) => (
  <div className="overflow-hidden rounded-[20px] bg-white/55 shadow-[0_1px_2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-white/60">
    {children}
  </div>
);

/** A titled group whose fields sit in their own nested tiles. */
const Section = ({ icon, rgb, title, children, cols }) => (
  <div className="rounded-[20px] bg-white/55 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-white/60">
    <div className="mb-3 flex items-center gap-2.5">
      <IconTile name={icon} rgb={rgb} size={32} />
      <h4 className="text-[16px] font-semibold text-slate-900">{title}</h4>
    </div>
    <div className={`grid gap-3 ${cols}`}>{children}</div>
  </div>
);

const MiniField = ({ icon, rgb, label, children, className = "" }) => (
  <div
    className={`flex items-start gap-3 rounded-[16px] bg-white/45 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 ${className}`}
  >
    <IconTile name={icon} rgb={rgb} size={38} />
    <div className="min-w-0 flex-1 pt-0.5">
      <Label>{label}</Label>
      <Value>{children}</Value>
    </div>
  </div>
);

const Chip = ({ dot, className = "", children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${className}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
    {children}
  </span>
);

/**
 * Lead details as a centred panel rather than a side drawer, carrying every
 * field the Leads drawer shows on its Overview and Assigned User tabs. The
 * Feedback and Activity tabs stay out — they are streams, not details.
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
  const rgb = accent.rgb;
  const statusTheme = getStatusTheme(lead?.status);
  const phones = getPhoneRows(lead);
  const followers = namesOf(lead?.followersNames);
  const teams = namesOf(lead?.teamsNames);

  const name =
    lead?.name ||
    [lead?.firstName, lead?.lastName].filter(Boolean).join(" ") ||
    "Untitled Lead";

  const place =
    lead?.addressCity || lead?.accountName || lead?.cProjectName || lead?.cProject || "";

  return createPortal(
    <AnimatePresence>
      {isOpen && lead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[5px]"
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
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white/70 backdrop-blur-2xl ring-1 ring-white/70"
            style={{
              boxShadow: `0 50px 110px -35px rgba(15,23,42,0.55), 0 0 0 1px rgba(${rgb},0.1), 0 24px 70px -30px rgba(${rgb},0.4), inset 0 1px 0 rgba(255,255,255,0.85)`,
            }}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.9 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 sm:px-7">
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full text-white"
                  style={{
                    background: `linear-gradient(160deg, rgba(${rgb},0.95), rgb(${rgb}))`,
                    boxShadow: `0 10px 26px -10px rgba(${rgb},0.9), 0 0 0 10px rgba(${rgb},0.12), inset 0 1px 0 rgba(255,255,255,0.35)`,
                  }}
                >
                  <Icon name={accent.icon} size={28} />
                </span>

                <div className="min-w-0">
                  <h3 className="truncate text-[27px] font-bold leading-tight tracking-tight text-slate-900">
                    {name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    {place && (
                      <span className="inline-flex items-center gap-1.5 text-[14px] text-slate-500">
                        <Icon name="MapPin" size={15} />
                        {place}
                      </span>
                    )}
                    {/* The surface stays glass; the category colour rides on
                        the dot and the label. */}
                    <Chip dot={`rgb(${rgb})`} className="bg-white/70 ring-1 ring-white/70">
                      <span style={{ color: `rgb(${rgb})` }}>{accent.label}</span>
                    </Chip>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70 transition-colors hover:bg-white hover:text-slate-900"
              >
                <Icon name="X" size={19} />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 overflow-y-auto px-6 pb-6 sm:px-7">
              {/* Two stacks, side by side */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <StackCard>
                  <StackRow first icon="UserRound" rgb={rgb} label="Lead Name">
                    {name}
                  </StackRow>

                  <StackRow icon="PhoneCall" rgb={rgb} label="Contact">
                    {phones.length ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {phones.map((row, i) => (
                          <span key={`${row.phoneNumber}-${i}`} className="inline-flex items-center gap-2">
                            <a
                              href={`tel:${row.phoneNumber}`}
                              className="underline decoration-current/30 underline-offset-2"
                              style={{ color: `rgb(${rgb})` }}
                            >
                              {row.phoneNumber}
                            </a>
                            <Chip className="bg-white/70 font-medium text-slate-600 ring-1 ring-black/[0.04]">
                              {row.type}
                            </Chip>
                            {row.primary && phones.length > 1 && (
                              <Chip className="bg-amber-50 text-amber-700">Primary</Chip>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </StackRow>

                  <StackRow icon="MapPinned" rgb={rgb} label="City">
                    {lead?.addressCity}
                  </StackRow>

                  <StackRow icon="ShieldCheck" rgb={rgb} label="OTP Verified">
                    {lead?.cOTPVerified || "No"}
                  </StackRow>
                </StackCard>

                <StackCard>
                  <StackRow first icon="Mail" rgb={rgb} label="Email">
                    {lead?.emailAddress ? (
                      <a
                        href={`mailto:${lead.emailAddress}`}
                        className="break-all underline decoration-current/30 underline-offset-2"
                        style={{ color: `rgb(${rgb})` }}
                      >
                        {lead.emailAddress}
                      </a>
                    ) : null}
                  </StackRow>

                  <StackRow icon="CalendarClock" rgb={rgb} label="Next Contact">
                    {formatDateTime(lead?.cNextContact)}
                  </StackRow>

                  <StackRow icon="MessageCircleQuestion" rgb={rgb} label="Question">
                    {lead?.cQuestion ? (
                      <p className="whitespace-pre-line break-words">{lead.cQuestion}</p>
                    ) : null}
                  </StackRow>
                </StackCard>
              </div>

              <Section
                icon="SlidersHorizontal"
                rgb={rgb}
                title="Details"
                cols="sm:grid-cols-2 xl:grid-cols-4"
              >
                <MiniField icon="CircleDot" rgb={rgb} label="Status">
                  {lead?.status ? (
                    <Chip className={`${statusTheme.pill} !text-[12.5px]`}>{lead.status}</Chip>
                  ) : null}
                </MiniField>

                <MiniField icon="Flag" rgb={rgb} label="Priority">
                  {lead?.priority ? (
                    <Chip dot={`rgb(${rgb})`} className="bg-white/70 text-slate-800 ring-1 ring-black/[0.04]">
                      {lead.priority}
                    </Chip>
                  ) : null}
                </MiniField>

                <MiniField icon="Radio" rgb={rgb} label="Source">
                  {lead?.source}
                </MiniField>

                <MiniField icon="NotepadText" rgb={rgb} label="Description">
                  {lead?.description ? (
                    <p className="whitespace-pre-line break-words">{lead.description}</p>
                  ) : null}
                </MiniField>
              </Section>

              <Section
                icon="UsersRound"
                rgb={rgb}
                title="Assignment"
                cols="sm:grid-cols-2 xl:grid-cols-3"
              >
                <MiniField icon="UserRound" rgb={rgb} label="Assigned User">
                  {lead?.assignedUserName}
                </MiniField>

                <MiniField icon="Users" rgb={rgb} label="Teams">
                  {teams.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {teams.map((t) => (
                        <Chip key={t.id} dot="#10b981" className="bg-emerald-50 text-emerald-700">
                          {t.name}
                        </Chip>
                      ))}
                    </div>
                  ) : null}
                </MiniField>

                <MiniField icon="UserPlus" rgb={rgb} label="Followers">
                  {followers.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {followers.map((f) => (
                        <Chip key={f.id} dot="#3b82f6" className="bg-sky-50 text-sky-700">
                          {f.name}
                        </Chip>
                      ))}
                    </div>
                  ) : null}
                </MiniField>
              </Section>

              <Section
                icon="Clock"
                rgb={rgb}
                title="Record"
                cols="sm:grid-cols-2"
              >
                <MiniField icon="CalendarPlus" rgb={rgb} label="Created">
                  {formatDateTime(lead?.createdAt)}
                  {lead?.createdByName && (
                    <span className="mt-0.5 block text-[13px] font-medium text-slate-500">
                      by {lead.createdByName}
                    </span>
                  )}
                </MiniField>

                <MiniField icon="History" rgb={rgb} label="Last Modified">
                  {formatDateTime(lead?.modifiedAt)}
                  {lead?.modifiedByName && (
                    <span className="mt-0.5 block text-[13px] font-medium text-slate-500">
                      by {lead.modifiedByName}
                    </span>
                  )}
                </MiniField>
              </Section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/60 bg-white/45 px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[14px] bg-white/85 px-6 py-2.5 text-[15px] font-semibold text-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.05] transition-colors hover:bg-white"
              >
                Close
              </button>
              {onOpenFullRecord && (
                <button
                  type="button"
                  onClick={() => onOpenFullRecord(lead)}
                  className="flex items-center gap-2 rounded-[14px] px-6 py-2.5 text-[15px] font-semibold text-white transition-all hover:brightness-110"
                  style={{
                    background: "linear-gradient(160deg, #b2152f, #9b0428)",
                    boxShadow:
                      "0 10px 24px -10px rgba(155,4,40,0.85), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  Open full record
                  <Icon name="ArrowUpRight" size={16} />
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
