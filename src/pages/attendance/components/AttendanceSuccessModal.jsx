import React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const variant = VARIANTS[resolveVariant(requestType)];

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
            className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/60
                       bg-white/90 backdrop-blur-xl p-8 shadow-2xl text-center"
          >
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
                className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${variant.circle} shadow-inner ring-1 ring-black/5`}
              >
                <motion.span
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
                backgroundColor: variant.primary,
                boxShadow: `0 10px 20px -8px ${variant.primary}80`,
              }}
              className="mt-7 w-full rounded-xl py-3 text-sm font-semibold text-white
                         transition-transform duration-150 hover:brightness-105 active:scale-[0.98]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300"
            >
              Got It
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceSuccessModal;
