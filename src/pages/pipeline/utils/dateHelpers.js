// EspoCRM datetime helpers.
//
// EspoCRM stores datetimes in UTC and returns them as "YYYY-MM-DD HH:MM:SS"
// strings (no timezone marker). To parse correctly in JS you must:
//   1. Replace the space with "T" so it's a valid ISO 8601 date-only fragment.
//   2. Append "Z" so JS treats it as UTC instead of local time.
// Otherwise "is today / overdue" classifications drift by your local offset
// (often a full day for users in IST / PST).

/** Parse an EspoCRM datetime string into a JS Date (or null). */
export const parseEspoToLocal = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).trim();
  if (!str) return null;
  // Already has timezone info (Z or ±HH:MM)? trust it.
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(str);
  const normalized = str.replace(" ", "T") + (hasTz ? "" : "Z");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Convert a value (datetime-local input, ISO string, Date, or Espo string)
 * back into Espo format "YYYY-MM-DD HH:MM:SS". Returns null on bad input.
 * Treats datetime-local values as UTC by default (no timezone shift).
 */
export const toEspoDateTime = (value) => {
  if (!value) return null;
  // If already Espo-shaped, return as-is.
  if (typeof value === "string") {
    const match = value
      .trim()
      .replace("T", " ")
      .match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(?::(\d{2}))?/);
    if (!match) return null;
    return `${match[1]} ${match[2]}:${match[3] || "00"}`;
  }
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    const pad = (n) => String(n).padStart(2, "0");
    // Espo speaks UTC — use UTC getters.
    return (
      `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ` +
      `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`
    );
  }
  return null;
};

/** Convert Espo datetime → "YYYY-MM-DDTHH:MM" suitable for a datetime-local input. */
export const fromEspoToLocalInput = (value) => {
  const d = parseEspoToLocal(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  // Use UTC so what the user sees matches what's stored.
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
};

// --- comparison utilities (operate on parsed Dates, treating the user's local
// midnight as the threshold for "today") ---

/** Midnight at the start of today in the user's local zone. */
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Midnight at the start of tomorrow in the user's local zone. */
const startOfTomorrow = () => {
  const t = startOfToday();
  t.setDate(t.getDate() + 1);
  return t;
};

export const isToday = (value) => {
  const d = parseEspoToLocal(value);
  if (!d) return false;
  return d >= startOfToday() && d < startOfTomorrow();
};

export const isBeforeToday = (value) => {
  const d = parseEspoToLocal(value);
  if (!d) return false;
  return d < startOfToday();
};

/** True if the datetime falls within [now, now + windowDays] going forward. */
export const isWithinNextDays = (value, windowDays) => {
  const d = parseEspoToLocal(value);
  if (!d) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + windowDays);
  return d >= startOfToday() && d <= cutoff;
};

/** Days since the given datetime. Negative if in the future. */
export const daysSince = (value) => {
  const d = parseEspoToLocal(value);
  if (!d) return Infinity;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};
