import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The festival greeting above the sign-in card.
 *
 * The effect rests on the size jump between a small italic line and two lines
 * of very large caps, so the display type is clamped against viewport height
 * rather than given fixed breakpoint sizes — it has to stay dominant on a
 * laptop and still fit a phone.
 */
const DiwaliGreeting = () => {
  const reduceMotion = useReducedMotion();

  const rise = (delay) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="relative mb-[clamp(12px,2.4vh,26px)] text-center">
      <motion.p
        {...rise(0.05)}
        className="relative font-script text-[clamp(15px,2vh,19px)] italic text-[#6b2230]"
      >
        Festival of lights and love.
      </motion.p>

      <motion.h1
        {...rise(0.15)}
        className="relative mt-1 font-display text-[clamp(38px,7.2vh,66px)] font-bold uppercase leading-[0.92] tracking-[0.01em]"
      >
        {/* Deep maroon running to a lit orange on the right, matching the
            reference's gradient rather than a flat fill. */}
        <span className="block bg-[linear-gradient(100deg,#8c1226_0%,#a51f2b_45%,#d4552a_78%,#e8832c_100%)] bg-clip-text text-transparent">
          Happy
        </span>

        <span className="relative inline-block bg-[linear-gradient(100deg,#8c1226_0%,#a51f2b_42%,#c9402b_72%,#e0742c_100%)] bg-clip-text text-transparent">
          Diwali
          {/* The flame sits on the final I, as in the reference. Absolutely
              placed so it cannot affect the line's metrics. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-[0.42em] right-[0.04em] text-[0.3em] leading-none"
          >
            🪔
          </span>
        </span>
      </motion.h1>

      {/* Lotus divider between two tapering rules. */}
      <motion.div
        {...rise(0.3)}
        className="relative mt-[clamp(8px,1.6vh,16px)] flex items-center justify-center gap-2.5"
      >
        <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#e0b070]" />
        <span className="text-[15px] leading-none text-[#d4552a]">❖</span>
        <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#e0b070]" />
      </motion.div>
    </div>
  );
};

export default DiwaliGreeting;
