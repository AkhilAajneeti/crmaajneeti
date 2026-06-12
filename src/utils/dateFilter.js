// Small date utilities used by filter inputs.

/**
 * Today's date in YYYY-MM-DD format, in the user's local timezone.
 * Useful as a `max` attribute on date pickers so the user can't pick a
 * future date in a "Specific Day" / "Date Range" filter.
 */
export const todayLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
