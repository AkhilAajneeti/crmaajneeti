import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

// Each card is tinted with its own icon colour — the surface, the border, the
// divider and the hover glow all come from this one value. Keyed by the
// Tailwind class the page already passes as `iconColor`, so call sites stay as
// they are; an unmapped class falls back to a neutral slate rather than
// losing the treatment.
const GLOW_BY_ICON_COLOR = {
  'bg-success': '163,217,165',      // --color-success #A3D9A5
  'bg-purple-400': '192,132,252',
  'bg-red-400': '248,113,113',
  'bg-blue-400': '96,165,250',
  'bg-emerald-400': '52,211,153',
  'bg-amber-400': '251,191,36',
  'bg-indigo-400': '129,140,248',
  'bg-primary': '172,35,52',
};

const NEUTRAL_GLOW = '100,116,139';

const MetricsCard = ({ title, value, change, changeType, icon, iconColor, description }) => {
  const glow = GLOW_BY_ICON_COLOR[iconColor] || NEUTRAL_GLOW;

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
      // Animated rather than a hover: class, because the colour is per-card
      // and Tailwind can't see a class built from a runtime value.
      whileHover={{
        y: -3,
        boxShadow: `0 18px 34px -14px rgba(${glow},0.6), 0 0 0 1px rgba(${glow},0.35), inset 0 1px 0 rgba(255,255,255,0.9)`,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl p-4 sm:p-5"
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
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconColor} transition-transform duration-300 group-hover:scale-105`}
            style={{
              boxShadow: `0 8px 16px -6px rgba(${glow},0.9), inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}
          >
            <Icon name={icon} size={20} color="white" className="sm:hidden" />
            <Icon name={icon} size={23} color="white" className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-[12px]">
              {title}
            </h3>
            <p className="mt-0.5 text-[26px] font-bold leading-none tracking-tight text-foreground sm:text-[30px]">
              {value}
            </p>
          </div>
        </div>

        {description && (
          <>
            {/* Hairline in the card's own tint, fading out to the right */}
            <span
              aria-hidden="true"
              className="mt-3.5 block h-px w-full sm:mt-4"
              style={{
                background: `linear-gradient(to right, rgba(${glow},0.35), rgba(${glow},0.05) 60%, transparent)`,
              }}
            />
            <p className="mt-2.5 truncate text-[11px] text-muted-foreground sm:text-[12.5px]">
              {description}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MetricsCard;
