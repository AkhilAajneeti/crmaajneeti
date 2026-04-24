import React, { useState } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ChangePassword from "./components/changePassword";
import { useProfiles, useUserById, useUsers } from "hooks/useUsers";
import DealDrawer from "./components/DealDrawer";
import { updateprofile } from "services/user.service";

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const loginUserStr = localStorage.getItem("login_object");
  const loginUser = loginUserStr ? JSON.parse(loginUserStr) : null;
  const UserId = loginUser?.id;
  const [drawerMode, setDrawerMode] = useState("view");
  const { data: profiles, isLoading } = useProfiles();
  const profilesData = profiles?.list || [];
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };
  const formatDate = (date) => {
    if (!date) return "—"; // null / undefined / empty

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "—"; // invalid date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })?.format(new Date(date));
  };

  const onDealClick = (deal) => {
    setSelectedId(deal);   // ✅ pass full object
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };
  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="User" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Profile & Details</h1>
                <p className="text-muted-foreground">Update personal preferences</p>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>

                    <th className="text-left px-4 py-3">
                      <button

                        className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                      >
                        <span>Name</span>

                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button

                        className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                      >
                        <span>Department</span>

                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button

                        className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                      >
                        <span>Email</span>

                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button

                        className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                      >
                        <span>Emp code</span>
                      </button>
                    </th>

                    <th className="text-left px-4 py-3">
                      <button

                        className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                      >
                        <span>Modified At</span>

                      </button>
                    </th>

                    {/* <th className="w-24 px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        Actions
                      </span>
                    </th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">

                  {profilesData?.map((deal) => (
                    <tr
                      key={deal?.id}
                      onMouseEnter={() => setHoveredRow(deal?.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="hover:bg-muted/30 cursor-pointer transition-smooth"
                    >

                      <td className="px-4 py-4" onClick={() => onDealClick(deal)}>
                        <div className="font-medium text-foreground">
                          {deal?.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">
                          {deal?.department}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">
                          {deal?.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className={`flex justify-start items-center space-x-2 py-1 font-medium rounded-full`}
                        >
                          <span className={`text-sm text-foreg roundunded-full `}>
                            {deal?.empCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-1 py-1 text-xs font-medium rounded-full`}
                        >
                          {formatDate(deal?.modifiedAt)}
                        </span>
                      </td>
                     
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

          </div>

          <DealDrawer
            deal={selectedId}
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            mode={drawerMode}
            onUpdate={(id, data) => updateprofile(id, data)}
          />
        </div>
      </main>
    </div>
  );
};

export default Profile;
