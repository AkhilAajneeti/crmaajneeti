import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Icon from "components/AppIcon";
import FestiveFireworks from "components/FestiveFireworks";

// Feature rows. Each icon sits on its own soft tint so the three read as a
// set without competing with the artwork behind them.
const FEATURES = [
  {
    icon: "TrendingUp",
    tint: "bg-rose-50 text-rose-600",
    title: "Real-time Performance",
    body: "Track progress and make informed decisions",
  },
  {
    icon: "Users",
    tint: "bg-rose-50 text-rose-600",
    title: "Seamless Team Collaboration",
    body: "Keep teams aligned and work moving forward",
  },
  {
    icon: "ShieldCheck",
    tint: "bg-rose-50 text-rose-600",
    title: "Secure & Reliable Access",
    body: "Your workspace, protected at every step",
  },
];

const LoginShowcase = () => {
  const reduceMotion = useReducedMotion();

  const rise = (delay) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="relative hidden overflow-hidden bg-[#fffaf4] lg:block">
      {/* ── Background layers, back to front ───────────────────── */}

      {/* Ivory silk ground with its lit lotus lamp.

          Cropped from the right rather than centred: at the default crop the
          lamp sat bottom-LEFT, directly under the feature list, which is the
          clutter that needed clearing. Pushing the focal point right drops it
          near the temple, where it belongs, and the silk sheen still carries
          the whole panel. */}
      <img
        src="/assets/festival/lotus lamp.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[78%_bottom]"
      />

      {/* Lifted over the photograph so the headline and body stay readable,
          heavier on the left where the text sits and thinning to the right so
          the artwork survives. */}
      <div className="absolute inset-0 bg-[linear-gradient(103deg,rgba(255,254,251,0.97)_0%,rgba(255,251,244,0.93)_42%,rgba(255,247,236,0.66)_70%,rgba(253,240,222,0.4)_100%)]" />

      {/* Faint mandala, pushed far enough off-canvas to stay clear of the
          logo in the top-left corner. */}
      <img
        src="/assets/festival/festive-mandala-full.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-[22%] w-[360px] select-none opacity-[0.06]"
      />

      {/* Lanterns, held to the right half so they cannot reach the logo.
          This is the transparent PNG rather than one of the JPEGs — the
          JPEG lantern art was renamed off disk, and a PNG needs no blend
          trick to drop its background. */}
      <img
        src="/assets/festival/festive-lanterns.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 right-[6%] h-[300px] select-none object-contain"
      />

      {/* Rocket crackers over the upper-right, behind the lanterns. */}
      <FestiveFireworks className="absolute right-[6%] top-[4%] h-[300px] w-[380px] opacity-90" />
      <FestiveFireworks className="absolute left-[46%] top-[30%] hidden h-[210px] w-[260px] opacity-50 xl:block" />

      {/* The temple, anchored bottom-right and bleeding off the edge so it
          reads as a scene the panel stands in. */}
      <img
        src="/assets/festival/Illuminated Ivory Hindu Temple Garden.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 bottom-0 w-[58%] max-w-[600px] select-none object-contain"
      />

      {/* Golden glow pooling behind the temple and along the floor. */}
      <div className="pointer-events-none absolute bottom-[2%] right-[10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(247,186,99,0.38)_0%,rgba(247,186,99,0)_70%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fdf0de] via-[#fdf0de]/55 to-transparent" />

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative z-10 flex h-full flex-col px-12 py-10 xl:px-16">
        <img
          src="/assets/aajneeti-logo-dark.png"
          alt="Aajneeti Connect"
          className="relative z-20 h-11 w-auto self-start object-contain"
        />

        <div className="flex flex-1 flex-col justify-center py-10">
          {/* Eyebrow: letter-spaced gold caps between two rules. */}
          <motion.div {...rise(0.05)} className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#e0b070]" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#c98a2e]">
              Festival of lights and love
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#e0b070]" />
          </motion.div>

          <motion.h1
            {...rise(0.12)}
            className="max-w-[18ch] text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.08] tracking-tight text-[#111c3a]"
          >
            One workspace.
            <span className="mt-1 block italic text-[#8c1226]">
              Every team, in sync.
            </span>
          </motion.h1>

          <motion.p
            {...rise(0.2)}
            className="mt-5 max-w-[46ch] text-[15px] leading-7 text-slate-600"
          >
            Your work, your team, your goals — all in one place.{" "}
            <span className="font-semibold text-slate-800">
              AAJneeti Connect Limited
            </span>{" "}
            brings people, processes, and performance together to help everyone
            work smarter and achieve more.
          </motion.p>

          <div className="mt-9 space-y-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...rise(0.28 + i * 0.08)}
                className="flex items-start gap-4"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${f.tint}`}
                >
                  <Icon name={f.icon} size={21} />
                </span>
                <div>
                  <p className="text-[16px] font-semibold text-[#111c3a]">
                    {f.title}
                  </p>
                  <p className="mt-0.5 text-[14px] text-slate-500">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Closing line, held by a maroon rule on its left edge. */}
        <motion.div {...rise(0.6)} className="flex items-center gap-4">
          <span className="h-10 w-[3px] shrink-0 rounded-full bg-[#8c1226]" />
          <p className="text-[16px] font-semibold italic text-[#8c1226]">
            One team. One platform. Better outcomes.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginShowcase;
