import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * "Happy Diwali" set as type rather than dropped in as a picture.
 *
 * The JPEG wordmark used on the login page is a flat orange block that sits
 * badly on a cream dashboard. The reference is calligraphic maroon — small
 * italic "Happy" riding above a much larger "Diwali", with a lit diya over
 * the D — which is reproducible with the two serif italics already loaded,
 * and it stays sharp at any size with no background to knock out.
 */
const DiwaliScript = ({ className = "" }) => {
  const reduceMotion = useReducedMotion();

  const rise = (delay) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay } }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className={`relative select-none leading-none ${className}`}>
      <motion.p
        {...rise(0.1)}
        className="font-script text-[clamp(15px,1.5vw,21px)] italic text-[#b4414c]"
      >
        Happy
      </motion.p>

      <motion.p
        {...rise(0.25)}
        className="relative -mt-0.5 font-display text-[clamp(26px,2.9vw,40px)] font-semibold italic tracking-tight"
      >
        <span className="bg-[linear-gradient(96deg,#7d1020_0%,#a8182c_48%,#c0392b_100%)] bg-clip-text text-transparent">
          Diwali
        </span>

        {/* The diya sits over the D's ascender. Absolutely placed so it can
            never affect the line's metrics or wrap the word. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-[0.34em] left-[0.46em] text-[0.3em] leading-none"
        >
          🪔
        </span>
      </motion.p>
    </div>
  );
};

export default DiwaliScript;
