import { useEffect, useState } from "react";

// True below Tailwind's `sm` breakpoint.
//
// Card titles, and anything else passed to a component as a PROP rather than
// a class, cannot be switched by a media query — a prop is decided in JS
// before any CSS runs. This subscribes to the same breakpoint the Tailwind
// classes use, so the two stay in step.
const QUERY = "(max-width: 639px)";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
