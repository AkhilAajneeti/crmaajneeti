import React from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";

const CHART_LINE =
  "M0,95 C18,95 18,78 36,78 C54,78 54,88 72,88 C90,88 90,62 108,62 C126,62 126,74 144,74 C162,74 162,58 180,58 C198,58 198,70 216,70 C234,70 234,48 252,48 C270,48 270,58 288,58 C306,58 306,34 324,34 C342,34 342,40 360,40 C380,40 380,14 400,14";

const CHART_POINTS = [
  [0, 95],
  [36, 78],
  [72, 88],
  [108, 62],
  [144, 74],
  [180, 58],
  [216, 70],
  [252, 48],
  [288, 58],
  [324, 34],
  [360, 40],
  [400, 14],
];

const STATS = [
  { icon: "User", value: "2,450", label: "Total Leads" },
  { icon: "BarChart3", value: "1,210", label: "Contacted" },
  { icon: "CalendarDays", value: "420", label: "Meetings" },
  { icon: "Trophy", value: "185", label: "Closed" },
];

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

const LEADS = [
  {
    initials: "RS",
    name: "Ravi Sharma",
    company: "TechNova Pvt. Ltd.",
    status: "New",
    score: 85,
    avatar: "from-[#2f6df6] to-[#1e3f9e]",
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  },
  {
    initials: "NV",
    name: "Neha Verma",
    company: "Bright Solutions",
    status: "Contacted",
    score: 72,
    avatar: "from-[#3b82f6] to-[#2947b8]",
    pill: "bg-sky-500/15 text-sky-300 border-sky-400/25",
  },
  {
    initials: "AK",
    name: "Amit Kumar",
    company: "Innovate Labs",
    status: "Qualified",
    score: 66,
    avatar: "from-[#6366f1] to-[#3730a3]",
    pill: "bg-violet-500/15 text-violet-300 border-violet-400/25",
  },
  {
    initials: "PS",
    name: "Pooja Singh",
    company: "NextGen Corp.",
    status: "Proposal",
    score: 91,
    avatar: "from-[#8b5cf6] to-[#5b21b6]",
    pill: "bg-amber-500/15 text-amber-300 border-amber-400/25",
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
        <div className="absolute -bottom-24 -left-24 h-[380px] w-[380px] rounded-full bg-[#AC2334]/45 blur-[110px]" />
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

        {/* Headline + mock dashboard */}
        <div className="mt-[clamp(16px,3.5vh,44px)] grid flex-1 grid-cols-1 items-center gap-8 xl:gap-7 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* Left column — pitch */}
          <div className="max-w-md">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex items-center gap-3"
            >
              <span className="h-px w-8 shrink-0 bg-[#e8546b]/70" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e8546b]">
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
              <span className="italic text-[#f8d0d8]">
                engineered end to end.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-[clamp(12px,2.2vh,24px)] text-[14px] leading-6 text-white/70"
            >
              A CRM is only as powerful as the engine feeding it.{" "}
              <span className="font-semibold text-white">
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

          {/* Right column — dashboard preview */}
          <div className="space-y-[clamp(8px,1.6vh,18px)]">
            {/* Lead performance */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-[clamp(12px,2vh,20px)] backdrop-blur-xl shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold">Lead Performance</p>
                <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-white/80">
                  This Month
                  <Icon name="ChevronDown" size={12} />
                </span>
              </div>

              <div className="mt-3 flex items-end gap-3">
                <p className="text-[32px] font-bold leading-none">2,450</p>
                <div className="pb-1">
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-emerald-400">
                    <Icon name="TrendingUp" size={13} />
                    +18.6%
                  </span>
                  <span className="text-[11px] text-white/50">
                    vs last month
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 400 120"
                className="mt-3 h-[clamp(58px,9vh,104px)] w-full"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${CHART_LINE} L400,120 L0,120 Z`} fill="url(#chartFill)" />
                <path
                  d={CHART_LINE}
                  stroke="#7db2ff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {CHART_POINTS?.map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#dbeafe" />
                ))}
              </svg>
            </motion.div>

            {/* Stat tiles */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="grid grid-cols-4 gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-xl"
            >
              {STATS?.map((stat) => (
                <div
                  key={stat?.label}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-[clamp(8px,1.5vh,16px)] text-center"
                >
                  <Icon
                    name={stat?.icon}
                    size={20}
                    className="mx-auto text-[#7db2ff]"
                  />
                  <p className="mt-2.5 text-xl font-bold">{stat?.value}</p>
                  <p className="mt-1 text-[11px] text-white/55">{stat?.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Recent leads */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-[clamp(12px,2vh,20px)] backdrop-blur-xl shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Recent Leads</p>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#7db2ff]">
                  View All
                  <Icon name="ArrowRight" size={13} />
                </span>
              </div>

              <div className="mt-4 grid grid-cols-[1.5fr_1.4fr_0.9fr_0.4fr] gap-3 border-b border-white/10 pb-2 text-[11px] text-white/45">
                <span>Name</span>
                <span>Company</span>
                <span className="text-center">Status</span>
                <span className="text-right">Score</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {LEADS?.map((lead, index) => (
                  <div
                    key={lead?.name}
                    // Short viewports drop the tail rows so the panel still
                    // fits on one screen without scrolling.
                    className={`grid grid-cols-[1.5fr_1.4fr_0.9fr_0.4fr] items-center gap-3 py-[clamp(5px,1.1vh,11px)] ${
                      index === 3 ? "[@media(max-height:840px)]:hidden" : ""
                    } ${index === 2 ? "[@media(max-height:730px)]:hidden" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${lead?.avatar} text-[10px] font-semibold`}
                      >
                        {lead?.initials}
                      </span>
                      <span className="truncate text-[13px]">{lead?.name}</span>
                    </div>
                    <span className="truncate text-[12px] text-white/60">
                      {lead?.company}
                    </span>
                    <span
                      className={`mx-auto rounded-md border px-2 py-1 text-[11px] font-medium ${lead?.pill}`}
                    >
                      {lead?.status}
                    </span>
                    <span className="text-right text-[12px] text-white/75">
                      {lead?.score}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-[clamp(16px,3vh,40px)] flex items-center gap-4"
        >
          <span className="h-12 w-[3px] rounded-full bg-gradient-to-b from-[#ff6b83] via-[#AC2334] to-transparent" />
          <p className="max-w-lg text-[16px] font-medium italic leading-6 text-white/70">
            Performance marketing, wired straight into your CRM.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginShowcase;
