import React, { useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";
import { canGlobal, canRead, hasAcl } from "utils/permissions";

// Per-item icon tint keyed by route. Full literal class strings so Tailwind's
// JIT keeps them (a dynamic `border-${x}-200` would get purged).
const ICON_TONES = {
  "/dashboard": { border: "border-rose-200 dark:border-white/10", bg: "bg-rose-50 dark:bg-white/[0.06]", text: "text-rose-500 dark:text-muted-foreground" },
  "/accounts": { border: "border-blue-200 dark:border-white/10", bg: "bg-blue-50 dark:bg-white/[0.06]", text: "text-blue-500 dark:text-muted-foreground" },
  "/leads": { border: "border-emerald-200 dark:border-white/10", bg: "bg-emerald-50 dark:bg-white/[0.06]", text: "text-emerald-500 dark:text-muted-foreground" },
  "/contacts": { border: "border-teal-200 dark:border-white/10", bg: "bg-teal-50 dark:bg-white/[0.06]", text: "text-teal-500 dark:text-muted-foreground" },
  "/pipeline": { border: "border-violet-200 dark:border-white/10", bg: "bg-violet-50 dark:bg-white/[0.06]", text: "text-violet-500 dark:text-muted-foreground" },
  "/tasks": { border: "border-orange-200 dark:border-white/10", bg: "bg-orange-50 dark:bg-white/[0.06]", text: "text-orange-500 dark:text-muted-foreground" },
  "/meeting": { border: "border-pink-200 dark:border-white/10", bg: "bg-pink-50 dark:bg-white/[0.06]", text: "text-pink-500 dark:text-muted-foreground" },
  "/reports": { border: "border-indigo-200 dark:border-white/10", bg: "bg-indigo-50 dark:bg-white/[0.06]", text: "text-indigo-500 dark:text-muted-foreground" },
  "/sales-team": { border: "border-fuchsia-200 dark:border-white/10", bg: "bg-fuchsia-50 dark:bg-white/[0.06]", text: "text-fuchsia-500 dark:text-muted-foreground" },
  "/integrations": { border: "border-cyan-200 dark:border-white/10", bg: "bg-cyan-50 dark:bg-white/[0.06]", text: "text-cyan-500 dark:text-muted-foreground" },
  "/attendance": { border: "border-red-200 dark:border-white/10", bg: "bg-red-50 dark:bg-white/[0.06]", text: "text-red-500 dark:text-muted-foreground" },
  "/profile": { border: "border-sky-200 dark:border-white/10", bg: "bg-sky-50 dark:bg-white/[0.06]", text: "text-sky-500 dark:text-muted-foreground" },
  "/workplace": { border: "border-amber-200 dark:border-white/10", bg: "bg-amber-50 dark:bg-white/[0.06]", text: "text-amber-500 dark:text-muted-foreground" },
  "/complaints": { border: "border-orange-200 dark:border-white/10", bg: "bg-orange-50 dark:bg-white/[0.06]", text: "text-orange-500 dark:text-muted-foreground" },
  "/knowledge-base": { border: "border-blue-200 dark:border-white/10", bg: "bg-blue-50 dark:bg-white/[0.06]", text: "text-blue-500 dark:text-muted-foreground" },
  "/settings": { border: "border-slate-200 dark:border-white/10", bg: "bg-slate-50 dark:bg-white/[0.06]", text: "text-slate-500 dark:text-muted-foreground" },
};
const DEFAULT_ICON_TONE = {
  border: "border-slate-200 dark:border-white/10",
  bg: "bg-slate-50 dark:bg-white/[0.06]",
  text: "text-slate-500 dark:text-muted-foreground",
};

// Rail widths. These two strings are the only place the number lives: the
// aside uses them as Tailwind classes, and the matching rem value goes into
// the `--sidebar-w` variable that `.app-main` reads to offset every page.
const COLLAPSED_W = "5rem"; // lg:w-20
const EXPANDED_W = "16rem"; // lg:w-64

const COLLAPSE_KEY = "sidebar_collapsed";

/** Read the saved preference, tolerating storage being unavailable. */
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  } catch {
    // Private windows and blocked site data throw on access rather than
    // returning null, so the default has to survive an exception.
    return false;
  }
};
const Sidebar = ({ isOpen = false, onClose }) => {
  const user = JSON.parse(localStorage.getItem("login_object") || "{}");
  const isAdmin = String(user?.type).toLowerCase() === "admin";
  const shouldShowAdmin = hasAcl() ? canGlobal("portalPermission") : isAdmin;

  const location = useLocation();
  const navigate = useNavigate();
  const [isUpgradeCardVisible, setIsUpgradeCardVisible] = useState(true);

  // Desktop-only collapse. On mobile the sidebar is an overlay that slides in
  // and out, so a narrow icon rail there would be a second, conflicting idea
  // of "closed" — every collapsed style below is therefore `lg:` prefixed and
  // the drawer keeps its full labels.
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed);

  // Publish the width so `.app-main` can offset the page. Set on the root
  // element rather than passed through props, which keeps all 18 pages free
  // of any knowledge of the sidebar's state.
  // Layout effect, not effect: this runs before the browser paints, so a
  // session that starts collapsed never flashes the full-width layout first.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      isCollapsed ? COLLAPSED_W : EXPANDED_W,
    );
  }, [isCollapsed]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // A blocked store only costs the preference, never the toggle.
      }
      return next;
    });
  };

  // Applied to anything that only makes sense beside an icon: labels, section
  // headings, the footer credit. Hidden from `lg` up while collapsed, still
  // visible in the mobile drawer.
  const hideWhenCollapsed = isCollapsed ? "lg:hidden" : "";

  const navigationGroups = [
    {
      title: "MAIN",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "CRM",
      items: [
        { label: "Accounts", path: "/accounts", icon: "Building2", entity: "Account" },
        { label: "Leads", path: "/leads", icon: "Target", entity: "Lead" },
        { label: "Contacts", path: "/contacts", icon: "Contact", entity: "Contact" },
        { label: "Pipeline", path: "/pipeline", icon: "Filter" },
        { label: "Task", path: "/tasks", icon: "ListChecks", entity: "Task" },
        { label: "Meeting", path: "/meeting", icon: "Projector", entity: "Meeting" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { label: "Reports", path: "/reports", icon: "BarChart3" },
        { label: "Sales Team", path: "/sales-team", icon: "Trophy", entity: "Lead" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { label: "Integrations", path: "/integrations", icon: "Puzzle" },
        { label: "Attendance", path: "/attendance", icon: "ClipboardList", entity: "CAttendanceRequest" },
        { label: "Profile", path: "/profile", icon: "User", entity: "CProfileDetails" },
      ],
    },
    {
      title: "WORKSPACE",
      items: [
        { label: "Notes", path: "/workplace", icon: "NotebookText", entity: "CWorkplaceNotes" },
        { label: "Complaints", path: "/complaints", icon: "AlertTriangle", entity: "Case" },
        { label: "Knowledge", path: "/knowledge-base", icon: "LibraryBig", entity: "KnowledgeBaseArticle" },
      ],
    },
    {
      title: "ADMIN",
      items: [
        { label: "Settings", path: "/settings", icon: "Settings" },

      ],
    },
  ];

  const navigationItems = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.entity || canRead(item.entity)),
    }))
    .filter((group) => group.items.length > 0);

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const handleUpgradeClick = () => {
    navigate("/billing");
    if (onClose) {
      onClose();
    }
  };

  const handleUpgradeClose = () => {
    setIsUpgradeCardVisible(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 overflow-hidden bg-gradient-to-b from-[color:var(--sidebar-from)] to-[color:var(--sidebar-to)] border-r border-border shadow-sm z-50 lg:z-30
          transform transition-all duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        {/* The mandala watermark used to sit here. Removed per the design
            QA: it added noise behind the nav labels and, in dark mode, was
            another accent competing with the active item. */}

        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-border p-6 ${
              isCollapsed ? "lg:flex-col lg:gap-3 lg:px-0 lg:py-4" : ""
            }`}
          >
            {/* `min-w-0` is what lets the caption truncate instead of forcing
                the row wider: a flex child defaults to min-width:auto and
                refuses to shrink below its content. */}
            <div className="flex min-w-0 items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Icon name="Zap" size={20} color="white" />
              </div>
              {/* Stacked, not side by side. As an inline pill next to "CRM"
                  the attribution had roughly 90px to work with on a phone and
                  broke across three lines. On its own line it fits. */}
              <div className={`flex min-w-0 flex-col ${hideWhenCollapsed}`}>
                <span className="text-lg font-semibold leading-tight text-foreground">
                  CRM
                </span>
                <span className="truncate text-[11px] leading-tight text-muted-foreground">
                  By Aajneeti Connect Ltd.
                </span>
              </div>
            </div>

            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden shrink-0"
              aria-label="Close navigation menu"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="thin-scroll flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-6">

              {navigationItems.map((group) => (
                <div key={group.title}>

                  {/* SECTION TITLE */}
                  <p
                    className={`px-3 mb-2 text-xs font-semibold text-[color:var(--sidebar-heading)] uppercase tracking-wider ${hideWhenCollapsed}`}
                  >
                    {group.title}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const tone = ICON_TONES[item.path] || DEFAULT_ICON_TONE;

                      return (
                        <div key={item.path}>

                          {/* 🔴 PARENT */}
                          <button
                            onClick={() => handleNavigation(item.path)}
                            title={isCollapsed ? item.label : undefined}
                            className={`
                    shine-hover group w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-200 ease-out
                    ${isCollapsed ? "lg:justify-center lg:space-x-0 lg:px-0" : ""}
                    ${isActive
                                ? "bg-gradient-to-r from-black to-mahroon text-white"
                                : "text-muted-foreground hover:bg-[color:var(--sidebar-hover)]"}
                  `}
                          >
                            <span className={`
    flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border
    transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-active:scale-95
    ${isActive
                                ? "border-white/40 bg-white/15"
                                : `${tone.border} ${tone.bg} group-hover:shadow-sm`}
  `}>
                              <Icon name={item.icon} size={18} className={`
      transition-all duration-300 ease-out group-hover:rotate-6
      ${isActive ? "text-white" : tone.text}
    `} />
                            </span>
                            <span className={`
    transition-all duration-300 ease-out group-hover:-translate-y-0.1 group-hover:rotate-3 group-hover:scale-110 group-active:scale-95
    ${hideWhenCollapsed}
    ${isActive ? "text-white" : "text-foreground group-hover:text-[color:var(--sidebar-hover-text)] font-semibold"}`}>{item.label}</span>
                          </button>

                          {/* 🌳 CHILD TREE (ONLY if exists) */}
                          {item.children && (
                            <div className={`ml-6 mt-2 relative ${hideWhenCollapsed}`}>

                              {/* Vertical line */}
                              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-300"></div>

                              <div className="space-y-3">
                                {item.children.map((child) => {
                                  const isChildActive = location.pathname === child.path;

                                  return (
                                    <div key={child.path} className="relative">

                                      {/* Curve */}
                                      <div className="absolute left-3 top-4 w-4 h-4 border-l border-b border-gray-300 rounded-bl-lg"></div>

                                      <button
                                        onClick={() => handleNavigation(child.path)}
                                        className={`
                                ml-6 w-full px-3 py-2 text-sm rounded-xl text-left
                                transition-all
                                ${isChildActive
                                            ? "bg-red-50 text-red-600 shadow-sm"
                                            : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}
                              `}
                                      >
                                        {/* Active red bar */}
                                        {isChildActive && (
                                          <span className="absolute left-0 top-1 bottom-1 w-1 bg-red-600 rounded-r-md"></span>
                                        )}

                                        {child.label}
                                      </button>

                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}

            </div>
          </nav>

          {/* Footer. Was a ~55px maroon band carrying a credit line — the
              loudest block in the rail and, at 808px tall, part of why the
              SYSTEM group was cut off. Reduced to one quiet line so the menu
              gets the height back. */}
          <div className="mt-auto border-t border-border px-4 py-2.5">
            <p
              className={`text-[10.5px] leading-tight text-muted-foreground ${hideWhenCollapsed}`}
            >
              © 2026 Aajneeti Connect Ltd.
            </p>
            {isCollapsed && (
              <p className="hidden text-center text-[10.5px] text-muted-foreground lg:block">
                ©
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Collapse handle, desktop only. It sits OUTSIDE the <aside> on
          purpose, for two reasons: the aside is `overflow-hidden`, which would
          clip a button straddling its right edge, and the app Header is
          `fixed ... z-40` while the sidebar is `lg:z-30`, so anything inside
          the rail's top region is painted over. As a fixed sibling at z-50 it
          is visible and clickable, and `.sidebar-toggle-anchor` keeps it glued
          to the rail's edge as the width animates. */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={!isCollapsed}
        aria-label={
          isCollapsed ? "Expand navigation menu" : "Collapse navigation menu"
        }
        title={isCollapsed ? "Expand menu" : "Collapse menu"}
        className="sidebar-toggle-anchor top-[104px] z-50 hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition-colors hover:bg-muted hover:text-foreground lg:flex"
      >
        <Icon name={isCollapsed ? "ChevronRight" : "ChevronLeft"} size={16} />
      </button>
    </>
  );
};

export default Sidebar;
