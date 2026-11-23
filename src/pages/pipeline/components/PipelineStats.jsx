import React, { memo } from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";

/**
 * PipelineStats - the six urgency-based KPI cards above the kanban board.
 *
 * Reads counts from the already-classified `stats` object:
 *   { dueToday, upcoming, overdue, active, stale, budgetIssue }
 *
 * Each card has a soft tinted background, a small color-coded icon box on
 * the left, and a bold count + label on the right — mirroring the layout
 * in the design reference.
 */
const PipelineStats = ({ stats = {} }) => {
  const cards = [
    {
      key: "dueToday",
      label: "Due Today",
      value: stats.dueToday || 0,
      icon: "CalendarClock",
      cardBg: "bg-orange-50 dark:bg-orange-500/10",
      iconBg: "bg-orange-100 dark:bg-orange-500/20",
      iconColor: "text-orange-600 dark:text-orange-300",
    },
    {
      key: "upcoming",
      label: "Upcoming",
      value: stats.upcoming || 0,
      icon: "Calendar",
      cardBg: "bg-blue-50 dark:bg-blue-500/10",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-300",
    },
    {
      key: "overdue",
      label: "Overdue",
      value: stats.overdue || 0,
      icon: "AlertCircle",
      cardBg: "bg-red-50 dark:bg-red-500/10",
      iconBg: "bg-red-100 dark:bg-red-500/20",
      iconColor: "text-red-600 dark:text-red-300",
    },
    {
      key: "active",
      label: "Active Leads",
      value: stats.active || 0,
      icon: "Activity",
      cardBg: "bg-emerald-50 dark:bg-emerald-500/10",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-300",
    },
    {
      key: "stale",
      label: "Stale Leads",
      value: stats.stale || 0,
      icon: "Archive",
      cardBg: "bg-gray-50 dark:bg-slate-500/10",
      iconBg: "bg-gray-100 dark:bg-slate-500/20",
      iconColor: "text-gray-500 dark:text-slate-300",
    },
    {
      key: "budgetIssue",
      label: "Budget Issue",
      value: stats.budgetIssue || 0,
      icon: "Wallet",
      cardBg: "bg-amber-50 dark:bg-amber-500/10",
      iconBg: "bg-amber-100 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`flex items-center gap-3 p-4 rounded-xl border border-border ${c.cardBg}`}
        >
          <div
            className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
          >
            <Icon name={c.icon} size={20} className={c.iconColor} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-foreground leading-none tabular-nums">
              {c.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {c.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default memo(PipelineStats);
