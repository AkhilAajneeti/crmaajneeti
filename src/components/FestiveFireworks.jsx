import React from "react";

/**
 * Rocket crackers, drawn rather than photographed.
 *
 * The fireworks art in `public/assets/festival` is a JPEG with a checkerboard
 * fake-transparency baked into it, so compositing it over the panel would
 * print a grey grid. Vector bursts cost nothing, scale cleanly, and can be
 * tinted to the page's gold.
 */

// One burst: `spokes` lines radiating from the origin, every third one longer,
// with a bead at the tip. Alternating length is what stops it reading as a
// mechanical asterisk.
const Burst = ({ x, y, r, spokes = 22, delay = 0, opacity = 0.75 }) => {
  const rays = Array.from({ length: spokes }, (_, i) => {
    const angle = (i / spokes) * Math.PI * 2;
    const len = i % 3 === 0 ? r : i % 2 === 0 ? r * 0.78 : r * 0.62;
    const inner = r * 0.16;
    return {
      x1: x + Math.cos(angle) * inner,
      y1: y + Math.sin(angle) * inner,
      x2: x + Math.cos(angle) * len,
      y2: y + Math.sin(angle) * len,
      long: i % 3 === 0,
    };
  });

  return (
    <g
      className="firework-twinkle"
      // Fed to the keyframes as a variable rather than set as a plain
      // `opacity`: the animation drives opacity itself, so a static value here
      // would be overwritten and every burst would pulse to the same
      // brightness.
      style={{ animationDelay: `${delay}s`, "--spark-opacity": opacity }}
    >
      {rays.map((ray, i) => (
        <g key={i}>
          <line
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke="url(#sparkGold)"
            strokeWidth={ray.long ? 1.6 : 1}
            strokeLinecap="round"
          />
          {ray.long && <circle cx={ray.x2} cy={ray.y2} r="1.6" fill="#f0a93c" />}
        </g>
      ))}
    </g>
  );
};

// A rocket on its way up: a curved trail thinning towards the tail, with a
// lit head. Quadratic rather than straight — a rocket arcs.
const Rocket = ({ x, y, dx, dy, delay = 0 }) => (
  <g className="firework-rise" style={{ animationDelay: `${delay}s` }}>
    <path
      d={`M ${x} ${y} Q ${x + dx * 0.35} ${y + dy * 0.75} ${x + dx} ${y + dy}`}
      stroke="url(#trailGold)"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx={x} cy={y} r="2.6" fill="#f6c45e" />
    <circle cx={x} cy={y} r="5" fill="#f6c45e" opacity="0.28" />
  </g>
);

const FestiveFireworks = ({ className = "" }) => (
  <svg
    viewBox="0 0 520 420"
    aria-hidden="true"
    className={`pointer-events-none select-none ${className}`}
  >
    <defs>
      <linearGradient id="sparkGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f6c45e" />
        <stop offset="55%" stopColor="#e9962f" />
        <stop offset="100%" stopColor="#d4552a" />
      </linearGradient>
      <linearGradient id="trailGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6c45e" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#f6c45e" stopOpacity="0" />
      </linearGradient>
    </defs>

    <Burst x={118} y={96} r={54} spokes={24} delay={0} opacity={0.8} />
    <Burst x={330} y={58} r={38} spokes={20} delay={1.1} opacity={0.62} />
    <Burst x={420} y={176} r={62} spokes={26} delay={2.1} opacity={0.72} />
    <Burst x={232} y={200} r={30} spokes={18} delay={3.0} opacity={0.5} />

    <Rocket x={286} y={300} dx={26} dy={-92} delay={0.4} />
    <Rocket x={372} y={340} dx={-18} dy={-104} delay={2.4} />
  </svg>
);

export default FestiveFireworks;
