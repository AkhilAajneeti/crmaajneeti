/**
 * Dark mode.
 *
 * The CRM paints entirely from the CSS custom properties in
 * `styles/tailwind.css`, so dark mode is one attribute on <html> that swaps
 * those values — exactly like `utils/theme.js` does for the per-user colour
 * theme. No component needs to know which mode is live.
 *
 * It writes `data-mode`, NOT `data-theme`, so the two compose: an HR user on
 * the pink theme can also run dark without a separate pink-dark palette.
 */

const STORAGE_KEY = "color_mode";
const DARK = "dark";
const LIGHT = "light";

/**
 * The mode to show.
 *
 * Light unless the user has explicitly chosen dark. This deliberately does
 * NOT follow `prefers-color-scheme`: the CRM is a shared-desktop tool and
 * light is the house default, so a machine configured for dark should not
 * silently change how the product looks for everyone who sits at it.
 */
export const resolveMode = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) return stored;
  } catch {
    // Private mode / storage disabled — fall through to the default.
  }
  return LIGHT;
};

/**
 * Point <html> at a mode. Safe to call on every mount and after login — it
 * only ever writes the attribute.
 */
export const applyMode = (mode) => {
  if (typeof document === "undefined") return mode;

  if (mode === DARK) {
    document.documentElement.setAttribute("data-mode", DARK);
  } else {
    // Removed rather than set to "light", so the default `:root` block is
    // what applies and there is only ever one source of truth.
    document.documentElement.removeAttribute("data-mode");
  }

  return mode;
};

/** Persist a choice and apply it. Returns the mode that is now live. */
export const setMode = (mode) => {
  const next = mode === DARK ? DARK : LIGHT;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not fatal: the attribute still applies for this session.
  }
  return applyMode(next);
};

export const toggleMode = (current) => setMode(current === DARK ? LIGHT : DARK);

/** Read the stored/system preference and apply it. Called once at boot. */
export const initMode = () => applyMode(resolveMode());

export const isDark = (mode) => mode === DARK;

export { DARK, LIGHT };
