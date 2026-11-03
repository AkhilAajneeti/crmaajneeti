import React from "react";
import { useLocation } from "react-router-dom";
import FestiveLights from "components/FestiveLights";

/**
 * Mounts the festival lights once for the whole app.
 *
 * It lives inside the router but ABOVE the route switch, so navigating
 * between pages does not unmount and replay it — the lights simply stay lit
 * as you move around.
 *
 * Login is excluded: that page has its own festival artwork and no top bar
 * for the strands to hang from.
 */
const HIDDEN_ON = ["/login"];

// The hanging lanterns are reserved for the dashboard. Elsewhere they would
// sit over the page title and the first row of filters.
const LANTERNS_ON = ["/dashboard", "/"];

const FestiveOverlay = () => {
  const { pathname } = useLocation();

  const hidden = HIDDEN_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (hidden) return null;

  const showLanterns = LANTERNS_ON.includes(pathname);

  return <FestiveLights showLanterns={showLanterns} />;
};

export default FestiveOverlay;
