import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import CompanyTab from "./components/CompanyTab";
import TeamsTab from "./components/TeamsTab";
import PipelineTab from "./components/PipelineTab";
import UserTab from "./components/UserTab";

// EspoCRM entity name → which Settings tab to activate
const ENTITY_TO_TAB = {
  User: "user",
  Team: "team",
};

const Settings = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params:
  // /User/<action>/<id?>   → User tab, deep-link target = {action, id}
  // /Team/<action>/<id?>   → Team tab, deep-link target = {action, id}
  // /settings              → tabs visible normally, no deep-link target
  const { entity: urlEntity, action: urlAction, id: urlId } = useParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    ENTITY_TO_TAB[urlEntity] || "user"
  );
  const [isLoading, setIsLoading] = useState(true);

  // Keep the active tab in sync if the URL entity changes (e.g. user
  // navigates from /User/... to /Team/... without unmounting Settings).
  useEffect(() => {
    const tab = ENTITY_TO_TAB[urlEntity];
    if (tab) setActiveTab(tab);
  }, [urlEntity]);

  // Manual tab switch → clear any deep-link URL so the modal doesn't reopen.
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (urlEntity) navigate("/settings", { replace: true });
  };

  // Deep-link target per entity (only set when the URL actually targets that tab).
  const userDeepLink =
    urlEntity === "User" ? { action: urlAction, id: urlId } : null;
  const teamDeepLink =
    urlEntity === "Team" ? { action: urlAction, id: urlId } : null;
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const tabs = [

    {
      id: "user",
      label: "Users & Roles",
      icon: "Users",
      description: "Manage users and permissions",
    },
    {
      id: "team",
      label: "Teams & Roles",
      icon: "Users",
      description: "Create and manage custom fields",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      // case "company":
      // return <CompanyTab />;
      case "user":
        return <UserTab deepLink={userDeepLink} />;
      case "team":
        return <TeamsTab deepLink={teamDeepLink} />;
      case "pipeline":
        return <PipelineTab />;
      default:
        return <CompanyTab />;
    }
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
                <Icon name="Settings" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tricolor-heading">
                  Settings
                </h1>
                <p className="text-muted-foreground">
                  Configure your CRM system and preferences
                </p>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Desktop Tabs */}
            <div className="hidden lg:block border-b border-border">
              <nav className="flex space-x-8 px-6">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => handleTabChange(tab?.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-smooth
                      ${activeTab === tab?.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                      }
                    `}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile Tab Selector */}
            <div className="lg:hidden border-b border-border p-4">
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => handleTabChange(e?.target?.value)}
                  className="w-full appearance-none bg-background border border-border rounded-lg px-4 py-3 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {tabs?.map((tab) => (
                    <option key={tab?.id} value={tab?.id}>
                      {tab?.label} - {tab?.description}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Icon
                    name="ChevronDown"
                    size={20}
                    className="text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 lg:p-8">
              {/* Tab Description - Desktop Only */}

              {/* Render Active Tab Content */}
              {renderTabContent()}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Settings;
