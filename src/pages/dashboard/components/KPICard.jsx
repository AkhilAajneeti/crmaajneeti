import React from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({ title, value, change, changeType, icon, iconBg, iconColor,comparisonLabel }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-smooth">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-semibold text-card-foreground mb-3">{value}</p>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              changeType === 'positive' ?'bg-success/10 text-success' 
                : changeType === 'negative' ?'bg-error/10 text-error' :'bg-muted text-muted-foreground'
            }`}>
              {changeType === 'positive' && <Icon name="TrendingUp" size={12} />}
              {changeType === 'negative' && <Icon name="TrendingDown" size={12} />}
              <span>{change}</span>
            </div>
            <span className="text-xs text-muted-foreground">vs {comparisonLabel}</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon name={icon} size={24} color={iconColor} />
        </div>
      </div>
    </div>
  );
};

export default KPICard;