// Company holiday calendar.
//
// Transcribed from the HR sheet "Aajneeti Connect Limited – 2026 Holidays".
// Every weekday printed on that sheet was checked against the real calendar
// before this list was committed; all eleven matched.
//
// To add next year: append a HOLIDAYS[year] block. Dates are ISO (yyyy-mm-dd)
// and local — never parse them with `new Date("yyyy-mm-dd")`, which reads as
// UTC and lands on the previous evening in IST. Use parseHolidayDate below.
export const HOLIDAYS = {
  2026: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-01-26", name: "Republic Day" },
    { date: "2026-03-04", name: "Holi" },
    { date: "2026-08-15", name: "Independence Day" },
    { date: "2026-08-28", name: "Rakshabandhan" },
    { date: "2026-09-04", name: "Janmashtami" },
    { date: "2026-10-02", name: "Mahatma Gandhi Jayanti" },
    { date: "2026-10-20", name: "Dussehra" },
    { date: "2026-11-08", name: "Diwali" },
    { date: "2026-11-09", name: "Govardhan Puja" },
    { date: "2026-11-10", name: "Bhai Dooj" },
  ],
};

/** Every holiday across all known years, flattened. */
export const ALL_HOLIDAYS = Object.values(HOLIDAYS).flat();

/** Holidays for one year, or an empty list for a year we have no sheet for. */
export const getHolidays = (year) => HOLIDAYS[year] || [];

// Date-keyed lookup, built once.
const HOLIDAY_BY_DATE = ALL_HOLIDAYS.reduce((map, holiday) => {
  map[holiday.date] = holiday;
  return map;
}, {});

/** Local midnight for an ISO date, avoiding the UTC shift. */
export const parseHolidayDate = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** The yyyy-mm-dd key for a Date, in local time. */
export const toDateKey = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

/** The holiday on a given date, or undefined. Accepts a Date or a date key. */
export const getHoliday = (value) =>
  HOLIDAY_BY_DATE[typeof value === "string" ? value : toDateKey(value)];

export const isHoliday = (value) => Boolean(getHoliday(value));

/**
 * Holidays as FullCalendar background events. `display: "background"` tints
 * the day without taking a row, so attendance events still show normally;
 * the name rides along in extendedProps for the day-cell label.
 */
export const getHolidayEvents = () =>
  ALL_HOLIDAYS.map((holiday) => ({
    id: `holiday-${holiday.date}`,
    title: holiday.name,
    start: holiday.date,
    allDay: true,
    display: "background",
    backgroundColor: "rgba(234,88,12,0.12)",
    classNames: ["holiday-bg"],
    extendedProps: { isHoliday: true, holidayName: holiday.name },
  }));
