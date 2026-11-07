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
  description,
  compact,
  isLoading
}) => {
  const glow = hexToRgb(iconColor) || NEUTRAL_GLOW;
  const tone = DELTA_TONES[changeType] || DELTA_TONES.neutral;
  // A card either compares its number (delta chip + "vs ...") or explains it
  // (description). Cards with neither — a bare count — end after the value.
  const hasComparison = Boolean(change || comparisonLabel);
  const hasSecondary = Boolean(description || hasComparison);

  // `compact` is the same card drawn at settings-row scale: identical surface,
  // wash, icon badge and hover glow, but it keeps the footprint that row of
  // counters already had instead of growing into a dashboard tile.
  const shell = compact ? 'rounded-xl p-4' : 'rounded-2xl p-4 sm:p-5';
  const badge = compact
    ? 'h-10 w-10 rounded-lg'
    : 'h-11 w-11 rounded-xl sm:h-12 sm:w-12';
  const titleSize = compact
    ? 'text-[10.5px] tracking-[0.08em]'
    : 'text-[11px] tracking-[0.1em] sm:text-[12px]';
  const valueSize = compact ? 'text-2xl' : 'text-[26px] sm:text-[30px]';

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
      className={`group relative h-full overflow-hidden ${shell} ${isLoading ? 'kpi-shimmer kpi-glow' : ''}`}
      style={{
        // A wash of the card's own colour over the card surface, lit along the
        // top edge so it catches light instead of reading as a flat rectangle.
        background: `linear-gradient(155deg, rgba(${glow},0.10) 0%, rgba(${glow},0.03) 42%, rgba(255,255,255,0.75) 100%), var(--color-card)`,
        border: "1px solid rgba(201,162,39,0.32)",
        boxShadow: `0 1px 2px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.85)`,
      }}
    >
      {/* Mandala pressed into the top-right corner. Decoration only —
          aria-hidden, pointer-events-none, and under the content layer. */}
      <img
        src="/assets/festival/festive-mandala-full.png"
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute select-none ${
          compact
            ? '-right-8 -top-8 w-[92px] opacity-40'
            : '-right-10 -top-10 w-[120px] opacity-50'
        }`}
      />

      {/* Corner bloom — strengthens behind the icon, fades across the card */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${
          compact ? '-left-8 -top-10 h-24 w-24' : '-left-10 -top-12 h-28 w-28'
        }`}
        style={{ background: `rgba(${glow},0.35)`, opacity: 0.55 }}
      />

      <div className="relative">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div
            className={`flex shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105 ${badge} ${isLoading ? `animate-pulse ${iconBg || 'bg-muted'}` : ''}`}
            style={
              isLoading
                ? undefined
                : {
                    background: `linear-gradient(140deg, rgba(${glow},0.92) 0%, rgba(${glow},1) 100%)`,
                    boxShadow: `0 8px 16px -6px rgba(${glow},0.9), inset 0 1px 0 rgba(255,255,255,0.4)`,
                  }
            }
          >
            {compact ? (
              <Icon name={icon} size={19} color="white" />
            ) : (
              <>
                <Icon name={icon} size={20} color="white" className="sm:hidden" />
                <Icon name={icon} size={23} color="white" className="hidden sm:block" />
              </>
            )}
          </div>

          <div className="min-w-0">
            <h3 className={`truncate font-semibold uppercase text-muted-foreground ${titleSize}`}>
              {title || 'Loading...'}
            </h3>
            <p
              className={`mt-0.5 font-bold leading-none tracking-tight tabular-nums text-foreground ${valueSize}`}
            >
              {isLoading ? '0' : value}
            </p>
          </div>
        </div>

        {/* Hairline in the card's own tint, fading out to the right. Only drawn
            when something follows it — on a compact counter it would read as a
            divider with nothing to divide. */}
        {hasSecondary && (
          <span
            aria-hidden="true"
            className="mt-3.5 block h-px w-full sm:mt-4"
            style={{
              background: `linear-gradient(to right, rgba(${glow},0.35), rgba(${glow},0.05) 60%, transparent)`,
            }}
          />
        )}

        {/* Secondary line, in whichever form the card has: the delta chip for a
            comparison, or a short description for a card that explains itself.
            The chip stays first where both exist — it is the part worth reading
            first. */}
        {hasSecondary && (
          <div className="mt-2.5">
            {hasComparison && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
            )}

            {description && (
              <p
                className={`text-[11px] leading-snug text-muted-foreground sm:text-[12.5px] ${
                  hasComparison ? 'mt-2' : ''
                }`}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KPICard;
