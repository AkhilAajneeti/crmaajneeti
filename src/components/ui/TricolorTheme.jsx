import React from "react";

// Independence Day tricolor wash, mounted once in App.jsx so every route gets
// it without touching individual pages.
//
// It renders *above* the page rather than behind it: each page shell is a
// `min-h-screen bg-background` block (opaque white), so anything painted
// underneath would be completely hidden. `pointer-events-none` on every layer
// keeps it purely decorative — clicks, hovers and focus all pass straight
// through to the UI below.
//
// z-100 sits above page content and drawers (z-50) but below react-hot-toast
// (z-9999), so toasts stay untinted.

const SAFFRON = "#FF9933";
const GREEN = "#138808";

const saffronBurst = {
  background:
    "radial-gradient(closest-side, rgba(255,153,51,0.20), rgba(255,153,51,0.06) 55%, rgba(255,153,51,0) 100%)",
};

const greenBurst = {
  background:
    "radial-gradient(closest-side, rgba(19,136,8,0.17), rgba(19,136,8,0.05) 55%, rgba(19,136,8,0) 100%)",
};

const TricolorTheme = () => (
  <div
    aria-hidden="true"
    className="tricolor-theme pointer-events-none fixed inset-0 z-[100] overflow-hidden"
  >
    {/* Flag stripes pinned to the very top of the viewport */}
    <div className="absolute inset-x-0 top-0 flex h-[2px] opacity-70">
      <div className="flex-1" style={{ backgroundColor: SAFFRON }} />
      <div className="flex-1 bg-white" />
      <div className="flex-1" style={{ backgroundColor: GREEN }} />
    </div>

    {/* Saffron burst — radiates down from the top edge. The ellipse is anchored
        mostly off-screen so only its soft outer falloff lands on the content. */}
    <div className="absolute -top-72 left-1/2 h-[480px] w-[150vw] -translate-x-1/2">
      <div
        className="tricolor-burst h-full w-full rounded-[50%] blur-2xl"
        style={saffronBurst}
      />
    </div>

    {/* Green burst — radiates up from the bottom edge, offset in time so the
        two never peak together. */}
    <div className="absolute -bottom-72 left-1/2 h-[480px] w-[150vw] -translate-x-1/2">
      <div
        className="tricolor-burst tricolor-burst-delayed h-full w-full rounded-[50%] blur-2xl"
        style={greenBurst}
      />
    </div>
  </div>
);

export default TricolorTheme;
