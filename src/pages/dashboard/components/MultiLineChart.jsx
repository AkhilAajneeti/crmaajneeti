import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const MultiLineChart = ({ leads = [] }) => {
  // const [selectedYear, setSelectedYear] = useState(2024);
  const [viewType, setViewType] = useState("monthly");
  const now = new Date();
  const currentYearLeads = leads.filter((l) => {
    const d = new Date(l.createdAt);
    return d.getFullYear() === now.getFullYear();
  }).length;
  const currentYear = new Date().getFullYear();
  const isMobile = window.innerWidth < 640;
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-2">
            {label} {currentYear}
          </p>

          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-popover-foreground capitalize">
                  {entry.dataKey} : {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // get monthly data

  const getMonthlyData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const year = new Date().getFullYear();

    return months.map((month, index) => {
      // filter month leads
      const monthLeads = leads.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === year && d.getMonth() === index;
      });
      return {
        label: month,
        facebook: monthLeads.filter((l) => l.source === "Facebook").length,
        ivr: monthLeads.filter((l) => l.source === "IVR").length,
        website: monthLeads.filter((l) => l.source === "Web Site").length,
      };
    });
  };

  const getWeeklyData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const weeks = [
      { label: "W1", start: 1, end: 7 },
      { label: "W2", start: 8, end: 14 },
      { label: "W3", start: 15, end: 21 },
      { label: "W4", start: 22, end: 28 },
      { label: "W5", start: 29, end: 31 },
    ];

    return weeks.map((w) => {
      const weekLeads = leads.filter((l) => {
        const d = new Date(l.createdAt);
        return (
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() >= w.start &&
          d.getDate() <= w.end
        );
      });

      return {
        label: w.label,
        facebook: weekLeads.filter((l) => l.source === "Facebook").length,
        ivr: weekLeads.filter((l) => l.source === "IVR").length,
        website: weekLeads.filter((l) => l.source === "Web Site").length,
      };
    });
  };

  const getDailyData = () => {
    return [...Array(7)].map((_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - i));

      const dailyLeads = leads.filter(
        (l) => new Date(l.createdAt).toDateString() === day.toDateString(),
      );
      return {
        label: day.toLocaleDateString("en-IN", { weekday: "short" }),
        facebook: dailyLeads.filter((l) => l.source === "Facebook").length,
        ivr: dailyLeads.filter((l) => l.source === "IVR").length,
        website: dailyLeads.filter((l) => l.source === "Web Site").length,
      };
    });
  };
  const chartData = (() => {
    switch (viewType) {
      case "weekly":
        return getWeeklyData();
      case "daily":
        return getDailyData();
      default:
        return getMonthlyData();
    }
  })();

  const facebookTotal = chartData.reduce((sum, item) => sum + item.facebook, 0);
  const ivrTotal = chartData.reduce((sum, item) => sum + item.ivr, 0);
  const websiteTotal = chartData.reduce((sum, item) => sum + item.website, 0);
  const Total = facebookTotal + ivrTotal + websiteTotal;
  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Lead Source Performance
          </h3>
          <p className="text-sm text-muted-foreground">
            Monthly leads generated by Source
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {["monthly", "weekly", "daily"].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={viewType === type ? "default" : "outline"}
              onClick={() => setViewType(type)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
      <div
        className="h-80"
        aria-label="Monthly Lead Source Performance Bar Chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={
              isMobile
                ? { top: 0, right: 0, left: 0, bottom: 5 }
                : { top: 20, right: 30, left: 20, bottom: 5 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />

            <XAxis dataKey="label" stroke="#888" fontSize={12} />

            <YAxis
              stroke="#888"
              fontSize={12}
              width={35}
              allowDecimals={false}
              domain={[0, "dataMax + 1"]}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend />

            {/* Main Leads Line */}
            <Line
              type="monotone"
              dataKey="facebook"
              stroke="#1877F2"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

            <Line
              type="monotone"
              dataKey="ivr"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4 }}
            />

            <Line
              type="monotone"
              dataKey="website"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex gap-6 overflow-x-auto no-scrollbar sm:justify-center text-sm px-2">
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-3 h-3 rounded-full bg-[#1877F2]" />
            <span>Facebook: {facebookTotal}</span>
          </div>

          <div className="flex items-center gap-2 min-w-max">
            <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
            <span>IVR: {ivrTotal}</span>
          </div>

          <div className="flex items-center gap-2 min-w-max">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span>Website: {websiteTotal}</span>
          </div>

          <div className="flex items-center gap-2 font-semibold min-w-max">
            <Icon name="Target" size={16} />
            <span>Total: {Total}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MultiLineChart;
