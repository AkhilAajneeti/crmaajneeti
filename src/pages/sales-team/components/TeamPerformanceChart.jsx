import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Icon from "components/AppIcon";

// One colour per funnel stage, ordered light-to-dark the way the funnel
// narrows, so the shrinking bars read as a progression rather than four
// unrelated series.
const SERIES = [
  { key: "assigned", label: "Assigned", fill: "#A78BFA" },
  { key: "contacted", label: "Contacted", fill: "#38BDF8" },
  { key: "qualified", label: "Qualified", fill: "#34D399" },
  { key: "converted", label: "Converted", fill: "#F43F5E" },
];

const TOP_N = 5;

/** First name only — full names turn the axis into a wall of text. */
const shortName = (name) => String(name ?? "").trim().split(/\s+/)[0] || "—";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-slate-900 p-3 text-xs shadow-xl">
      <p className="mb-1.5 font-bold text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.fill }}
            />
            {SERIES.find((s) => s.key === p.dataKey)?.label}
          </span>
          <span className="font-semibold tabular-nums text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const TeamPerformanceChart = ({ rows, isLoading }) => {
  // Same order as the leaderboard beside it, so the two read together.
  const data = rows
    .filter((r) => r.assigned != null)
    .slice(0, TOP_N)
    .map((r) => ({
      name: shortName(r.name),
      fullName: r.name,
      assigned: r.assigned ?? 0,
      contacted: r.contacted ?? 0,
      qualified: r.qualified ?? 0,
      converted: r.converted ?? 0,
    }));

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Icon name="BarChart3" size={20} />
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground">
            Team Performance Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            How the funnel narrows for each of the top performers.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[232px] animate-pulse rounded-xl bg-muted" />
      ) : data.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No data for this period.
        </p>
      ) : (
        <div className="h-[232px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
              {/* Horizontal rules only — vertical ones add nothing when the x
                  axis is categorical. */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(201,162,39,0.22)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                verticalAlign="top"
                align="right"
              />
              {SERIES.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.fill}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default TeamPerformanceChart;
