import React from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import DealCard from "./DealCard";
import { Draggable } from "@hello-pangea/dnd";

// Visual tone per column id — drives header pill color + leading icon.
// Card-level tone is resolved inside DealCard from `deal.category`.
const TONE_STYLES = {
  overdue: {
    pill: "bg-red-100 text-red-700",
    icon: "AlertCircle",
  },
  due_today: {
    pill: "bg-amber-100 text-amber-700",
    icon: "CalendarClock",
  },
  upcoming: {
    pill: "bg-blue-100 text-blue-700",
    icon: "Calendar",
  },
  active: {
    pill: "bg-emerald-100 text-emerald-700",
    icon: "Activity",
  },
  budget_issue: {
    pill: "bg-purple-100 text-purple-700",
    icon: "Wallet",
  },
  stale: {
    pill: "bg-gray-200 text-gray-700",
    icon: "PauseCircle",
  },
};

// Column id → human-readable subtitle. Keeps the description out of
// pipelineSections so callers don't have to remember to set it.
const COLUMN_DESCRIPTIONS = {
  overdue: "Follow-up date has passed",
  due_today: "Follow-up scheduled for today",
  upcoming: "Follow-up within the next 7 days",
  active: "Activity within the last 14 days",
  budget_issue: "Stuck on price, payment, or documents",
  stale: "No activity for 14+ days",
};

const PipelineColumn = ({
  stage,
  deals = [],
  onEditDeal,
  onDeleteDeal,
  onCloneDeal,
  onViewHistory,
}) => {
  const tone = TONE_STYLES[stage?.id] || TONE_STYLES.stale;
  const description = COLUMN_DESCRIPTIONS[stage?.id] || "";
  const label = stage?.label || stage?.name || "";
  const count = deals?.length || 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-border shadow-sm">
      {/* Column Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full ${tone.pill}`}
          >
            <Icon name={tone.icon} size={14} />
            {label}
          </span>
          <span className="text-base font-semibold text-foreground tabular-nums">
            {count}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Deals Container — vertical scroll inside the column */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[75vh]">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
              <Icon
                name="Target"
                size={24}
                className="text-muted-foreground"
              />
            </div>
            <p className="text-sm font-medium text-foreground">
              No leads here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          </div>
        ) : (
          deals.map((deal, index) => (
            <Draggable key={deal.id} draggableId={deal.id} index={index}>
              {(provided) => (
                <motion.div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                >
                  <DealCard
                    deal={deal}
                    onEdit={() => onEditDeal && onEditDeal(deal)}
                    onDelete={() => onDeleteDeal && onDeleteDeal(deal.id)}
                    onClone={() => onCloneDeal && onCloneDeal(deal)}
                    onViewHistory={onViewHistory}
                  />
                </motion.div>
              )}
            </Draggable>
          ))
        )}
      </div>
    </div>
  );
};

export default PipelineColumn;
