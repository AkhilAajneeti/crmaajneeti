import React from "react";

/**
 * Small saffron four-petal mark used ahead of card and section titles, and the
 * rule that trails a page heading. Drawn inline rather than shipped as an image
 * so it inherits size and colour at every call site.
 */
export const FestiveMark = ({ size = 14, className = "" }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center ${className}`}
    aria-hidden="true"
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2c.9 4.2 3.1 6.9 7.4 8-4.3 1.1-6.5 3.8-7.4 8-.9-4.2-3.1-6.9-7.4-8 4.3-1.1 6.5-3.8 7.4-8Z"
        fill="#E3790E"
        opacity="0.85"
      />
      <circle cx="12" cy="10" r="1.6" fill="#B4420B" />
    </svg>
  </span>
);

/**
 * Diamond-and-line flourish that trails a page heading, as on the festival
 * banners. Fades out to the right so it never competes with the title.
 */
export const FestiveRule = ({ className = "" }) => (
  <span
    className={`hidden items-center gap-2 sm:inline-flex ${className}`}
    aria-hidden="true"
  >
    <svg width="46" height="12" viewBox="0 0 46 12" fill="none">
      <path
        d="M6 6 10 2l4 4-4 4-4-4Z"
        stroke="#E3790E"
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M0 6h5M15 6h8" stroke="#E3790E" strokeWidth="1.2" opacity="0.7" />
      <path
        d="M27 6c3-3 6-3 9 0-3 3-6 3-9 0Z"
        stroke="#E3790E"
        strokeWidth="1.1"
        opacity="0.55"
        fill="none"
      />
    </svg>
    <span className="h-px w-14 bg-gradient-to-r from-[#e3790e]/45 to-transparent lg:w-24" />
  </span>
);

export default FestiveMark;
