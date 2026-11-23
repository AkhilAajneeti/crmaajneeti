import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Icon from "../AppIcon";
import { DARK, isDark, resolveMode, toggleMode } from "../../utils/darkMode";

// Where the stars sit around the moon, relative to the button's centre.
// Hand-placed: a random scatter occasionally stacks two on one side.
const STARS = [
  { x: -13, y: -11, size: 3, delay: 0 },
  { x: 12, y: -13, size: 2.5, delay: 0.35 },
  { x: 14, y: 7, size: 2, delay: 0.7 },
];

/**
 * Light / dark switch.
 *
 * The glyph does not cross-fade — the sun rotates and shrinks out while the
 * moon rotates in, so the change reads as one object turning over rather than
 * two icons swapping. Stars drift in behind the moon once it has landed.
 */
const ThemeToggle = () => {
  const reduceMotion = useReducedMotion();
  const [mode, setModeState] = useState(() => resolveMode());
  const dark = isDark(mode);

  // The attribute is applied at boot by `initMode()`; this keeps the button's
  // own state honest if the mode is changed elsewhere (another tab, say).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "color_mode") setModeState(resolveMode());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleToggle = () => setModeState(toggleMode(mode));

  return (
    <button
      type="button"
      onClick={handleToggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* A soft halo that only exists in dark mode — it gives the moon
          something to sit in, so the button does not look empty. */}
      <AnimatePresence>
        {dark && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-secondary/15"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* `mode="wait"` so the outgoing glyph finishes turning before the
          incoming one starts — overlapping them reads as a glitch at 18px. */}
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.span
            key="moon"
            className="relative text-secondary"
            initial={reduceMotion ? false : { rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          >
            <Icon name="Moon" size={18} strokeWidth={1.9} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            className="relative text-amber-500"
            initial={reduceMotion ? false : { rotate: 90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { rotate: -90, scale: 0.4, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          >
            <Icon name="Sun" size={18} strokeWidth={1.9} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Stars, dark mode only. Decorative, and dropped entirely for anyone
          who has asked for less motion. */}
      {dark && !reduceMotion && (
        <AnimatePresence>
          {STARS.map((star, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-secondary"
              style={{ width: star.size, height: star.size }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0.45, 1],
                x: star.x,
                y: star.y,
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 2.4,
                delay: 0.25 + star.delay,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            />
          ))}
        </AnimatePresence>
      )}
    </button>
  );
};

export default ThemeToggle;
