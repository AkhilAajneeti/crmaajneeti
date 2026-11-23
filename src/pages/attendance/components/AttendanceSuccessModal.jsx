import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";


const VARIANTS = {
  leave: {
    icon: "🌞",
    title: "Time to Recharge!",
    message: [
      "Your leave request is on its way to your manager.",
      "Take this opportunity to relax, refresh, and return with even more energy."
    ],
    tip: "Taking regular breaks can improve focus, creativity, and overall well-being.",
    primary: "#F59E0B",
    circle: "from-amber-200/90 via-amber-100 to-amber-50",
    glow: "from-amber-200/40",
    tipBg: "bg-amber-50",
    tipBorder: "border-amber-100",
    tipIcon: "text-amber-500",
  },
  short: {
    icon: "⏰",
    title: "A Quick Break, Well Planned!",
    message: [
      "Your short leave request is on its way to your manager.",
      "Whether it's a personal errand, an important appointment, or simply a moment to recharge, we hope everything goes smoothly."
    ],
    tip: "Even a short break can help improve focus and productivity throughout the day.",
    primary: "#3B82F6",
    circle: "from-blue-200/90 via-blue-100 to-blue-50",
    glow: "from-blue-200/40",
    tipBg: "bg-blue-50",
    tipBorder: "border-blue-100",
    tipIcon: "text-blue-500",
  },
  slc: {
    icon: "⭐",
    title: "Great Work Deserves Recognition!",
    message: [
      "Your contribution credit request has been submitted successfully.",
      "Every effort you make helps drive the team forward, and we're excited to see your achievements recognized."
    ],
    tip: "Employee recognition helps create stronger teams and boosts workplace motivation.",
    primary: "#22C55E",
    circle: "from-green-200/90 via-green-100 to-green-50",
    glow: "from-green-200/40",
    tipBg: "bg-green-50",
    tipBorder: "border-green-100",
    tipIcon: "text-green-500",
  },
};

// ---------------------------------------------------------------------------
// Winter dress.
//
// Nov-Feb only, and worked out from the clock rather than a flag someone has
// to remember to flip — the amber sun comes back on its own in March without
// anyone touching this file. Each variant keeps its own identity (rest /
// quick break / recognition); only the palette and the glyph change, so the
// three are still told apart at a glance.
// ---------------------------------------------------------------------------
const WINTER_MONTHS = [10, 11, 0, 1]; // Nov, Dec, Jan, Feb

const isWinter = () => WINTER_MONTHS.includes(new Date().getMonth());

const WINTER = {
  leave: {
    icon: "❄️",
    title: "Cosy Days Ahead!",
    message: [
      "Your leave request is on its way to your manager.",
      "Wrap up warm, take it slow, and come back with the batteries full.",
    ],
    tip: "Shorter winter days make rest matter more — time off now pays for itself in focus later.",
    primary: "#38BDF8",
    circle: "from-sky-200/90 via-sky-100 to-white",
    glow: "from-sky-200/50",
    tipBg: "bg-sky-50",
    tipBorder: "border-sky-100",
    tipIcon: "text-sky-500",
  },
  short: {
    icon: "☕",
    title: "A Warm Little Break!",
    message: [
      "Your short leave request is on its way to your manager.",
      "An errand, an appointment, or just something hot to drink — we hope it goes smoothly.",
    ],
    tip: "Even ten minutes away from the screen resets your attention for the rest of the day.",
    primary: "#6366F1",
    circle: "from-indigo-200/90 via-indigo-100 to-white",
    glow: "from-indigo-200/50",
    tipBg: "bg-indigo-50",
    tipBorder: "border-indigo-100",
    tipIcon: "text-indigo-500",
  },
  slc: {
    icon: "⭐",
    title: "Great Work Deserves Recognition!",
    message: [
      "Your contribution credit request has been submitted successfully.",
      "Finishing the year strong — every effort you make moves the team forward.",
    ],
    tip: "Recognition given in the moment is remembered far longer than a year-end summary.",
    primary: "#14B8A6",
    circle: "from-teal-200/90 via-teal-100 to-white",
    glow: "from-teal-200/50",
    tipBg: "bg-teal-50",
    tipBorder: "border-teal-100",
    tipIcon: "text-teal-500",
  },
};

// Hand-placed, not random: a fixed set falls the same way every time, where
// Math.random() on each render occasionally drops every flake down one edge.
const SNOWFLAKES = [
  { left: "6%", size: 7, duration: 9, delay: 0, drift: 14 },
  { left: "17%", size: 4, duration: 12, delay: 1.8, drift: -10 },
  { left: "28%", size: 6, duration: 10.5, delay: 3.4, drift: 18 },
  { left: "39%", size: 3, duration: 13, delay: 0.9, drift: -14 },
  { left: "50%", size: 8, duration: 8.5, delay: 2.6, drift: 10 },
  { left: "61%", size: 5, duration: 11.5, delay: 4.2, drift: -18 },
  { left: "72%", size: 4, duration: 10, delay: 1.2, drift: 12 },
  { left: "83%", size: 7, duration: 12.5, delay: 3.0, drift: -8 },
  { left: "93%", size: 5, duration: 9.5, delay: 5.0, drift: 16 },
];

// Map a raw requestType value to a variant key.
const resolveVariant = (requestType) => {
  switch (requestType) {
    case "Short Leave":
      return "short";
    case "SLC":
      return "slc";
    case "Leave":
    case "Half Day":
    default:
      return "leave";
  }
};

const AttendanceSuccessModal = ({ isOpen, requestType, onClose }) => {
  const reduceMotion = useReducedMotion();
  const key = resolveVariant(requestType);
  const winter = isWinter();
  // Spread, not swap: anything the winter table does not override keeps the
  // base value, so a new field added to VARIANTS later does not silently go
  // missing for four months of the year.
  const variant = winter ? { ...VARIANTS[key], ...WINTER[key] } : VARIANTS[key];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with glassmorphism blur */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={`relative w-full max-w-md overflow-hidden rounded-[24px] p-8 text-center shadow-2xl backdrop-blur-xl ${
              winter
                ? "border border-sky-100/80 bg-gradient-to-b from-white via-white to-sky-50/80"
                : "border border-white/60 bg-white/90"
            }`}
          >
            {/* Frost along the top edge — the card reads as cold before any
                text is read. */}
            {winter && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent"
              />
            )}

            {/* Where the snow lands. A soft mound along the bottom edge gives
                the falling flakes somewhere to arrive, so the card reads as a
                scene rather than particles over a rectangle. */}
            {winter && (
              <svg
                aria-hidden="true"
                viewBox="0 0 400 60"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-12 w-full"
              >
                <path
                  d="M0 38 C 60 18, 110 46, 170 34 S 290 10, 400 32 L400 60 L0 60 Z"
                  fill={`${variant.primary}14`}
                />
                <path
                  d="M0 48 C 80 32, 140 56, 210 46 S 330 28, 400 44 L400 60 L0 60 Z"
                  fill={`${variant.primary}1f`}
                />
              </svg>
            )}

            {/* Snowfall. Decorative, so it is hidden from assistive tech and
                dropped entirely for anyone who has asked for less motion —
                drifting particles are exactly what that setting is for. */}
            {winter && !reduceMotion && (
              <div
                aria-hidden="true"
                // `-z-10` keeps the flakes between the card's background and
                // its text. Without it an absolutely positioned child paints
                // ABOVE the in-flow content and the snow falls over the words.
                // It stays inside the card because framer-motion's transform
                // makes the card its own stacking context.
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
              >
                {SNOWFLAKES.map((flake, i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: flake.left,
                      width: flake.size,
                      height: flake.size,
                      // Tinted per variant rather than a fixed sky blue —
                      // indigo snow over an indigo card reads as one idea,
                      // where a blue flake on it looked like a stray pixel.
                      backgroundColor: `${variant.primary}80`,
                    }}
                    initial={{ y: -12, opacity: 0 }}
                    animate={{
                      y: 520,
                      x: [0, flake.drift, 0],
                      opacity: [0, 0.9, 0.9, 0],
                    }}
                    transition={{
                      duration: flake.duration,
                      delay: flake.delay,
                      repeat: Infinity,
                      ease: "linear",
                      x: {
                        duration: flake.duration / 2,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                      },
                    }}
                  />
                ))}
              </div>
            )}
            {/* Soft top glow */}
            <div
              className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full
                          bg-gradient-to-b ${variant.glow} to-transparent blur-2xl`}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <Icon name="X" size={18} />
            </button>

            {/* Icon in gradient circle with floating animation */}
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              {/* Floating sparkle dots for subtle delight */}
              {[
                { left: "-6px", top: "10px", size: 6, delay: 0 },
                { right: "-4px", top: "0px", size: 8, delay: 0.6 },
                { right: "4px", bottom: "-2px", size: 5, delay: 1.1 },
                { left: "2px", bottom: "6px", size: 4, delay: 1.6 },
              ].map((d, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: d.left,
                    right: d.right,
                    top: d.top,
                    bottom: d.bottom,
                    width: d.size,
                    height: d.size,
                    backgroundColor: variant.primary,
                  }}
                  animate={{ y: [0, -7, 0], opacity: [0.25, 0.7, 0.25] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: d.delay,
                  }}
                />
              ))}

              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 0 0 ${variant.primary}33` }}
                animate={{ boxShadow: [`0 0 0 0 ${variant.primary}33`, `0 0 0 16px ${variant.primary}00`] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${variant.circle} shadow-inner ${
                  winter ? "ring-2 ring-white/70" : "ring-1 ring-black/5"
                }`}
                style={
                  winter
                    ? { boxShadow: `inset 0 2px 10px ${variant.primary}26` }
                    : undefined
                }
              >
                <motion.span
                  // A touch of lift so the glyph sits IN the disc rather than
                  // flat on it.
                  style={{ filter: "drop-shadow(0 3px 5px rgba(15,23,42,0.18))" }}
                  className="text-5xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {variant.icon}
                </motion.span>
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-3 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {variant.title}
            </h2>

            {/* Message */}
            <div className="space-y-2.5 px-1">
              {variant.message.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-600">
                  {line}
                </p>
              ))}
            </div>

            {/* Did You Know tip */}
            <div
              className={`mt-6 flex items-start gap-3 rounded-2xl border ${variant.tipBorder} ${variant.tipBg} p-4 text-left`}
            >
              <Icon name="Lightbulb" size={18} className={`mt-0.5 shrink-0 ${variant.tipIcon}`} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Did You Know?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {variant.tip}
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onClose}
              style={{
                // A flat slab of colour read as unfinished at this size. The
                // gradient plus the inset top highlight gives the button a
                // light source, matching the lift on the icon disc.
                backgroundImage: `linear-gradient(135deg, ${variant.primary} 0%, ${variant.primary}e0 100%)`,
                boxShadow: `0 12px 24px -10px ${variant.primary}99, inset 0 1px 0 rgba(255,255,255,0.28)`,
              }}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white
                         transition-transform duration-150 hover:brightness-[1.06] active:scale-[0.98]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300"
            >
              <Icon name="Check" size={16} />
              Got It
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceSuccessModal;
