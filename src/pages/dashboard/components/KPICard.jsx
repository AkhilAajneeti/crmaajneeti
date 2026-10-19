import React from 'react';
import Icon from '../../../components/AppIcon';
import { FestiveMark } from '../../../components/FestiveOrnament';

const KPICard = ({
  title,
  value,
  change,
  changeType,
  icon,
  iconBg,
  iconColor,
  comparisonLabel,
  isLoading
}) => {
  return (
    <div
      className={`festive-card-mark relative bg-card border border-border rounded-xl p-3 sm:p-4 md:p-6 shadow-elevation-1  hover:shadow-elevation-2 transition-smooth overflow-hidden
      ${isLoading ? "kpi-shimmer kpi-glow" : ""}`}
    >
      <div className="relative flex items-start justify-between">
        <div className={`flex-1 ${isLoading ? "opacity-50" : ""}`}>
          <p className="mb-1 flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground sm:mb-2">
            <FestiveMark size={14} />
            {title || "Loading..."}
          </p>

          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-card-foreground mb-3">
            {isLoading ? "0" : value}
          </p>

          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${changeType === "positive"
                ? "bg-success/10 text-success"
                : changeType === "negative"
                  ? "bg-error/10 text-error"
                  : "bg-muted text-muted-foreground"
                }`}
            >
              {!isLoading && changeType === "positive" && (
                <Icon name="TrendingUp" size={12} />
              )}
              {!isLoading && changeType === "negative" && (
                <Icon name="TrendingDown" size={12} />
              )}

              <span>{isLoading ? "--" : change}</span>
            </div>

            <span className="text-xs text-muted-foreground">
              vs {comparisonLabel || "..."}
            </span>
          </div>
        </div>

        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${isLoading ? "bg-muted animate-pulse" : iconBg
            }`}
        >
          <Icon name={icon} size={24} color={iconColor} />
        </div>
      </div>
    </div>
  );
};

export default KPICard;