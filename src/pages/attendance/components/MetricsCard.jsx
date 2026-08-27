import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, change, changeType, icon, iconColor, description }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return 'TrendingUp';
    if (changeType === 'negative') return 'TrendingDown';
    return 'Minus';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-elevation-2 transition-smooth"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 ${iconColor} rounded-lg flex items-center justify-center`}>
              <Icon name={icon} size={20} color="white" className="sm:hidden" />
              <Icon name={icon} size={24} color="white" className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</h3>
              <p className="text-xl sm:text-2xl font-semibold text-foreground mt-0.5 sm:mt-1">{value}</p>
            </div>
          </div>

          {description && (
            <p className="text-[11px] sm:text-sm text-muted-foreground mb-0 sm:mb-3 truncate">{description}</p>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default MetricsCard;