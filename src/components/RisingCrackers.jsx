import React, { useEffect, useRef } from "react";

/**
 * Diwali crackers, rendered as a canvas particle system.
 *
 * The previous version was DOM elements on CSS keyframes. That cannot look
 * real: every spark flies a fixed path at a fixed speed and dies at a fixed
 * radius, so the burst always reads as a mechanical ring. Fireworks look like
 * fireworks because of physics — gravity, air drag, varying launch energy,
 * and sparks that flicker and fade at different rates. That needs per-frame
 * state, which is what a canvas gives you.
 *
 * It is also cheaper: one canvas and one rAF loop, versus ~100 animated DOM
 * nodes each forcing their own compositor layer.
 */

// Warm Diwali palette with two cooler shells for variety, the way a real
// display mixes. Saturated on purpose — the page behind is cream, and pale
// sparks simply disappear on it.
const SHELL_COLORS = [
  ["#FFD166", "#F4A024", "#E2662A"], // gold
  ["#FFE3A3", "#F6C45E", "#C9A227"], // champagne
  ["#FF8FA3", "#E8456B", "#B3261E"], // rose
  ["#FFC2E0", "#D6336C", "#8C1226"], // magenta
  ["#A8E6A1", "#3FA34D", "#2F7D53"], // green
  ["#9FD8F2", "#3C9CD1", "#1F6F7A"], // blue
];

const GRAVITY = 0.035;
const DRAG = 0.985;

// How long between launches, and how many shells may be alive at once. Low
// enough that the page never feels busy or costly.
const MIN_GAP_MS = 900;
const MAX_GAP_MS = 2200;
const MAX_ROCKETS = 3;

// The display runs for ten seconds and stops. Launching ends at the ten
// second mark; shells already in the air are allowed to finish their arc and
// burn out, which is why the loop keeps running a moment longer rather than
// cutting mid-flight.
const SHOW_MS = 10000;

const rand = (min, max) => min + Math.random() * (max - min);

// Launch positions are drawn from shuffled lanes rather than at random.
// Pure randomness over a short show clusters badly — with only a handful of
// shells you get three over the form and none on the left. Cycling through a
// shuffled set of lanes guarantees the whole width is covered, while the
// shuffle and the in-lane jitter keep it from looking like a metronome.
const LANES = 6;

const makeLaneQueue = () => {
  const lanes = Array.from({ length: LANES }, (_, i) => i);
  for (let i = lanes.length - 1; i > 0; i -= 1) {
    const j = (Math.random() * (i + 1)) | 0;
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return lanes;
};

const laneX = (lane, width) => {
  const usable = width * 0.84;
  const start = width * 0.08;
  const band = usable / LANES;
  return start + band * lane + rand(band * 0.2, band * 0.8);
};

class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }

  step() {
    this.vx *= DRAG;
    this.vy = this.vy * DRAG + GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
  }

  get alpha() {
    const t = this.life / this.maxLife;
    // Hold brightness, then fall away fast — sparks do not dim linearly, they
    // burn steadily and then go out.
    return t > 0.65 ? 1 : Math.max(0, t / 0.65) ** 1.6;
  }
}

class Rocket {
  constructor(width, height, x) {
    this.x = x;
    this.y = height + 10;
    this.vx = rand(-0.5, 0.5);
    // Launch energy varies, so shells burst at different heights.
    this.vy = -rand(7.5, 10.5);
    this.targetY = rand(height * 0.14, height * 0.46);
    this.colors = SHELL_COLORS[(Math.random() * SHELL_COLORS.length) | 0];
    this.dead = false;
  }

  step() {
    this.vy += GRAVITY * 1.4;
    this.x += this.vx;
    this.y += this.vy;
    // Burst at the top of the arc, not at a fixed height.
    if (this.vy >= -0.6 || this.y <= this.targetY) this.dead = true;
  }

  explode() {
    const out = [];
    const count = 54 + ((Math.random() * 46) | 0);
    // Willow shells fall slow and long; peonies throw a fast even sphere.
    const willow = Math.random() < 0.3;
    const power = willow ? rand(1.6, 2.6) : rand(3.0, 4.6);

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.06, 0.06);
      // Spread of speeds inside one shell is what gives a burst depth rather
      // than a hollow ring.
      const speed = power * rand(0.45, 1);
      out.push(
        new Particle(
          this.x,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          this.colors[(Math.random() * this.colors.length) | 0],
          willow ? rand(70, 110) : rand(42, 72),
          willow ? rand(1.1, 1.9) : rand(1.3, 2.4)
        )
      );
    }
    return out;
  }
}

const RisingCrackers = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rockets = [];
    const sparks = [];
    let laneQueue = makeLaneQueue();
    const startedAt = performance.now();
    let nextLaunch = startedAt + 400;
    let frame;
    let running = true;
    let finished = false;

    // A hidden tab should not burn CPU on animation nobody can see.
    const onVisibility = () => {
      if (finished) return;
      running = !document.hidden;
      if (running) {
        nextLaunch = performance.now() + 300;
        frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    function tick(now) {
      if (!running) return;

      // Fade the previous frame instead of clearing it. On a transparent
      // canvas `destination-out` is what leaves trails behind the sparks —
      // painting a translucent rectangle would tint the page.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      const launching = now - startedAt < SHOW_MS;

      if (launching && now >= nextLaunch && rockets.length < MAX_ROCKETS) {
        if (laneQueue.length === 0) laneQueue = makeLaneQueue();
        rockets.push(new Rocket(width, height, laneX(laneQueue.pop(), width)));
        nextLaunch = now + rand(MIN_GAP_MS, MAX_GAP_MS);
      }

      for (let i = rockets.length - 1; i >= 0; i -= 1) {
        const r = rockets[i];
        r.step();

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.shadowBlur = 12;
        ctx.shadowColor = r.colors[0];
        ctx.fillStyle = r.colors[0];
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r.dead) {
          sparks.push(...r.explode());
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        s.step();

        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        // Flicker: real sparks tumble, so their brightness jitters.
        ctx.globalAlpha = s.alpha * rand(0.75, 1);
        ctx.shadowBlur = 8;
        ctx.shadowColor = s.color;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Once the window has passed and the sky is empty, wipe the canvas and
      // stop the loop entirely — no idle rAF ticking for the rest of the
      // session.
      if (!launching && rockets.length === 0 && sparks.length === 0) {
        ctx.clearRect(0, 0, width, height);
        finished = true;
        running = false;
        return;
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[55] h-full w-full select-none"
    />
  );
};

export default RisingCrackers;
