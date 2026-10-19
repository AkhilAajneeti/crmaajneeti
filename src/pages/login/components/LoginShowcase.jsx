import React from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";

const FEATURES = [
  {
    icon: "TrendingUp",
    title: "Real-time Insights",
    description: "Make smarter, faster decisions",
  },
  {
    icon: "Users",
    title: "Stronger Customer Relationships",
    description: "Build lasting business connections",
  },
  {
    icon: "ShieldCheck",
    title: "Secure & Reliable",
    description: "Your data is always protected",
  },
];

// Leaves drift down the panel on their own loops, so no two cross the frame
// together. Each entry is [left %, top %, width px, duration s, delay s].
const LEAVES = [
  { left: "14%", top: "6%", size: 26, duration: 13, delay: 0 },
  { left: "47%", top: "2%", size: 20, duration: 16, delay: 2.5 },
  { left: "63%", top: "18%", size: 30, duration: 15, delay: 5 },
  { left: "31%", top: "30%", size: 17, duration: 18, delay: 8 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const LoginShowcase = () => {
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
      {LEAVES.map((leaf, index) => (
        <motion.img
          key={index}
          src="/assets/festival/festive-leaf.png"
          alt=""
          aria-hidden="true"
          style={{ left: leaf.left, top: leaf.top, width: leaf.size }}
          className="pointer-events-none absolute select-none opacity-70"
          initial={{ y: -40, rotate: -20, opacity: 0 }}
          animate={{
            y: ["-10%", "115%"],
            x: [0, 26, -18, 10, 0],
            rotate: [-20, 35, -12, 28, -20],
            opacity: [0, 0.75, 0.75, 0.55, 0],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
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
                Performance Marketing × CRM
              </p>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.4}
              className="mt-[clamp(12px,2.2vh,22px)] text-[clamp(26px,min(2.2vw,38px),38px)] font-bold leading-[1.1] tracking-tight"
            >
              India's strongest
              <br />
              sales pipeline,
              <br />
              <span className="italic text-[#a92334]">
                engineered end to end.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-[clamp(12px,2.2vh,24px)] text-[14px] leading-6 text-[#5c656e]"
            >
              A CRM is only as powerful as the engine feeding it.{" "}
              <span className="font-semibold text-[#0b1527]">
                AAJneeti Connect Limited
              </span>{" "}
              builds both — the campaigns that capture demand and the pipeline
              that converts it — as one continuous system.
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
            Performance marketing, wired straight into your CRM.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginShowcase;
