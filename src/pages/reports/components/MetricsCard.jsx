import React from 'react';
import KPICard from 'pages/dashboard/components/KPICard';

/**
 * Metrics card for the Reports page.
 *
 * Reports used to paint its own card here, which drifted from the KPI strip on
 * the dashboard and contacts pages — different radius, a flat icon square, and
 * a generic hover shadow. It now renders the shared KPICard, so every figure in
 * the app sits on the same surface, with the same colour-matched hover glow.
 *
 * The metric shape (title / value / icon / hex iconColor / description) is
 * unchanged, so call sites stay as they are. These cards explain their number
 * with `description` rather than comparing it, so no delta chip is shown.
 */
const MetricsCard = ({
  title,
  value,
  change,
  changeType,
  icon,
  iconColor,
  description,
  isLoading,
}) => (
  <KPICard
    title={title}
    value={value}
    change={change}
    changeType={changeType}
    icon={icon}
    iconColor={iconColor}
    description={description}
    isLoading={isLoading}
  />
);

export default MetricsCard;
