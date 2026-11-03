import React from "react";
import FestiveFireworks from "components/FestiveFireworks";

/**
 * The festival scene behind the dashboard header: a temple on the right,
 * sparkle bursts, and mandala watermarks.
 *
 * Decoration only — `pointer-events-none` throughout and absolutely
 * positioned, so it can never intercept a click or move the layout. Mount it
 * as the FIRST child of a `relative` parent so real content paints over it.
 *
 * The string lights and lanterns are NOT here: they belong to
 * `FestiveLights`, which is fixed to the viewport so it can cross in front of
 * the top bar.
 */
const FestiveDecor = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none absolute inset-x-0 top-0 select-none overflow-hidden ${className}`}
  >
    {/* Warm wash from the top edge, so the artwork has something to sit in
        rather than floating on flat cream. */}
    <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(250,214,148,0.2)_0%,rgba(250,214,148,0.08)_52%,rgba(250,214,148,0)_100%)]" />

    {/* Temple, bleeding off the right edge and faded well back — it is a
        backdrop for the heading, not a picture to look at. */}
    <img
      src="/assets/festival/Illuminated Ivory Hindu Temple Garden.png"
      alt=""
      className="absolute -right-6 top-16 hidden w-[260px] object-contain opacity-[0.42] lg:block xl:w-[320px]"
    />

    {/* Mandala watermarks, barely there. */}
    <img
      src="/assets/festival/festive-mandala-full.png"
      alt=""
      className="absolute -left-28 top-6 w-[240px] opacity-[0.045]"
    />
    <img
      src="/assets/festival/festive-mandala-full.png"
      alt=""
      className="absolute right-[36%] -top-24 hidden w-[240px] opacity-[0.04] xl:block"
    />

    {/* Sparkle bursts — the same vector crackers the login showcase uses. */}
    <FestiveFireworks className="absolute left-[24%] top-2 hidden h-[150px] w-[190px] opacity-45 lg:block" />
    <FestiveFireworks className="absolute right-[30%] top-[46%] hidden h-[120px] w-[150px] opacity-35 xl:block" />
  </div>
);

export default FestiveDecor;
