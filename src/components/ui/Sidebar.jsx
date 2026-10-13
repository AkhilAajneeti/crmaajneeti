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

          {/* Footer — waved brand card */}
          <div className="p-3">
            <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(100deg,#3a0a1d_0%,#550f28_30%,#8a1134_68%,#b01440_100%)] shadow-lg shadow-rose-900/25">

              {/* Pale crest plus the contour lines trailing it, drawn in one
                  coordinate space so they stay parallel at any width. */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 320 130"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="sidebarCrest" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#fffafc" />
                    <stop offset="100%" stopColor="#f9d2df" />
                  </linearGradient>
                  {/* Lines fade out to the left so they read as texture, not stripes */}
                  <linearGradient id="sidebarContour" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffd3e0" stopOpacity="0.04" />
                    <stop offset="45%" stopColor="#ffd3e0" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#ffd3e0" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,0 L300,0 C268,8 214,42 150,54 C98,64 46,58 0,42 Z"
                  fill="url(#sidebarCrest)"
                />
                <g
                  fill="none"
                  stroke="url(#sidebarContour)"
                  strokeWidth="0.9"
                  vectorEffect="non-scaling-stroke"
                >
                  <path d="M-6,48 C46,64 98,70 150,60 C214,48 268,14 326,-2" />
                  <path d="M-6,55 C46,71 98,77 150,67 C214,55 268,21 326,5" />
                  <path d="M-6,62 C46,78 98,84 150,74 C214,62 268,28 326,12" />
                  <path d="M-6,69 C46,85 98,91 150,81 C214,69 268,35 326,19" />
                  <path d="M-6,76 C46,92 98,98 150,88 C214,76 268,42 326,26" />
                  <path d="M-6,83 C46,99 98,105 150,95 C214,83 268,49 326,33" />
                  <path d="M-6,90 C46,106 98,112 150,102 C214,90 268,56 326,40" />
                  <path d="M-6,97 C46,113 98,119 150,109 C214,97 268,63 326,47" />
                  <path d="M-6,104 C46,120 98,126 150,116 C214,104 268,70 326,54" />
                  <path d="M-6,111 C46,127 98,133 150,123 C214,111 268,77 326,61" />
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
