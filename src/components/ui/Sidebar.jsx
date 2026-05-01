import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";
import { canGlobal, canRead, hasAcl } from "utils/permissions";
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
    // ✅ ADMIN ONLY
    ...(shouldShowAdmin
      ? [
        {
          title: "ADMIN",
          items: [
            { label: "Settings", path: "/settings", icon: "Settings" },

          ],
        },
      ]
      : []),
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
                            <Icon name={item.icon} size={18} className={`
    transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-6 group-hover:scale-110 group-active:scale-95
    ${isActive ? "text-white" : "text-gray-500 group-hover:text-red-600"}
  `} />
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

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              Developed by Aajneeti connect ltd.
              <br />© 2026 All rights reserved.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
