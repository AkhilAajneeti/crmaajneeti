import React from "react";

/**
 * "Happy Dussehra" lockup for the navbar.
 *
 * Drawn as live text and vector flourishes rather than shipped as an image:
 * the supplied artwork was 210px wide, so any display size above that was an
 * upscale and read as soft. Text stays sharp at any size, on any display
 * density, and at any browser zoom.
 */
const Flourish = ({ className = "" }) => (
  <svg
    width="54"
    height="18"
    viewBox="0 0 54 18"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    {/* trailing rule, fading away from the words */}
    <path
      d="M0 9h16"
      stroke="#e3790e"
      strokeWidth="1.1"
      strokeLinecap="round"
      opacity="0.45"
    />
    {/* open diamond */}
    <path
      d="M20 9 24 5l4 4-4 4-4-4Z"
      stroke="#e3790e"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M31 9h7"
      stroke="#e3790e"
      strokeWidth="1.1"
      strokeLinecap="round"
      opacity="0.75"
    />
    {/* solid pip closest to the words */}
    <circle cx="43" cy="9" r="2.1" fill="#e3790e" opacity="0.9" />
    <circle cx="50" cy="9" r="1.1" fill="#e3790e" opacity="0.5" />
  </svg>
);

const FestiveGreeting = ({ className = "" }) => (
  <div className={`flex select-none items-center gap-3 ${className}`}>
    <Flourish className="scale-x-[-1]" />

    <div className="flex flex-col items-center leading-none">
      {/* the trailing letter-space would otherwise push the word off-centre */}
      <span className="pl-[0.42em] text-[10px] font-semibold uppercase tracking-[0.42em] text-[#c2410c]">
        Happy
      </span>
      <span className="font-festive text-[30px] leading-none text-[#ac2334]">
        Dussehra
      </span>
    </div>

    <Flourish />
  </div>
);

export default FestiveGreeting;
