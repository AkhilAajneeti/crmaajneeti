import React from "react";
import { motion } from "framer-motion";
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
    <div className="relative hidden lg:flex flex-col overflow-hidden bg-[#050c26] text-white">
      {/* Deep navy base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_0%_0%,#0b1743_0%,#071033_45%,#040a1f_100%)]" />

      {/* Blue glow sweeping in from the right edge */}
      <div className="absolute -top-40 -right-52 h-[620px] w-[620px] rounded-full bg-[#1d4ed8]/40 blur-[130px]" />
      <div className="absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full bg-[#2563eb]/25 blur-[120px]" />
      <div className="absolute -bottom-40 -left-32 h-[460px] w-[460px] rounded-full bg-[#1e40af]/25 blur-[130px]" />

      {/* Faint arc lines in the top-right corner */}
      <svg
        className="pointer-events-none absolute -top-24 right-0 h-[420px] w-[420px] opacity-[0.18]"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
      >
        {[150, 190, 230, 270, 310].map((r) => (
          <circle
            key={r}
            cx="330"
            cy="70"
            r={r}
            stroke="url(#arcStroke)"
            strokeWidth="1"
          />
        ))}
        <defs>
          <linearGradient id="arcStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
            <stop offset="60%" stopColor="#93c5fd" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Bottom band: maroon glow + dot matrix ─────────────── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%]">
        {/* Maroon wash rising from the bottom-left */}
        <div className="absolute inset-0 bg-[radial-gradient(95%_120%_at_10%_105%,rgba(172,35,52,0.85)_0%,rgba(139,28,45,0.45)_32%,rgba(88,20,52,0.18)_58%,transparent_78%)]" />
        {/* Crimson core */}
        <div className="absolute -bottom-24 -left-24 h-[380px] w-[380px] rounded-full bg-mahroon opacity-45 blur-[110px]" />
        {/* Dot matrix, fading upward */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.5)_1.2px,transparent_1.2px)] bg-[size:15px_15px] opacity-25 [mask-image:linear-gradient(to_top,black_15%,transparent_85%)]" />
        {/* Denser maroon-tinted dots hugging the corner */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,140,160,0.65)_1.2px,transparent_1.2px)] bg-[size:15px_15px] opacity-40 [mask-image:radial-gradient(70%_90%_at_12%_100%,black_0%,transparent_70%)]" />
      </div>

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
            src="/assets/aajneeti-logo.png"
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
              <span className="h-px w-8 shrink-0 bg-[#e8546b]/70" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e8546b]">
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
              <span className="italic text-[#f8d0d8]">
                Every team, in sync.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-[clamp(12px,2.2vh,24px)] text-[14px] leading-6 text-white/70"
            >
              Your work, your team, your goals — all in one place.{" "}
              <span className="font-semibold text-white">
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
                  <span className="flex h-[clamp(40px,5vh,52px)] w-[clamp(40px,5vh,52px)] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#1b3a8f] to-[#0e1c47] shadow-[0_10px_30px_-12px_rgba(37,99,235,0.9)]">
                    <Icon
                      name={feature?.icon}
                      size={22}
                      className="text-[#7db2ff]"
                    />
                  </span>
                  <div className="pt-1">
                    <p className="text-[15px] font-semibold text-white">
                      {feature?.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-white/60">
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
          <span className="h-12 w-[3px] rounded-full bg-gradient-to-b from-mahroon-200 via-mahroon to-transparent" />
          <p className="max-w-lg text-[16px] font-medium italic leading-6 text-white/70">
            One team. One platform. Better outcomes.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginShowcase;
