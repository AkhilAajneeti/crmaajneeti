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
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";

const COLORS = [
  "#1877F2",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const SECTORS = [
  "RealEstate",
  "Contact form",
  "B2B",
  "AppDev",
  "Automobiles",
  "Banquet Hall",
  "BridalMakeup",
  "CaseStudy",
  "ContentMarketing",
  "CoWorking",
  "DJMusic",
  "DubaiRELG",
  "FacebookAds",
  "FoodCatering",
  "GoogleAds",
  "HigherEducation",
  "Interior",
  "Leasing",
  "LinkedinAds",
  "LuxuryEventPlanners",
  "LuxuryTransportation",
  "ORM",
  "PhotographersVideographers",
  "PlotsRELG",
  "Political",
  "PreWedding",
  "RealEstateCityPages",
  "SEO",
  "Study abroad",
  "Tour_Travel",
  "WebDev",
  "WeddingFloralDecor",
  "WikipediaBrands",
  "WikipediaPoliticians",
];

const IndustryChart = ({ leads = [] }) => {

  const ACTIVITY_DATE_FILTERS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7Days" },
    { label: "This Month", value: "currentMonth" },
    // { label: "Last Month", value: "lastMonth" },
  ];
  const [filters, setFilters] = useState({
    dateType: "today",        // 👈 NEW (today, before, between, etc.)
    closeDateFrom: "",
    closeDateTo: "",
    xDays: ""            // 👈 for "Last X Days", "After X Days"
  });
  const showXDaysInput = [
    "lastXDays",
    "nextXDays",
    "olderThanXDays",
    "afterXDays"
  ].includes(filters?.dateType);


  const buildDateRange = (filters) => {
    const { dateType, closeDateFrom, closeDateTo, xDays } = filters;

    if (!dateType) return null;

    // ✅ TODAY
    if (dateType === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    // ✅ YESTERDAY
    if (dateType === "yesterday") {
      const today = new Date();
      const y = new Date(today);
      y.setDate(today.getDate() - 1);

      const start = new Date(y);
      start.setHours(0, 0, 0, 0);
      const end = new Date(y);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    // ✅ LAST 7 DAYS
    if (dateType === "last7Days") {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 6);

      const start = new Date(past);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    // ✅ CURRENT MONTH
    if (dateType === "currentMonth") {
      const today = new Date();

      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    // ✅ LAST MONTH
    if (dateType === "lastMonth") {
      const today = new Date();

      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    // ✅ LAST X DAYS
    if (dateType === "lastXDays" && xDays) {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - Number(xDays));

      const start = new Date(past);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    // ✅ BEFORE
    if (dateType === "before" && closeDateFrom) {
      const end = new Date(closeDateFrom);
      end.setHours(23, 59, 59, 999);
      return { start: null, end };
    }

    // ✅ AFTER
    if (dateType === "after" && closeDateFrom) {
      const start = new Date(closeDateFrom);
      start.setHours(0, 0, 0, 0);
      return { start, end: null };
    }

    return null;
  };
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const chartData = useMemo(() => {
    const range = buildDateRange(filters);
    const startMs = range?.start ? range.start.getTime() : null;
    const endMs = range?.end ? range.end.getTime() : null;

    const counts = new Map();
    for (const sector of SECTORS) counts.set(sector, 0);

    for (const lead of leads || []) {
      const sector = lead?.cSector;
      if (!sector || !counts.has(sector)) continue;

      const createdAt = lead?.createdAt;
      if (!createdAt) continue;
      const ms = new Date(createdAt).getTime();
      if (Number.isNaN(ms)) continue;
      if (startMs !== null && ms < startMs) continue;
      if (endMs !== null && ms > endMs) continue;

      counts.set(sector, (counts.get(sector) || 0) + 1);
    }

    const result = [];
    for (const [name, value] of counts.entries()) {
      if (value > 0) result.push({ name, value });
    }
    // stable-ish ordering: highest first for readability
    result.sort((a, b) => b.value - a.value);
    return result;
  }, [leads, filters]);

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

        <div className="w-full  mt-5 scrollbar-hide">
          <div className="flex gap-1 w-auto w-full">
            <Select
              className="w-full"
              placeholder="Filter by date"
              options={ACTIVITY_DATE_FILTERS}
              value={filters?.dateType || ""}
              onChange={(value) => handleFilterChange("dateType", value)}
            />

            {/* X Days Input */}
            {showXDaysInput && (
              <Input
                type="number"
                placeholder="Enter days"
                value={filters?.xDays || ""}
                onChange={(e) =>
                  handleFilterChange("xDays", e.target.value)
                }
              />
            )}


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
