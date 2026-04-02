import React, { useMemo, useState } from "react";
import {
  Pie,
  PieChart,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const COLORS = [
  "#1877F2",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const IndustryChart = ({ leads = [] }) => {
  const [viewType, setViewType] = useState("month");

  // 🔥 Filter leads based on view type
  const filteredLeads = useMemo(() => {
    const now = new Date();

    if (viewType === "today") {
      return leads.filter(
        (l) => new Date(l.createdAt).toDateString() === now.toDateString(),
      );
    }

    if (viewType === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);

      return leads.filter(
        (l) =>
          new Date(l.createdAt).toDateString() === yesterday.toDateString(),
      );
    }

    if (viewType === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      return leads.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= startOfWeek && d <= now;
      });
    }

    if (viewType === "month") {
      return leads.filter((l) => {
        const d = new Date(l.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }

    return leads;
  }, [leads, viewType]);

  // 🔥 Group by industry
  const chartData = useMemo(() => {
    const grouped = {};

    filteredLeads.forEach((lead) => {
      const industry = lead.industry || "Unknown";

      if (!grouped[industry]) grouped[industry] = 0;

      grouped[industry] += 1;
    });

    return Object.keys(grouped).map((key) => ({
      name: key,
      value: grouped[key],
    }));
  }, [filteredLeads]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const isEmpty = total === 0;
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-1">
            {data.name}
          </p>
          <p className="text-sm text-muted-foreground">Leads: {data.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-col">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Leads by Sector
          </h3>
          <p className="text-sm text-muted-foreground">
            Lead distribution across sectors
          </p>
        </div>

        <div className="w-full overflow-x-auto mt-5 scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {["today", "yesterday", "week", "month"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={viewType === type ? "default" : "outline"}
                onClick={() => setViewType(type)}
                className="capitalize flex-shrink-0"
              >
                {type === "today" && "Today"}
                {type === "yesterday" && "Yesterday"}
                {type === "week" && "This Week"}
                {type === "month" && "This Month"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={isEmpty ? [{ name: "No Data", value: 1 }] : chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              paddingAngle={3}
            >
              {(isEmpty ? [{ name: "No Data" }] : chartData).map(
                (entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={isEmpty ? "#d1d5db" : COLORS[index % COLORS.length]}
                    opacity={isEmpty ? 0.4 : 1}
                  />
                ),
              )}
              <Label
                value={`Total\n${total}`}
                position="center"
                className="text-sm font-semibold"
              />
            </Pie>

            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary */}
      <div className="flex flex-wrap justify-start gap-6 mt-6 pt-4 border-t border-border text-sm">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{item.name}</span>
          </div>
        ))}

        <div className="flex items-center space-x-2 font-semibold">
          <Icon name="Target" size={16} />
          <span>Total: {total}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default IndustryChart;
