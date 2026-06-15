import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";

import { fetchNotifications } from "services/notification.service";
import NotificationDropdown from "components/NotificationDropdown";
import { useNotification } from "NotificationContext";
import { useNotificationCount } from "hooks/useNotificationCount";
import Avatar from "react-avatar";
import { Link } from "react-router-dom";
import { clearLeadsCache } from "services/leads.service";
const Header = ({ onMenuToggle, isSidebarOpen = false }) => {
  const LogInuserstr = localStorage.getItem("login_object");
  const LogInuser = LogInuserstr ? JSON.parse(LogInuserstr) : null;

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsHelpDropdownOpen(false);
  };

  const handleHelpDropdownToggle = () => {
    setIsHelpDropdownOpen(!isHelpDropdownOpen);
    setIsUserDropdownOpen(false);
  };

  const handleDropdownClose = () => {
    setIsUserDropdownOpen(false);
    setIsHelpDropdownOpen(false);
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log("User Logout");
    // 1️⃣ Clear auth data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("username");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("login_object");
    localStorage.removeItem("acl");
    localStorage.removeItem("isAuthenticated");

    // clear cache
    clearLeadsCache();

    // 2️⃣ Close dropdown
    handleDropdownClose();

    // 3️⃣ Redirect to login
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    // Navigate to profile
    console.log("Profile clicked");
    navigate("/profile");
    handleDropdownClose();
  };

  const handleSettingsClick = () => {
    handleDropdownClose();
  };
  const { open, setOpen, setNotifications } = useNotification();

  const handleClick = async () => {
    setOpen(!open);

    // fetch only when opening
    if (!open) {
      const data = await fetchNotifications();
      setNotifications(data.list || []);
    }
  };
  const { data } = useNotificationCount();
  const count = data || 0;
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left Section - Mobile Menu & Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Icon name={isSidebarOpen ? "X" : "Menu"} size={20} />
            </Button>

            {/* Desktop Logo - Always visible on desktop */}
            <Link to='/dashboard'>
              <div className="hidden lg:flex items-center space-x-3">

                <div className="w-8 h-8 bg-mahroon-200 rounded-lg flex items-center justify-center">
                  {/* <Icon name="Zap" size={20} color="white" /> */}
                  <img src="/assets/images/aajneeti-favicon.png" alt="" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-foreground">
                    CRM
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-mahroon text-white rounded-full">
                    By Aajneeti Connect ltd.
                  </span>
                </div>

              </div>
            </Link>

            {/* Mobile Logo - Only visible on mobile */}
            <div className="flex items-center space-x-3 lg:hidden">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">
                  CRM
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-mahroon-200 text-accent-foreground rounded-full">
                  ACL
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative bg-gray-200"
                aria-label="Notifications"
                onClick={handleClick}
              >
                <Icon name="Bell" size={20} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                    {count}
                  </span>
                )}
              </Button>
              <NotificationDropdown />
            </div>
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={handleUserDropdownToggle}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-smooth"
                aria-label="User account menu"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    <Avatar name={LogInuser.username} size="32" round={true} />
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-foreground">
                    {LogInuser.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Aajneeti Connect ltd
                  </div>
                </div>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className={`transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isUserDropdownOpen && (
                <>
                  {/* Overlay */}
                  <div
                    className="fixed inset-0 z-40 backdrop-blur-[1px]"
                    onClick={handleDropdownClose}
                  />

                  {/* Dropdown Card */}
                  <div className="absolute right-0 mt-3 w-72 rounded-xl border border-neutral-200/70 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] z-50 overflow-hidden">

                    {/* Profile Section */}
                    <div className="px-5 py-4 border-b border-neutral-200/60">
                      <div className="flex items-center gap-3">

                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                          <span className="text-sm font-semibold text-white tracking-wide">
                            ACL
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="leading-tight">
                          <p className="text-sm font-semibold text-gray-900">
                            {LogInuser.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            Aajneeti Connect Ltd
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="py-2">

                      {/* Profile Button */}
                      <button
                        onClick={handleProfileClick}
                        className="group flex items-center w-full px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-100/70 transition-all duration-200"
                      >
                        <Icon
                          name="User"
                          size={16}
                          className="mr-3 text-gray-500 group-hover:text-indigo-600 transition"
                        />
                        <span className="group-hover:translate-x-0.5 transition">
                          Profile Settings
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="my-2 border-t border-neutral-200/60" />

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="group flex items-center w-full px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <Icon
                          name="LogOut"
                          size={16}
                          className="mr-3 text-red-500 group-hover:scale-110 transition"
                        />
                        <span className="group-hover:translate-x-0.5 transition">
                          Sign Out
                        </span>
                      </button>

                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for mobile dropdowns.
          Lives OUTSIDE the <header> (which is z-40), so its z-index must stay
          BELOW 40 — otherwise it ties with the header in the root stacking
          context, paints on top of it (later-in-DOM wins), and intercepts
          clicks on the dropdown card. The header's inline overlay already
          handles outside-click-to-close; this one is just for the dim. */}
      {(isUserDropdownOpen || isHelpDropdownOpen) && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={handleDropdownClose}
        />
      )}
    </>
  );
};

export default Header;
