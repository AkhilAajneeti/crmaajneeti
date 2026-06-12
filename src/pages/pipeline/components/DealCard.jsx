import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { parseEspoToLocal, daysSince } from "../utils/dateHelpers";

// Tone per classifier category — drives the card's left border, the
// next-follow-up date color, and the urgency-pill bullet color.
const CATEGORY_TONE = {
  overdue: {
    border: "border-l-red-500",
    date: "text-red-600",
    pillBg: "bg-red-50 text-red-700",
    bullet: "bg-red-500",
  },
  due_today: {
    border: "border-l-amber-500",
    date: "text-amber-600",
    pillBg: "bg-amber-50 text-amber-700",
    bullet: "bg-amber-500",
  },
  upcoming: {
    border: "border-l-blue-500",
    date: "text-blue-600",
    pillBg: "bg-blue-50 text-blue-700",
    bullet: "bg-blue-500",
  },
  active: {
    border: "border-l-emerald-500",
    date: "text-emerald-600",
    pillBg: "bg-emerald-50 text-emerald-700",
    bullet: "bg-emerald-500",
  },
  budget_issue: {
    border: "border-l-purple-500",
    date: "text-purple-600",
    pillBg: "bg-purple-50 text-purple-700",
    bullet: "bg-purple-500",
  },
  stale: {
    border: "border-l-gray-400",
    date: "text-gray-600",
    pillBg: "bg-gray-100 text-gray-700",
    bullet: "bg-gray-400",
  },
};

// Status pill color — keyword-driven so any status string lands somewhere.
const getStatusPill = (status) => {
  if (!status) return "bg-gray-100 text-gray-700";
  const s = status.toLowerCase();
  if (s.includes("budget") || s.includes("dead") || s.includes("invalid") || s.includes("irrelevant"))
    return "bg-red-50 text-red-700 border border-red-100";
  if (s.includes("interested") || s.includes("qualified") || s.includes("converted"))
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (s.includes("follow") || s.includes("call later"))
    return "bg-amber-50 text-amber-700 border border-amber-100";
  if (s.includes("not picked") || s.includes("not connecting") || s.includes("call"))
    return "bg-sky-50 text-sky-700 border border-sky-100";
  if (s.includes("proposal") || s.includes("process"))
    return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  return "bg-blue-50 text-blue-700 border border-blue-100";
};

// Priority pill — uses the classifier's computed priority field.
const getPriorityPill = (priority) => {
  switch (priority) {
    case "high":
      return { label: "High Priority", cls: "bg-red-50 text-red-700 border border-red-100" };
    case "medium":
      return { label: "Medium Priority", cls: "bg-amber-50 text-amber-700 border border-amber-100" };
    case "low":
    default:
      return { label: "Low Priority", cls: "bg-gray-100 text-gray-600 border border-gray-200" };
  }
};

// --- Date formatting / relative time ---

const formatShortDate = (raw) => {
  const d = parseEspoToLocal(raw);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Human urgency label for the top pill (e.g., "9 Days Overdue", "Today",
// "Tomorrow", "In 11 Days", "Yesterday").
const getUrgencyLabel = (category, nextContact) => {
  if (category === "due_today") return "Today";
  if (!nextContact) {
    if (category === "active") return "Recently active";
    if (category === "stale") return "Stale";
    if (category === "budget_issue") return "Budget hold";
    return "";
  }
  const d = parseEspoToLocal(nextContact);
  if (!d) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diff === -1) return "Yesterday";
  if (diff < -1) return `${Math.abs(diff)} Days Overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 30) return `In ${diff} Days`;
  return formatShortDate(nextContact);
};

// Activity recency for the footer (e.g., "Active today", "2 days ago").
const getActivityLabel = (lastActivity) => {
  if (!lastActivity) return "—";
  const days = daysSince(lastActivity);
  if (days <= 0) return "Active today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return formatShortDate(lastActivity);
};

const DealCard = ({ deal = {}, onDelete, onViewHistory }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const tone = CATEGORY_TONE[deal.category] || CATEGORY_TONE.stale;
  const urgency = getUrgencyLabel(deal.category, deal.nextContact);
  const priority = getPriorityPill(deal.priority);

  // Open this lead in the Deals page via the EspoCRM-style deep link.
  // stopPropagation so the click doesn't fight the drag handler.
  const openInDeals = (e) => {
    if (e) e.stopPropagation();
    if (!deal?.id) return;
    navigate(`/Lead/view/${deal.id}`);
  };

  // Lead name fallbacks: name → firstName lastName → fallback string.
  const name =
    deal?.name ||
    [deal?.firstName, deal?.lastName].filter(Boolean).join(" ") ||
    "Untitled Lead";

  // Sub-label fallback: company / project / city, in that order.
  const subtitle =
    deal?.accountName ||
    deal?.cProjectName ||
    deal?.cProject ||
    deal?.addressCity ||
    "";

  return (
    <motion.div
      className={`relative bg-white border border-border border-l-[4px] ${tone.border} rounded-xl p-4 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -1 }}
      layout
    >
      {/* Hover actions */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex space-x-1 bg-white border border-border rounded-md shadow-sm p-0.5 z-10">
          {onViewHistory && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(deal.id);
              }}
            >
              <Icon name="Edit2" size={13} />
            </Button>
          )}
          
        </div>
      )}

      {/* Header — name + subtitle. Name is a button that opens the lead's
          drawer on the Deals page via the EspoCRM-style /Lead/view/:id route. */}
      <div className="pr-12">
        <button
          type="button"
          onClick={openInDeals}
          title="Open in Leads"
          className="block text-left font-semibold text-[15px] text-foreground leading-tight truncate hover:text-primary hover:underline focus:outline-none focus:text-primary"
        >
          {name}
        </button>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Urgency + status pills */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {urgency && (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${tone.pillBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tone.bullet}`} />
            {urgency}
          </span>
        )}
        {deal?.status && (
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusPill(deal.status)}`}
          >
            {deal.status}
          </span>
        )}
      </div>

      {/* Next follow-up row */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Icon name="CalendarClock" size={13} />
          Next follow-up
        </span>
        <span className={`font-semibold ${tone.date} tabular-nums`}>
          {formatShortDate(deal?.nextContact)}
        </span>
      </div>

      {/* Priority pill */}
      <div className="mt-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${priority.cls}`}
        >
          {priority.label}
        </span>
      </div>

      {/* Footer — assigned user + activity */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <Icon name="User" size={13} />
          <span className="truncate">
            {deal?.assignedUserName || "Unassigned"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 flex-shrink-0">
          <Icon name="Clock" size={13} />
          {getActivityLabel(deal?.lastActivity || deal?.modifiedAt || deal?.createdAt)}
        </span>
      </div>

      {/* Site visit (when present) */}
      {deal?.cSiteVisitAt && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <Icon name="CheckCircle" size={13} />
          Site Visit: {formatShortDate(deal.cSiteVisitAt)}
        </div>
      )}
    </motion.div>
  );
};

export default DealCard;
