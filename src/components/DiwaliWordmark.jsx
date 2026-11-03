import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * "Happy Diwali", shown whole with a single zoom-out on load.
 *
 * `mix-blend-multiply` removes the white: multiplying by white leaves the
 * panel untouched and only the lettering survives.
 *
 * The catch, and why this component looks the way it does: an element only
 * blends with the backdrop of ITS OWN stacking context. Put the animation on
 * a wrapper and that wrapper's `transform` creates a new stacking context, so
 * the image ends up blending against the wrapper's transparent background
 * instead of the panel — and the white rectangle stays. The animation is
 * therefore on the <img> itself, which still blends with the panel behind it.
 *
 * For the same reason the mount point in index.jsx must not carry a z-index
 * or a translate.
 */
const DiwaliWordmark = ({ className = "" }) => {
  const reduceMotion = useReducedMotion();

  const entrance = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } }
    : {
        // Starts oversized and settles to its true size.
        initial: { opacity: 0, scale: 1.18 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <div
      className={`pointer-events-none relative select-none ${className}`}
      style={{
        // Sized against viewport height so it shrinks on short screens
        // instead of crowding the card below it.
        width: "clamp(200px, 27vh, 330px)",
        aspectRatio: "626 / 385",
      }}
    >
      <motion.img
        {...entrance}
        src="/assets/festival/diwali.jpg"
        alt="Happy Diwali"
        className="absolute inset-0 h-full w-full object-contain mix-blend-multiply"
        // Clips any JPEG ringing around the letters back to true white so it
        // multiplies away with the rest of the background.
        style={{ filter: "brightness(1.06) contrast(1.04) saturate(1.05)" }}
      />
    </div>
  );
};

export default DiwaliWordmark;
