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
    avatar: "from-[#d4663a] to-[#a23a1f]",
    pill: "bg-emerald-500/12 text-emerald-700 border-emerald-500/25",
  },
  {
    initials: "NV",
    name: "Neha Verma",
    company: "Bright Solutions",
    status: "Contacted",
    score: 72,
    avatar: "from-[#e08a3c] to-[#b4571d]",
    pill: "bg-sky-500/12 text-sky-700 border-sky-500/25",
  },
  {
    initials: "AK",
    name: "Amit Kumar",
    company: "Innovate Labs",
    status: "Qualified",
    score: 66,
    avatar: "from-[#c9452f] to-[#8e1526]",
    pill: "bg-violet-500/12 text-violet-700 border-violet-500/25",
  },
  {
    initials: "PS",
    name: "Pooja Singh",
    company: "NextGen Corp.",
    status: "Proposal",
    score: 91,
    avatar: "from-[#ae2131] to-[#6d0f1f]",
    pill: "bg-amber-500/15 text-amber-700 border-amber-500/30",
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

          {/* Right column — dashboard preview */}
          <div className="space-y-[clamp(8px,1.6vh,18px)]">
            {/* Lead performance */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="rounded-2xl border border-[#f0dcc6] bg-white/75 p-[clamp(12px,2vh,20px)] backdrop-blur-xl shadow-[0_24px_60px_-34px_rgba(120,52,24,0.55)]"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold">Lead Performance</p>
                <span className="flex items-center gap-1.5 rounded-lg border border-[#f0dcc6] bg-[#fdf4e9] px-2.5 py-1 text-[11px] text-[#8b7c6d]">
                  This Month
                  <Icon name="ChevronDown" size={12} />
                </span>
              </div>

              <div className="mt-3 flex items-end gap-3">
                <p className="text-[32px] font-bold leading-none">2,450</p>
                <div className="pb-1">
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                    <Icon name="TrendingUp" size={13} />
                    +18.6%
                  </span>
                  <span className="text-[11px] text-[#9aa2ad]">
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
                    <stop offset="0%" stopColor="#e08a3c" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#e08a3c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${CHART_LINE} L400,120 L0,120 Z`} fill="url(#chartFill)" />
                <path
                  d={CHART_LINE}
                  stroke="#c9452f"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {CHART_POINTS?.map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#fde6cf" />
                ))}
              </svg>
            </motion.div>

            {/* Stat tiles */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="grid grid-cols-4 gap-3 rounded-2xl border border-[#f0dcc6] bg-white/70 p-3 backdrop-blur-xl"
            >
              {STATS?.map((stat) => (
                <div
                  key={stat?.label}
                  className="rounded-xl border border-[#f4e4d2] bg-[#fffaf4] px-2 py-[clamp(8px,1.5vh,16px)] text-center"
                >
                  <Icon
                    name={stat?.icon}
                    size={20}
                    className="mx-auto text-[#c9452f]"
                  />
                  <p className="mt-2.5 text-xl font-bold">{stat?.value}</p>
                  <p className="mt-1 text-[11px] text-[#8b93a0]">
                    {stat?.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Recent leads */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="rounded-2xl border border-[#f0dcc6] bg-white/75 p-[clamp(12px,2vh,20px)] backdrop-blur-xl shadow-[0_24px_60px_-34px_rgba(120,52,24,0.55)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Recent Leads</p>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#ae2131]">
                  View All
                  <Icon name="ArrowRight" size={13} />
                </span>
              </div>

              <div className="mt-4 grid grid-cols-[1.5fr_1.4fr_0.9fr_0.4fr] gap-3 border-b border-[#f0dcc6] pb-2 text-[11px] text-[#a0a7b2]">
                <span>Name</span>
                <span>Company</span>
                <span className="text-center">Status</span>
                <span className="text-right">Score</span>
              </div>

              <div className="divide-y divide-[#f4e6d6]">
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
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${lead?.avatar} text-[10px] font-semibold text-white`}
                      >
                        {lead?.initials}
                      </span>
                      <span className="truncate text-[13px]">{lead?.name}</span>
                    </div>
                    <span className="truncate text-[12px] text-[#79818d]">
                      {lead?.company}
                    </span>
                    <span
                      className={`mx-auto rounded-md border px-2 py-1 text-[11px] font-medium ${lead?.pill}`}
                    >
                      {lead?.status}
                    </span>
                    <span className="text-right text-[12px] text-[#4b5563]">
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
