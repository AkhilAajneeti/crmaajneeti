import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";
import { canGlobal, canRead, hasAcl } from "utils/permissions";

// Per-item icon tint keyed by route. Full literal class strings so Tailwind's
// JIT keeps them (a dynamic `border-${x}-200` would get purged).
const ICON_TONES = {
  "/dashboard": { border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-500" },
  "/accounts": { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-500" },
  "/leads": { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-500" },
  "/pipeline": { border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-500" },
  "/tasks": { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-500" },
  "/meeting": { border: "border-pink-200", bg: "bg-pink-50", text: "text-pink-500" },
  "/reports": { border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-500" },
  "/integrations": { border: "border-cyan-200", bg: "bg-cyan-50", text: "text-cyan-500" },
  "/attendance": { border: "border-red-200", bg: "bg-red-50", text: "text-red-500" },
  "/profile": { border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-500" },
  "/workplace": { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-500" },
  "/complaints": { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-500" },
  "/knowledge-base": { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-500" },
  "/settings": { border: "border-slate-200", bg: "bg-slate-50", text: "text-slate-500" },
};
const DEFAULT_ICON_TONE = {
  border: "border-slate-200",
  bg: "bg-slate-50",
  text: "text-slate-500",
};
const Sidebar = ({ isOpen = false, onClose }) => {
  const user = JSON.parse(localStorage.getItem("login_object") || "{}");
  const isAdmin = String(user?.type).toLowerCase() === "admin";
  const shouldShowAdmin = hasAcl() ? canGlobal("portalPermission") : isAdmin;

  const location = useLocation();
  const navigate = useNavigate();
  const [isUpgradeCardVisible, setIsUpgradeCardVisible] = useState(true);

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
        { label: "Pipeline", path: "/pipeline", icon: "Filter" },
        { label: "Task", path: "/tasks", icon: "ListChecks", entity: "Task" },
        { label: "Meeting", path: "/meeting", icon: "Projector", entity: "Meeting" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { label: "Reports", path: "/reports", icon: "BarChart3" },
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
          fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-sm z-50 lg:z-30
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Zap" size={20} color="white" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">
                  CRM
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                  By Aajneeti Connect ltd.
                </span>
              </div>
            </div>

            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
              aria-label="Close navigation menu"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-6">

              {navigationItems.map((group) => (
                <div key={group.title}>

                  {/* SECTION TITLE */}
                  <p className="px-3 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                            className={`
                    group w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-200 ease-out
                    ${isActive
                                ? "bg-gradient-to-r from-black to-[#AC2334] text-white"
                                : "text-gray-600 hover:bg-gray-100"}
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
    ${isActive ? "text-white" : "text-gray-800 group-hover:text-red-600 font-semibold"}`}>{item.label}</span>
                          </button>

                          {/* 🌳 CHILD TREE (ONLY if exists) */}
                          {item.children && (
                            <div className="ml-6 mt-2 relative">

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
                                            : "text-gray-500 hover:bg-red-50 hover:text-red-500"}
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

          {/* Footer — waved brand card. The curve is fitted to the profile
              card's wave, so the two read as the same family. */}
          <div className="p-3">
            <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(96deg,#270b2a_0%,#2d0b26_35%,#480d28_55%,#6b102e_76%,#811231_91%,#8d1a3a_100%)] shadow-lg shadow-rose-900/25">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 320 130"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="sidebarCrest" x1="0" y1="0" x2="0.15" y2="1">
                    <stop offset="0%" stopColor="#fdeaef" />
                    <stop offset="100%" stopColor="#fcd5e7" />
                  </linearGradient>
                  {/* Strands fade out to the left so they read as texture trailing
                      the crest rather than stripes across the whole card. */}
                  <linearGradient id="sidebarContour" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffc9dc" stopOpacity="0" />
                    <stop offset="40%" stopColor="#ffc9dc" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ffd9e6" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Pale band: white ribbon first, pink laid over all but its lower edge */}
                <path d="M0,50.3 C5.3,46.9 21.3,33.8 32,29.8 C42.7,25.8 53.3,25.9 64,26.3 C74.7,26.7 85.3,29.6 96,32.4 C106.7,35.2 117.3,40.0 128,43.3 C138.7,46.6 149.3,50.2 160,52.1 C170.7,54.0 181.3,55.1 192,54.7 C202.7,54.3 213.3,52.6 224,49.7 C234.7,46.8 245.3,42.6 256,37.4 C266.7,32.2 277.3,24.8 288,18.6 C298.7,12.4 314.7,3.1 320,0.0 V0 H0 Z" fill="#fbf7fa" />
                <path d="M0,41.3 C5.3,37.9 21.3,24.8 32,20.8 C42.7,16.8 53.3,16.9 64,17.3 C74.7,17.7 85.3,20.6 96,23.4 C106.7,26.2 117.3,31.0 128,34.3 C138.7,37.6 149.3,41.2 160,43.1 C170.7,45.0 181.3,46.1 192,45.7 C202.7,45.3 213.3,43.6 224,40.7 C234.7,37.8 245.3,33.6 256,28.4 C266.7,23.2 277.3,15.8 288,9.6 C298.7,3.4 314.7,-5.9 320,-9.0 V0 H0 Z" fill="url(#sidebarCrest)" />

                <g
                  fill="none"
                  stroke="url(#sidebarContour)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                >
                  <path d="M0,57.3 C5.3,53.9 21.3,40.8 32,36.8 C42.7,32.8 53.3,32.9 64,33.3 C74.7,33.7 85.3,36.6 96,39.4 C106.7,42.2 117.3,47.0 128,50.3 C138.7,53.6 149.3,57.2 160,59.1 C170.7,61.0 181.3,62.1 192,61.7 C202.7,61.3 213.3,59.6 224,56.7 C234.7,53.8 245.3,49.6 256,44.4 C266.7,39.2 277.3,31.8 288,25.6 C298.7,19.4 314.7,10.1 320,7.0" strokeOpacity="0.5" />
                  <path d="M0,64.3 C5.3,60.9 21.3,47.8 32,43.8 C42.7,39.8 53.3,39.9 64,40.3 C74.7,40.7 85.3,43.6 96,46.4 C106.7,49.2 117.3,54.0 128,57.3 C138.7,60.6 149.3,64.2 160,66.1 C170.7,68.0 181.3,69.1 192,68.7 C202.7,68.3 213.3,66.6 224,63.7 C234.7,60.8 245.3,56.6 256,51.4 C266.7,46.2 277.3,38.8 288,32.6 C298.7,26.4 314.7,17.1 320,14.0" strokeOpacity="0.45" />
                  <path d="M0,71.3 C5.3,67.9 21.3,54.8 32,50.8 C42.7,46.8 53.3,46.9 64,47.3 C74.7,47.7 85.3,50.6 96,53.4 C106.7,56.2 117.3,61.0 128,64.3 C138.7,67.6 149.3,71.2 160,73.1 C170.7,75.0 181.3,76.1 192,75.7 C202.7,75.3 213.3,73.6 224,70.7 C234.7,67.8 245.3,63.6 256,58.4 C266.7,53.2 277.3,45.8 288,39.6 C298.7,33.4 314.7,24.1 320,21.0" strokeOpacity="0.4" />
                  <path d="M0,78.3 C5.3,74.9 21.3,61.8 32,57.8 C42.7,53.8 53.3,53.9 64,54.3 C74.7,54.7 85.3,57.6 96,60.4 C106.7,63.2 117.3,68.0 128,71.3 C138.7,74.6 149.3,78.2 160,80.1 C170.7,82.0 181.3,83.1 192,82.7 C202.7,82.3 213.3,80.6 224,77.7 C234.7,74.8 245.3,70.6 256,65.4 C266.7,60.2 277.3,52.8 288,46.6 C298.7,40.4 314.7,31.1 320,28.0" strokeOpacity="0.35" />
                  <path d="M0,85.3 C5.3,81.9 21.3,68.8 32,64.8 C42.7,60.8 53.3,60.9 64,61.3 C74.7,61.7 85.3,64.6 96,67.4 C106.7,70.2 117.3,75.0 128,78.3 C138.7,81.6 149.3,85.2 160,87.1 C170.7,89.0 181.3,90.1 192,89.7 C202.7,89.3 213.3,87.6 224,84.7 C234.7,81.8 245.3,77.6 256,72.4 C266.7,67.2 277.3,59.8 288,53.6 C298.7,47.4 314.7,38.1 320,35.0" strokeOpacity="0.3" />
                  <path d="M0,92.3 C5.3,88.9 21.3,75.8 32,71.8 C42.7,67.8 53.3,67.9 64,68.3 C74.7,68.7 85.3,71.6 96,74.4 C106.7,77.2 117.3,82.0 128,85.3 C138.7,88.6 149.3,92.2 160,94.1 C170.7,96.0 181.3,97.1 192,96.7 C202.7,96.3 213.3,94.6 224,91.7 C234.7,88.8 245.3,84.6 256,79.4 C266.7,74.2 277.3,66.8 288,60.6 C298.7,54.4 314.7,45.1 320,42.0" strokeOpacity="0.25" />
                  <path d="M0,99.3 C5.3,95.9 21.3,82.8 32,78.8 C42.7,74.8 53.3,74.9 64,75.3 C74.7,75.7 85.3,78.6 96,81.4 C106.7,84.2 117.3,89.0 128,92.3 C138.7,95.6 149.3,99.2 160,101.1 C170.7,103.0 181.3,104.1 192,103.7 C202.7,103.3 213.3,101.6 224,98.7 C234.7,95.8 245.3,91.6 256,86.4 C266.7,81.2 277.3,73.8 288,67.6 C298.7,61.4 314.7,52.1 320,49.0" strokeOpacity="0.2" />
                  <path d="M0,106.3 C5.3,102.9 21.3,89.8 32,85.8 C42.7,81.8 53.3,81.9 64,82.3 C74.7,82.7 85.3,85.6 96,88.4 C106.7,91.2 117.3,96.0 128,99.3 C138.7,102.6 149.3,106.2 160,108.1 C170.7,110.0 181.3,111.1 192,110.7 C202.7,110.3 213.3,108.6 224,105.7 C234.7,102.8 245.3,98.6 256,93.4 C266.7,88.2 277.3,80.8 288,74.6 C298.7,68.4 314.7,59.1 320,56.0" strokeOpacity="0.15" />
                </g>
              </svg>

              <div className="relative px-4 pt-[4.5rem] pb-5 text-center">
                <p className="text-[11px] font-semibold tracking-wide text-white">
                  Developed by Aajneeti connect ltd.
                </p>
                <p className="mt-1 text-[11px] text-white/70">
                  © 2026 All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
