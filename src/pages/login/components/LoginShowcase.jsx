import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Icon from "../../../components/AppIcon";

const FEATURES = [
  {
    icon: "TrendingUp",
    title: "Real-time Performance",
    description: "Track progress and make informed decisions",
  },
  {
    icon: "Users",
    title: "Seamless Team Collaboration",
    description: "Keep teams aligned and work moving forward",
  },
  {
    icon: "ShieldCheck",
    title: "Secure & Reliable Access",
    description: "Your workspace, protected at every step",
  },
];

// A gust of leaves crosses the panel every 10s. Each leaf takes 6-8s to fall
// and the gust itself spreads over ~2.4s, so the panel clears before the next
// one arrives. `repeatDelay` is whatever is left of the 10s after the fall,
// which is what holds every leaf to the same cadence despite different speeds.
const BURST_INTERVAL = 10;
const LEAF_COUNT = 19;

// Deterministic pseudo-random: scattered to the eye, identical on every render,
// so the leaves do not reshuffle when the component re-renders.
const scatter = (seed) => {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
};

const LEAVES = Array.from({ length: LEAF_COUNT }, (_, index) => {
  const at = (offset) => scatter(index * 7 + offset);
  const duration = 6 + at(1) * 2.2;

  return {
    left: `${2 + at(0) * 93}%`,
    size: 13 + Math.round(at(2) * 19),
    duration,
    delay: at(3) * 2.4,
    repeatDelay: BURST_INTERVAL - duration,
    drift: 20 + at(4) * 42,
    spin: at(5) > 0.5 ? 1 : -1,
  };
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const LoginShowcase = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative hidden lg:flex flex-col overflow-hidden bg-[#fef8f1] text-[#0b1527]">
      {/* Ivory base, warming toward the foot of the panel */}
      <div className="absolute inset-0 bg-[linear-gradient(175deg,#fffdfa_0%,#fef8f1_52%,#fdf2e6_100%)]" />

      {/* Mandala and hanging diya, anchored to the top-right corner */}
      <img
        src="/assets/festival/festive-corner-mandala.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 right-0 w-[clamp(210px,23vw,320px)] select-none opacity-75"
      />

      {/* The scene sits across the foot of the panel at half strength — enough
          to carry the festival, light enough to keep the copy above 7:1. Its
          top edge is masked so it rises out of the cream with no seam. */}
      <img
        src="/assets/festival/festive-archer.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none opacity-50 [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,#000_34%)] [mask-image:linear-gradient(to_bottom,transparent_0%,#000_34%)]"
      />

      {/* Falling leaves */}
      {!prefersReducedMotion &&
        LEAVES.map((leaf, index) => (
          <motion.img
            key={index}
            src="/assets/festival/festive-leaf.png"
            alt=""
            aria-hidden="true"
            style={{ left: leaf.left, width: leaf.size }}
            className="pointer-events-none absolute top-0 select-none"
            initial={{ y: "-14vh", opacity: 0 }}
            animate={{
              // vh, not %, because a percentage translate would be measured
              // against the leaf itself and barely move it.
              y: ["-14vh", "114vh"],
              x: [
                0,
                leaf.drift * leaf.spin,
                leaf.drift * -0.6 * leaf.spin,
                leaf.drift * 0.4 * leaf.spin,
                0,
              ],
              rotate: [
                0,
                70 * leaf.spin,
                -40 * leaf.spin,
                55 * leaf.spin,
                20 * leaf.spin,
              ],
              opacity: [0, 0.8, 0.8, 0.6, 0],
            }}
            transition={{
              duration: leaf.duration,
              delay: leaf.delay,
              repeat: Infinity,
              repeatDelay: leaf.repeatDelay,
              ease: "linear",
            }}
          />
        ))}

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex h-full flex-col px-8 py-[clamp(18px,3vh,40px)] xl:px-10">
        {/* Brand lockup */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center"
        >
          <img
            src="/assets/aajneeti-logo-dark.png"
            alt="Aajneeti Connect"
            className="h-11 w-auto object-contain"
          />
        </motion.div>

        {/* Headline, pitch and feature list */}
        <div className="mt-[clamp(16px,3.5vh,44px)] flex flex-1 items-center">
          {/* Pitch */}
          <div className="max-w-xl">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex items-center gap-3"
            >
              <span className="h-px w-8 shrink-0 bg-[#ae2131]/70" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ae2131]">
                Performance • Teamwork • Growth
              </p>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.4}
              className="mt-[clamp(12px,2.2vh,22px)] text-[clamp(26px,min(2.2vw,38px),38px)] font-bold leading-[1.1] tracking-tight"
            >
              One workspace.
              <br />
              <span className="italic text-[#a92334]">
                Every team, in sync.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-[clamp(12px,2.2vh,24px)] text-[14px] leading-6 text-[#5c656e]"
            >
              Your work, your team, your goals — all in one place.{" "}
              <span className="font-semibold text-[#0b1527]">
                AAJneeti Connect Limited
              </span>{" "}
              brings people, processes, and performance together to help
              everyone work smarter and achieve more.
            </motion.p>

            <div className="mt-[clamp(16px,3vh,36px)] space-y-[clamp(10px,1.9vh,22px)]">
              {FEATURES?.map((feature, index) => (
                <motion.div
                  key={feature?.title}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={2 + index}
                  className="flex items-start gap-4"
                >
                  <span className="flex h-[clamp(40px,5vh,52px)] w-[clamp(40px,5vh,52px)] shrink-0 items-center justify-center rounded-2xl border border-[#f0d3b4] bg-gradient-to-br from-[#fff6ea] to-[#fde6cf] shadow-[0_10px_26px_-14px_rgba(176,88,24,0.75)]">
                    <Icon
                      name={feature?.icon}
                      size={22}
                      className="text-[#c9452f]"
                    />
                  </span>
                  <div className="pt-1">
                    <p className="text-[15px] font-semibold text-[#0b1527]">
                      {feature?.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#6b7480]">
                      {feature?.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-[clamp(16px,3vh,40px)] flex items-center gap-4"
        >
          <span className="h-12 w-[3px] rounded-full bg-gradient-to-b from-[#e8873a] via-[#AC2334] to-transparent" />
          <p className="max-w-lg text-[16px] font-medium italic leading-6 text-[#5c656e]">
            One team. One platform. Better outcomes.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginShowcase;
