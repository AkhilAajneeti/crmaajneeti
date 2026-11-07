import React, { useCallback, useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../utils/cn";

/**
 * A radio group that looks like a pill with a sliding thumb.
 *
 * The thumb is one element shared across the options via `layoutId`, so it
 * slides between them instead of cross-fading two backgrounds — the movement
 * itself says "the selection moved from here to there", which a colour change
 * on its own does not.
 *
 * Two rules kept it from being a toy:
 *  - It stays a real radio group. One tab stop, arrows move within it, Home
 *    and End jump to the ends. Screen readers announce "selected" per option
 *    rather than being handed a row of unlabelled buttons.
 *  - Motion is a preference, not decoration. `useReducedMotion` drops the
 *    slide to an instant swap.
 */

// Snappy and slightly damped: the thumb should arrive before the eye does.
// A softer spring reads as "laggy" at this size because the travel is short.
const SLIDE = { type: "spring", stiffness: 460, damping: 36, mass: 0.7 };

const SIZES = {
  sm: { track: "gap-1 p-0.5", item: "px-3 py-1 text-[11px]" },
  md: { track: "gap-1 p-1", item: "px-4 py-1.5 text-xs" },
};

const SegmentedControl = ({
  /** `[{ id, label }]` — extra keys (dateType, tone…) are ignored. */
  options = [],
  /** id of the selected option. */
  value,
  /** (id) => void */
  onChange,
  ariaLabel = "Options",
  /**
   * Optional leading glyph (a node, e.g. a calendar). Decorative — it says
   * what the group filters without anyone having to read four labels first.
   */
  icon = null,
  /**
   * True while the selection's data is still loading. The thumb breathes very
   * slightly — enough to say "working", not enough to look like a spinner.
   */
  isBusy = false,
  size = "md",
  className,
}) => {
  const reduceMotion = useReducedMotion();
  const pillId = useId();
  const buttons = useRef([]);
  const sizing = SIZES[size] || SIZES.md;

  // A value that is not in the list still leaves a sensible anchor for the
  // arrow keys instead of a -1 index.
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value)
  );

  const select = useCallback(
    (index) => {
      const next = options[index];
      if (!next) return;
      onChange?.(next.id);
    },
    [options, onChange]
  );

  const handleKeyDown = (event) => {
    const last = options.length - 1;
    let nextIndex = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = activeIndex === last ? 0 : activeIndex + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = activeIndex === 0 ? last : activeIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = last;
    }

    if (nextIndex == null) return;
    event.preventDefault();
    select(nextIndex);
    // Focus follows selection, so the roving tab stop is never left behind.
    buttons.current[nextIndex]?.focus();
  };

  const breathing = isBusy && !reduceMotion;

  return (
    <motion.div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-busy={isBusy || undefined}
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
      className={cn(
        // A groove, not a third toolbar button. The inset shadow and the cream
        // rail pull it into the surface, so it stops reading as "another pill
        // next to Targets and Refresh" and starts reading as a control that
        // owns the four labels inside it.
        "inline-flex max-w-full items-center overflow-x-auto rounded-full",
        // NB: no `/70` opacity modifiers here. The palette is exposed as plain
        // `var(--color-*)` without `<alpha-value>`, so Tailwind 3.4 emits
        // nothing at all for `bg-card/70` — it fails silently, not loudly.
        "border border-border bg-muted",
        "shadow-[inset_0_1px_2px_rgba(42,26,20,0.07)]",
        // Four short labels can still overflow a 320px phone; scroll rather
        // than wrap, and hide the bar so the pill keeps its single-line shape.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        sizing.track,
        className
      )}
    >
      {icon && (
        <>
          <span
            aria-hidden="true"
            className="ml-1.5 shrink-0 text-muted-foreground"
          >
            {icon}
          </span>
          <span
            aria-hidden="true"
            className="mx-0.5 h-4 w-px shrink-0 bg-border"
          />
        </>
      )}

      {options.map((option, index) => {
        const active = option.id === value;

        return (
          <button
            key={option.id}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={handleKeyDown}
            className={cn(
              "relative shrink-0 rounded-full font-semibold outline-none",
              "transition-[color,background-color,transform] duration-200 motion-safe:active:scale-[0.97]",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted",
              sizing.item,
              // The ghost chip on hover is the affordance that makes the slide
              // legible: you can see the seat the thumb is about to move into.
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                aria-hidden="true"
                layoutId={reduceMotion ? undefined : `segmented-pill-${pillId}`}
                initial={false}
                animate={{ opacity: breathing ? 0.78 : 1 }}
                transition={{
                  // The default drives the slide; opacity is overridden only
                  // when a load is in flight, so the breathe never fights it.
                  default: reduceMotion ? { duration: 0 } : SLIDE,
                  opacity: breathing
                    ? {
                        duration: 0.9,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                      }
                    : { duration: 0.2 },
                }}
                // Floating, not painted on: the brand glow lifts the thumb off
                // the rail, and the inner top sheen keeps it from looking like
                // a flat swatch sliding around.
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-full bg-primary",
                  "shadow-[0_2px_10px_-2px_var(--color-brand-glow),inset_0_1px_0_rgba(255,255,255,0.18)]"
                )}
              />
            )}

            {/* Above the thumb. Kept as a separate layer so the label never
                has to z-fight the sliding background. */}
            <span className="relative z-10 whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
};

export default SegmentedControl;
