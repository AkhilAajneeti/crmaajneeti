import React, { useEffect, useState } from "react";

/**
 * Fairy lights and hanging lanterns across the top of the app.
 *
 * The strands are built from a tiling SVG <pattern> rather than one stretched
 * drawing. The previous version scaled a fixed viewBox to the viewport with
 * `preserveAspectRatio="none"`, which squashed every bulb into an oval and
 * thinned the wire unevenly — that is what made them look cut and cheap.
 *
 * With no viewBox, one SVG user unit is one pixel, so the pattern tiles at
 * its true size on any screen: bulbs stay perfectly round from a phone to an
 * ultrawide, and the wire keeps a constant weight.
 *
 * Fixed at z-60 so it crosses in front of the top bar (which is z-40), and
 * `pointer-events-none` so it can never intercept a click there.
 */

const bezier = (t, p0, p1, p2) => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
};

/**
 * One swag of the string, repeated across the width. Its start and end sit at
 * the same height so the tiles join without a visible step.
 */
const Swag = ({
  id,
  span,
  sag,
  top,
  bulbs,
  bulbR,
  cord,
  group = 0,
  groups = 1,
  drawWire = true,
}) => {
  const p0 = { x: 0, y: top };
  const p1 = { x: span / 2, y: top + sag };
  const p2 = { x: span, y: top };

  // Offset off the seam so the bulb where two tiles meet is not drawn twice.
  // Only this layer's share is drawn: splitting bulbs across patterns is what
  // lets neighbours blink out of step. One pattern can only fade as a whole.
  const points = Array.from({ length: bulbs }, (_, i) => ({
    ...bezier((i + 1) / (bulbs + 1), p0, p1, p2),
    i,
  })).filter((pt) => pt.i % groups === group);

  return (
    <pattern id={id} width={span} height="150" patternUnits="userSpaceOnUse">
      {/* The cord is thin and dark, not a gold line. A heavy bright wire is
          the single thing that most makes string lights look drawn rather
          than photographed — real flex disappears against daylight. */}
      {drawWire && (
        <path
          d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
          stroke="rgba(104,74,38,0.3)"
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {points.map((b) => {
        // Slight per-bulb variation in size and droop. Identical bulbs on an
        // even pitch is the other tell of a drawn string.
        const jitter = 0.86 + ((b.i * 37) % 29) / 100;
        const r = bulbR * jitter;
        const drop = 5 + ((b.i * 13) % 5);
        const cy = b.y + drop + r * 1.15;

        return (
          <g key={b.i}>
            <line
              x1={b.x}
              y1={b.y}
              x2={b.x}
              y2={b.y + drop}
              stroke="rgba(104,74,38,0.32)"
              strokeWidth="0.8"
            />

            {/* Light spilling onto whatever is behind — a wide, very soft
                wash. Without it the bulbs float instead of lighting the bar. */}
            <circle cx={b.x} cy={cy} r={r * 5.2} fill="url(#bulbSpill)" />
            <circle cx={b.x} cy={cy} r={r * 2.6} fill="url(#bulbHalo)" />

            {/* Brass cap where the flex meets the glass. */}
            <rect
              x={b.x - r * 0.42}
              y={b.y + drop - 1.2}
              width={r * 0.84}
              height={r * 0.72}
              rx={r * 0.2}
              fill="#b98a44"
              opacity="0.9"
            />

            {/* The envelope: a touch taller than wide, so it reads as a
                teardrop bulb rather than a dot. */}
            <ellipse cx={b.x} cy={cy} rx={r} ry={r * 1.15} fill="url(#bulbGlass)" />

            {/* Filament — the hot centre, offset slightly low. */}
            <ellipse
              cx={b.x}
              cy={cy + r * 0.12}
              rx={r * 0.34}
              ry={r * 0.44}
              fill="#fffdf2"
              opacity="0.95"
            />

            {/* Specular catch-light up and to the left, which is what makes
                it read as glass. */}
            <ellipse
              cx={b.x - r * 0.38}
              cy={cy - r * 0.45}
              rx={r * 0.2}
              ry={r * 0.26}
              fill="#ffffff"
              opacity="0.75"
            />
          </g>
        );
      })}
    </pattern>
  );
};

/**
 * True while any drawer or modal is open.
 *
 * The lights are fixed at z-60 so they can cross the top bar, but drawers in
 * this app sit at z-50 with a z-40 backdrop — there is no gap between the
 * header and the drawer to slot the lights into, and raising 25 panels plus
 * 22 overlays to clear them would be a far wider change than this is worth.
 *
 * So instead the lights stand down while an overlay is up. Every drawer and
 * dialog here dims the page with a `bg-black/NN` backdrop, which is the one
 * reliable signal they all share.
 */
const useOverlayOpen = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () =>
      setOpen(Boolean(document.querySelector('div[class*="bg-black/"]')));

    check();

    // Coalesced into one rAF: React can fire dozens of mutations per render
    // and re-querying on each would be wasteful.
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        check();
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return open;
};

const FestiveLights = ({ showLanterns = false }) => {
  const overlayOpen = useOverlayOpen();

  return (
  <div
    aria-hidden="true"
    className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[240px] select-none overflow-hidden transition-opacity duration-200 ${
      overlayOpen ? "opacity-0" : "opacity-100"
    }`}
    style={{
      WebkitMaskImage:
        "linear-gradient(to right, transparent 0px, transparent 330px, #000 430px, #000 calc(100% - 330px), transparent calc(100% - 230px))",
      maskImage:
        "linear-gradient(to right, transparent 0px, transparent 330px, #000 430px, #000 calc(100% - 330px), transparent calc(100% - 230px))",
    }}
  >
    <svg className="absolute inset-x-0 top-0 h-[150px] w-full">
      <defs>
        {/* Glass: hot and near-white at the filament, deepening to amber at
            the rim. The centre is offset up-left so the bulb is lit from a
            consistent direction across the whole string. */}
        <radialGradient id="bulbGlass" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#fffdf4" />
          <stop offset="34%" stopColor="#ffe8ac" />
          <stop offset="68%" stopColor="#ffd071" />
          <stop offset="100%" stopColor="#e8912c" />
        </radialGradient>

        {/* Tight bloom around the glass. */}
        <radialGradient id="bulbHalo">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#ffc46a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffc46a" stopOpacity="0" />
        </radialGradient>

        {/* Wide, faint spill onto the surface behind. */}
        <radialGradient id="bulbSpill">
          <stop offset="0%" stopColor="#ffbf5e" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#ffbf5e" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffbf5e" stopOpacity="0" />
        </radialGradient>

        {/* Two strands at co-prime-ish spans, so their repeats drift apart
            instead of lining up and reading as wallpaper. Each strand's bulbs
            are split into three interleaved groups that blink independently. */}
        {[0, 1, 2].map((g) => (
          <Swag
            key={`b${g}`}
            id={`swagBack${g}`}
            span={389}
            sag={34}
            top={0}
            bulbs={6}
            bulbR={2.6}
            cord
            group={g}
            groups={3}
            drawWire={g === 0}
          />
        ))}
        {[0, 1, 2].map((g) => (
          <Swag
            key={`f${g}`}
            id={`swagFront${g}`}
            span={268}
            sag={66}
            top={10}
            bulbs={7}
            bulbR={4.2}
            cord
            group={g}
            groups={3}
            drawWire={g === 0}
          />
        ))}
      </defs>

      {/* Every group gets its own period AND delay. Equal periods at
          different offsets would still march in lockstep; mismatched ones
          drift, so the string never repeats a pattern. */}
      {[
        { id: "swagBack0", dur: "1.7s", delay: "0s", o: 0.55, back: true },
        { id: "swagBack1", dur: "2.3s", delay: "0.5s", o: 0.55, back: true },
        { id: "swagBack2", dur: "2.9s", delay: "1.1s", o: 0.55, back: true },
        { id: "swagFront0", dur: "1.9s", delay: "0.3s", o: 1 },
        { id: "swagFront1", dur: "2.6s", delay: "0.9s", o: 1 },
        { id: "swagFront2", dur: "3.3s", delay: "1.6s", o: 1 },
      ].map((l) => (
        <rect
          key={l.id}
          className="bulb-twinkle"
          width="100%"
          height="150"
          fill={`url(#${l.id})`}
          opacity={l.o}
          style={{
            animationDuration: l.dur,
            animationDelay: l.delay,
            // The far strand is softened so it reads as depth rather than as
            // a second string tangled with the first.
            filter: l.back ? "blur(0.7px)" : undefined,
          }}
        />
      ))}
    </svg>

    {/* Lanterns are dashboard-only: on a working screen they hang over the
        page title and the first row of controls, which is clutter rather than
        decoration. The strands above stay on every page. */}
    {showLanterns && (
      <>
        <img
          src="/assets/festival/Ornate Glowing Diwali Lantern.png"
          alt=""
          className="absolute left-[55%] top-16 hidden w-[112px] object-contain drop-shadow-[0_10px_22px_rgba(240,169,60,0.4)] lg:block"
        />
        <img
          src="/assets/festival/Ornate Glowing Diwali Lantern.png"
          alt=""
          className="absolute left-[60%] top-16 hidden w-[88px] object-contain opacity-95 drop-shadow-[0_10px_22px_rgba(240,169,60,0.35)] lg:block"
        />
      </>
    )}
    </div>
  );
};

export default FestiveLights;
