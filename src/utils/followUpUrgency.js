// How late is this follow-up, and how loudly should the UI say so.
//
// A single red for every overdue row turns a list of 24 into a wall where
// nothing stands out — the lead three hours late and the lead three weeks late
// look identical, so the eye picks neither. The scale below gives lateness a
// visible gradient: today is amber, and red deepens with each threshold.
//
// Class strings are written out literally. Tailwind's JIT only emits what it
// can read in the source, so `bg-red-${n}` compiles to nothing and the stripe
// renders invisible.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const SEVERITY = {
  today: { stripe: "bg-orange-400", text: "text-orange-600" },
  late0: { stripe: "bg-red-300", text: "text-red-500" },
  late3: { stripe: "bg-red-400", text: "text-red-500" },
  late7: { stripe: "bg-red-500", text: "text-red-600" },
  late14: { stripe: "bg-red-600", text: "text-red-700" },
  late14plus: { stripe: "bg-red-700", text: "text-red-800" },
};

/**
 * @param {Date} dueAt
 * @param {boolean} isDueToday  bucket membership, not a date comparison — a
 *   lead due at 09:00 today is still "today" at 18:00, just late within it.
 * @param {number} now          injectable for deterministic tests
 */
export const getSeverity = (dueAt, isDueToday, now = Date.now()) => {
  if (isDueToday) return SEVERITY.today;

  const lateBy = now - (dueAt?.getTime?.() ?? now);
  if (lateBy < DAY) return SEVERITY.late0;
  if (lateBy < 3 * DAY) return SEVERITY.late3;
  if (lateBy < 7 * DAY) return SEVERITY.late7;
  if (lateBy < 14 * DAY) return SEVERITY.late14;
  return SEVERITY.late14plus;
};

/**
 * Relative urgency text: "in 45 min", "in 3h", "Due now", "20 min late",
 * "6h late", "3d late".
 *
 * Relative, never a timestamp — "14:30" makes the reader subtract the current
 * time themselves before they know whether to care.
 */
export const getUrgencyLabel = (dueAt, now = Date.now()) => {
  const due = dueAt?.getTime?.();
  if (!due || Number.isNaN(due)) return "";

  const diff = due - now;
  const ahead = Math.abs(diff);

  // Either side of the hour, "now" is the honest answer.
  if (ahead < 2 * MINUTE) return "Due now";

  if (diff > 0) {
    if (ahead < HOUR) return `in ${Math.round(ahead / MINUTE)} min`;
    if (ahead < DAY) return `in ${Math.round(ahead / HOUR)}h`;
    return `in ${Math.round(ahead / DAY)}d`;
  }

  if (ahead < HOUR) return `${Math.round(ahead / MINUTE)} min late`;
  if (ahead < DAY) return `${Math.round(ahead / HOUR)}h late`;
  return `${Math.round(ahead / DAY)}d late`;
};

/** "2:30 PM" — shown beside the status pill, as context rather than urgency. */
export const formatDueClock = (dueAt) => {
  if (!dueAt || Number.isNaN(dueAt.getTime?.())) return "";
  return dueAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

/** "12 Mar" — for rows whose due date is not today. */
export const formatDueDate = (dueAt) => {
  if (!dueAt || Number.isNaN(dueAt.getTime?.())) return "";
  return dueAt.toLocaleDateString([], { day: "numeric", month: "short" });
};

/** "AK" from "Akhil Kumar"; falls back to a dash rather than rendering empty. */
export const getInitials = (name) => {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
