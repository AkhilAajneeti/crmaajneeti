import React, { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "components/AppIcon";

/**
 * Wraps a piece of text and explains it on hover — no icon, nothing added to
 * the layout. The wrapped content is the trigger.
 *
 * Painted through a portal with fixed positioning rather than inline: the
 * table this sits in is `overflow-x-auto`, and a CSS overflow value clips BOTH
 * axes, so an absolutely positioned bubble would be sliced off at the
 * container edge.
 */
const HoverHelp = ({ title, body, icon = "Sparkles", children, className = "" }) => {
  const [coords, setCoords] = useState(null);
  const ref = useRef(null);
  const id = useId();

  const open = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    // Anchored to the trigger's centre, then pulled back from either edge of
    // the viewport so the last column's bubble stays on screen.
    const HALF = 132;
    const MARGIN = 8;
    const centre = rect.left + rect.width / 2;
    const clamped = Math.min(
      Math.max(centre, HALF + MARGIN),
      window.innerWidth - HALF - MARGIN
    );

    setCoords({ top: rect.bottom + 8, left: clamped, arrow: centre - clamped });
  }, []);

  const close = useCallback(() => setCoords(null), []);

  return (
    <>
      <span
        ref={ref}
        tabIndex={0}
        aria-describedby={coords ? id : undefined}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onKeyDown={(e) => e.key === "Escape" && close()}
        className={`cursor-help outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        {children}
      </span>

      {coords &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: "translateX(-50%)",
              width: "16.5rem",
            }}
            className="pointer-events-none z-[100] rounded-xl bg-slate-900 p-3.5 text-left shadow-xl ring-1 ring-black/10"
          >
            <span
              aria-hidden="true"
              style={{ left: `calc(50% + ${coords.arrow}px)` }}
              className="absolute -top-1 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-slate-900"
            />

            <p className="flex items-center gap-1.5 text-[13px] font-bold normal-case tracking-normal text-emerald-400">
              <Icon name={icon} size={14} />
              {title}
            </p>
            <div className="mt-1.5 text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-300">
              {body}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default HoverHelp;
