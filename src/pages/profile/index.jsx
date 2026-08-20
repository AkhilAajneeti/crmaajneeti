import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ChangePassword from "./components/changePassword";
import { useProfiles, useUserById, useUsers } from "hooks/useUsers";
import DealDrawer from "./components/DealDrawer";
import { updateprofile } from "services/user.service";

const Profile = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params: /CProfileDetails/<action>/<id?>
  const { action: urlAction, id: urlId } = useParams();

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

  // Drawer state derived from URL — single source of truth.
  // /profile                          → drawer closed
  // /CProfileDetails/view/:id         → drawer open, view mode
  // /CProfileDetails/edit/:id         → drawer open, edit mode
  useEffect(() => {
    if (urlId) {
      setSelectedId((current) =>
        current?.id === urlId ? current : { id: urlId }
      );
      setDrawerMode(urlAction === "edit" ? "edit" : "view");
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
      setSelectedId(null);
    }
  }, [urlAction, urlId]);

  // Promote the {id} placeholder into the full record once the list resolves,
  // so the drawer header (which reads deal?.name) populates instantly.
  useEffect(() => {
    if (!urlId || !profilesData.length) return;
    const fullDeal = profilesData.find((d) => d.id === urlId);
    if (!fullDeal) return;
    setSelectedId((current) => {
      if (current?.id === urlId && !current.name) return fullDeal;
      return current;
    });
  }, [profilesData, urlId]);
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

  // Deterministic gradient avatar color from name — same person always gets
  // the same color across desktop + mobile, so it acts as a visual identifier.
  const AVATAR_GRADIENTS = [
    "from-violet-500 to-fuchsia-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
    "from-purple-500 to-indigo-600",
    "from-sky-500 to-blue-600",
  ];
  const avatarColor = (name) => {
    if (!name) return AVATAR_GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
  };

  const onDealClick = (deal) => {
    // Set the full record first so the drawer header has data immediately;
    // the URL effect sees the matching id and won't overwrite with a placeholder.
    setSelectedId(deal);
    navigate(`/CProfileDetails/view/${deal.id}`);
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse border-t border-border">
      {/* Checkbox */}
      <td className="p-4">
        <div className="h-4 w-4 bg-gray-300/60 rounded"></div>
      </td>

      {/* Company */}
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300/60 rounded-lg"></div>
          <div>
            <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
            <div className="h-3 w-32 bg-gray-300/50 rounded"></div>
          </div>
        </div>
      </td>

      {/* Industry */}
      <td className="p-4">
        <div className="h-4 w-20 bg-gray-300/60 rounded"></div>
      </td>

      {/* Type */}
      <td className="p-4">
        <div className="h-4 w-16 bg-gray-300/60 rounded"></div>
      </td>

      {/* status */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>
      {/* Next Contact */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>
      {/* Created At */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>
      {/* Assign User */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>

      {/* Actions */}
      <td className="p-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-300/60 rounded"></div>
          <div className="h-8 w-8 bg-gray-300/60 rounded"></div>
        </div>
      </td>
    </tr>
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">

          {/* Page Header — gradient card with decorative blobs */}
          <div className="mb-6 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 lg:p-7 shadow-sm">
            {/* Decorative blurred orbs (purely visual) */}
            <div
              aria-hidden
              className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 left-1/3 w-48 h-48 rounded-full bg-red-500/25 blur-3xl pointer-events-none"
            />

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-red-300 flex items-center justify-center shadow-lg shadow-primary/20">
                <Icon name="UsersRound" size={26} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                  Profile &amp; Details
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your team's profile data, departments, and contact info.
                </p>
              </div>
              <div className="hidden md:flex ml-auto items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-white/60 backdrop-blur-sm text-xs font-medium text-primary">
                <Icon name="Users" size={14} />
                {profilesData?.length || 0} member
                {profilesData?.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Settings Content — single card holding the desktop table AND
              the mobile cards as siblings. Cleaned up so loading / empty
              states work in both layouts and no <tr> lives outside a table. */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

            {/* ===== Desktop Table ===== */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary/5 via-muted/40 to-transparent border-b border-border">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Department
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Emp Code
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Modified At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : !profilesData?.length ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Icon name="UsersRound" size={24} className="text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">No profiles yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Team members will appear here once they're added.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    profilesData.map((deal) => (
                      <tr
                        key={deal?.id}
                        onMouseEnter={() => setHoveredRow(deal?.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => onDealClick(deal)}
                        className="hover:bg-indigo-50/30 cursor-pointer transition-colors "
                      >
                        {/* Name with gradient avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br ${avatarColor(deal?.name)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}
                            >
                              {(deal?.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate">
                                {deal?.name || "—"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-foreground">
                            {deal?.department || "—"}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4">
                          {deal?.email ? (
                            <a
                              href={`mailto:${deal.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-primary hover:underline break-all"
                            >
                              {deal.email}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Emp Code chip */}
                        <td className="px-5 py-4">
                          {deal?.empCode ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                              {deal.empCode}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Modified At */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                            <Icon name="Clock" size={12} />
                            {formatDate(deal?.modifiedAt)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== Mobile Cards — sibling of desktop table ===== */}
            <div className="md:hidden divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-start gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-gray-300/60 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-300/70 rounded" />
                      <div className="h-3 w-24 bg-gray-300/50 rounded" />
                      <div className="h-3 w-40 bg-gray-300/50 rounded" />
                    </div>
                  </div>
                ))
              ) : !profilesData?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Icon name="UsersRound" size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No profiles yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Team members will appear here once they're added.
                  </p>
                </div>
              ) : (
                profilesData.map((deal) => (
                  <button
                    type="button"
                    key={deal?.id}
                    onClick={() => onDealClick(deal)}
                    className="w-full text-left p-4 bg-gradient-to-br from-indigo-50/70 via-transparent to-background hover:from-primary/[0.04] hover:to-primary/[0.08] transition-colors border-indigo-200"
                  >
                    <div className="flex items-start gap-3 ">
                      <div
                        className={`w-11 h-11 flex-shrink-0 rounded-full bg-gradient-to-br ${avatarColor(deal?.name)} flex items-center justify-center text-white font-semibold shadow-md`}
                      >
                        {(deal?.name || "?").charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {deal?.name || "—"}
                          </h3>
                          {deal?.empCode && (
                            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                              {deal.empCode}
                            </span>
                          )}
                        </div>

                        {deal?.department && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                            <Icon name="Briefcase" size={11} className="flex-shrink-0" />
                            {deal.department}
                          </p>
                        )}

                        {deal?.email && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                            <Icon name="Mail" size={11} className="flex-shrink-0" />
                            <span className="truncate">{deal.email}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
                          <Icon name="Clock" size={11} />
                          Modified {formatDate(deal?.modifiedAt)}
                        </div>
                      </div>

                      <Icon
                        name="ChevronRight"
                        size={16}
                        className="text-muted-foreground/60 self-center flex-shrink-0"
                      />
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>

          <DealDrawer
            deal={selectedId}
            isOpen={isDrawerOpen}
            onClose={() => navigate("/profile", { replace: true })}
            mode={drawerMode}
            onUpdate={(id, data) => updateprofile(id, data)}
          />
        </div>
      </main>
    </div>
  );
};

export default Profile;
