import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

// Same treatment as the attendance MetricsCard: one colour per card drives the
// surface wash, the border, the icon badge, the corner bloom, the hairline and
// the hover glow. Here that colour arrives as the hex the dashboard already
// passes in `iconColor`, so call sites stay exactly as they are.
const hexToRgb = (hex) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ''));
  if (!match) return null;
  return `${parseInt(match[1], 16)},${parseInt(match[2], 16)},${parseInt(match[3], 16)}`;
};

const NEUTRAL_GLOW = '100,116,139';

// Bordered tints, matching the follow-up panel's chips.
const DELTA_TONES = {
  positive: 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
  negative: 'border-red-200/70 bg-red-50 text-red-700',
  neutral: 'border-border bg-muted text-muted-foreground',
};

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
  const glow = hexToRgb(iconColor) || NEUTRAL_GLOW;
  const tone = DELTA_TONES[changeType] || DELTA_TONES.neutral;

  return (
    <motion.div
      // No entrance animation here: the dashboard grid already wraps each card
      // in its own staggered motion.div, and animating both compounds the two
      // y-transforms into a visible double hop.
      //
      // Hover is animated rather than a hover: class, because the colour is per-card
      // and Tailwind can't see a class built from a runtime value.
      whileHover={{
        y: -3,
        boxShadow: `0 18px 34px -14px rgba(${glow},0.6), 0 0 0 1px rgba(${glow},0.35), inset 0 1px 0 rgba(255,255,255,0.9)`,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 ${isLoading ? 'kpi-shimmer kpi-glow' : ''}`}
      style={{
        // A wash of the card's own colour over the card surface, lit along the
        // top edge so it catches light instead of reading as a flat rectangle.
        background: `linear-gradient(155deg, rgba(${glow},0.10) 0%, rgba(${glow},0.03) 42%, rgba(255,255,255,0.75) 100%), var(--color-card)`,
        border: `1px solid rgba(${glow},0.22)`,
        boxShadow: `0 1px 2px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.85)`,
      }}
    >
      {/* Corner bloom — strengthens behind the icon, fades across the card */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `rgba(${glow},0.35)`, opacity: 0.55 }}
      />

      <div className="relative">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 transition-transform duration-300 group-hover:scale-105 ${isLoading ? `animate-pulse ${iconBg || 'bg-muted'}` : ''}`}
            style={
              isLoading
                ? undefined
                : {
                    background: `linear-gradient(140deg, rgba(${glow},0.92) 0%, rgba(${glow},1) 100%)`,
                    boxShadow: `0 8px 16px -6px rgba(${glow},0.9), inset 0 1px 0 rgba(255,255,255,0.4)`,
                  }
            }
          >
            <Icon name={icon} size={20} color="white" className="sm:hidden" />
            <Icon name={icon} size={23} color="white" className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-[12px]">
              {title || 'Loading...'}
            </h3>
            <p className="mt-0.5 text-[26px] font-bold leading-none tracking-tight tabular-nums text-foreground sm:text-[30px]">
              {isLoading ? '0' : value}
            </p>
          </div>
        </div>

        {/* Hairline in the card's own tint, fading out to the right */}
        <span
          aria-hidden="true"
          className="mt-3.5 block h-px w-full sm:mt-4"
          style={{
            background: `linear-gradient(to right, rgba(${glow},0.35), rgba(${glow},0.05) 60%, transparent)`,
          }}
        />

        {/* The comparison sits where MetricsCard puts its description, with the
            delta kept as a chip — it is the part worth reading first. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}
          >
            {!isLoading && changeType === 'positive' && (
              <Icon name="TrendingUp" size={12} />
            )}
            {!isLoading && changeType === 'negative' && (
              <Icon name="TrendingDown" size={12} />
            )}
            <span>{isLoading ? '--' : change}</span>
          </span>

          <span className="truncate text-[11px] text-muted-foreground sm:text-[12.5px]">
            vs {comparisonLabel || '...'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;
