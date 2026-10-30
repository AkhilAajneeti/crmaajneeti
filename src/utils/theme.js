/**
 * Per-user colour theme.
 *
 * The whole CRM paints from the CSS custom properties declared in
 * `styles/tailwind.css`; a theme is therefore nothing but a `data-theme`
 * attribute on <html> that swaps those values. Nothing in a component needs to
 * know which theme is live.
 */

// Users who get the pink theme. Matched case-insensitively against the login
// object's `username`, so "HR" and "hr" both count.
const PINK_USERNAMES = ["hr"];

// ...and anyone whose role/type is HR, which is how the same person looks after
// a rename of their login.
const PINK_ROLES = ["hr"];

const DEFAULT_THEME = "default";
const PINK_THEME = "pink";

const normalize = (value) => String(value || "").trim().toLowerCase();

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("login_object");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export const resolveTheme = (user = getStoredUser()) => {
  if (!user) return DEFAULT_THEME;

  if (PINK_USERNAMES.includes(normalize(user?.username))) return PINK_THEME;

  const roles = [user?.type, ...(user?.roles || [])].map(normalize);
  if (roles.some((role) => PINK_ROLES.includes(role))) return PINK_THEME;

  return DEFAULT_THEME;
};

/**
 * Point <html> at the theme the current login should see. Safe to call on every
 * mount, after login and after logout — it only ever writes the attribute.
 */
export const applyTheme = (user) => {
  const theme = resolveTheme(user);

  if (typeof document === "undefined") return theme;

  if (theme === DEFAULT_THEME) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }

  return theme;
};
