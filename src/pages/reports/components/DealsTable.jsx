import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";

import { Checkbox } from "../../../components/ui/Checkbox";

// Initials from a person's name: "Dheeraj Kohli" -> "DK"
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter((p) => /[a-z0-9]/i.test(p));
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "?";
};

// Deterministic avatar color so the same person always gets the same tone.
const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-pink-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
];

const getAvatarColor = (name) => {
  if (!name) return "bg-gray-400";
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

// Avatar + name pill (used for person fields like "Assigned User").
const UserPill = ({ name }) => {
  if (!name) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <span
      title={name}
      className="inline-flex items-center gap-2 pl-1 pr-3 py-1 max-w-[180px] rounded-full border border-border bg-background shadow-sm"
    >
      <span
        className={`flex items-center justify-center shrink-0 h-7 w-7 rounded-full text-[11px] font-semibold text-white ${getAvatarColor(
          name
        )}`}
      >
        {getInitials(name)}
      </span>
      <span className="text-sm font-medium text-foreground truncate min-w-0">
        {name}
      </span>
    </span>
  );
};


const DealsTable = ({
  deals,
  selectedDeals,
  onSelectAll,
  onSelectDeal,
  onDealClick,
  sortConfig,
  onSort,
  currentPage,
  itemsPerPage,
  isLoading,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

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

  const getStageColor = (stage) => {
    const colors = {
      New: "bg-blue-100 text-blue-800",
      Interested: "bg-sky-100 text-sky-800",
      "Follow up": "bg-indigo-100 text-indigo-800",
      Converted: "bg-green-100 text-green-800",
      "Not interested": "bg-orange-100 text-orange-800",
      Broker: "bg-purple-100 text-purple-800",
      "Call Not Picked": "bg-red-100 text-red-800",
      Invalid: "bg-gray-100 text-gray-700",
    };

    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };

  // Subtle card background/border tint per lead status (mobile cards)
  const getStatusGradient = (status) => {
    const gradients = {
      New: "bg-gradient-to-br from-blue-50/70 to-background border-blue-100",
      Interested: "bg-gradient-to-br from-sky-50/70 to-background border-sky-100",
      "Follow up":
        "bg-gradient-to-br from-indigo-50/70 to-background border-indigo-100",
      Converted:
        "bg-gradient-to-br from-green-50/70 to-background border-green-100",
      "Not interested":
        "bg-gradient-to-br from-orange-50/70 to-background border-orange-100",
      Broker:
        "bg-gradient-to-br from-purple-50/70 to-background border-purple-100",
      "Call Not Picked":
        "bg-gradient-to-br from-red-50/70 to-background border-red-100",
      Invalid: "bg-gradient-to-br from-gray-50/70 to-background border-gray-200",
    };

    return (
      gradients?.[status] ||
      "bg-gradient-to-br from-background to-muted/20 border-border/50"
    );
  };

  const SOURCE_COLORS = {
    "call": "bg-sky-100 text-sky-800",
    "email": "bg-indigo-100 text-indigo-800",
    "existing customer": "bg-emerald-100 text-emerald-800",
    "partner": "bg-violet-100 text-violet-800",
    "public relations": "bg-amber-100 text-amber-800",
    "web site": "bg-orange-100 text-orange-800",
    "campaign": "bg-fuchsia-100 text-fuchsia-800",
    "facebook": "bg-blue-100 text-blue-800",
    "ivr": "bg-rose-100 text-rose-800",
    "other": "bg-slate-100 text-slate-700",
  };

  const getSourceColor = (source) => {
    if (!source) return "bg-gray-100 text-gray-700";
    return (
      SOURCE_COLORS[String(source).trim().toLowerCase()] ||
      "bg-gray-100 text-gray-700"
    );
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return (
        <Icon name="ArrowUpDown" size={16} className="text-muted-foreground" />
      );
    }
    return sortConfig?.direction === "asc" ? (
      <Icon name="ArrowUp" size={16} className="text-primary" />
    ) : (
      <Icon name="ArrowDown" size={16} className="text-primary" />
    );
  };

  const handleQuickAction = (e, action, deal) => {
    e?.stopPropagation();
    onDealClick(deal);
    console.log(`${action} action for deal:`, deal?.id);
  };
  const handleDelete = async (e, deal) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete lead ${deal?.name}?`);
    if (!ok) return;

    await onDelete(deal.id); // 👈 parent ko bol rahe ho
  };

  const paginatedDeals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return deals?.slice(startIndex, startIndex + itemsPerPage);
  }, [deals, currentPage, itemsPerPage]);

  const isAllSelected =
    selectedDeals?.length === paginatedDeals?.length &&
    paginatedDeals?.length > 0;
  const isIndeterminate =
    selectedDeals?.length > 0 && selectedDeals?.length < paginatedDeals?.length;
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-4">
        <div className="h-4 w-24 bg-gray-300/70 rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-32 bg-gray-300/60 rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-20 bg-gray-300/60 rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-16 bg-gray-300/60 rounded-full"></div>
      </td>
    </tr>
  );
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("name")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Name</span>
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("account")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Sector</span>
                  {getSortIcon("Sector")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("Source")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Source</span>
                  {getSortIcon("value")}
                </button>
              </th>
              <th className="d-flex justify-content-center px-4 py-3">
                <button
                  onClick={() => onSort("Status")}
                  className=" d-flex align-items-center justify-content-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Status</span>
                  {/* {getSortIcon("owner")} */}
                </button>
              </th>
              <th className="d-flex align-items-center justify-content-center  px-4 py-3">
                <button
                  onClick={() => onSort("assignUser")}
                  className="d-flex align-items-center justify-content-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Assigned User</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !paginatedDeals?.length ? (
              <tr>
                <td colSpan="4">
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No leads available
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDeals?.map((deal) => (
                <tr
                  key={deal?.id}
                  onMouseEnter={() => setHoveredRow(deal?.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="hover:bg-sky-50/60 cursor-pointer transition-colors duration-200"
                >
                  <td className="px-4 py-4" onClick={() => onDealClick(deal)}>
                    <div className="font-medium text-foreground capitalize">
                      {deal?.name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-foreground">{deal?.cSector}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">
                      {deal?.source ? (
                        <span
                          className={`inline-flex items-center px-2 py-1  font-medium rounded-full ${getSourceColor(
                            deal.source
                          )}`}
                        >
                          {deal.source}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`flex justify-center items-center space-x-2 px-2 py-1 font-medium rounded-full ${getStageColor(
                        deal?.status,
                      )}`}
                    >
                      <span className={`text-sm text-foreg roundunded-full `}>
                        {deal?.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <UserPill name={deal?.assignedUserName} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}

      <div className="md:hidden">
        {paginatedDeals?.map((deal) => (
          <div
            key={deal?.id}
            onClick={() => onDealClick(deal)}
            className={`
    mx-3 my-2 p-4 rounded-2xl border
    hover:shadow-md
    active:scale-[0.99]
    transition-all duration-200
    ${getStatusGradient(deal?.status)}
  `}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox — stop the click bubbling to the card (which opens the drawer) */}
              <span onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedDeals?.includes(deal?.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectDeal?.(deal?.id, e.target.checked);
                  }}
                  className="mt-1"
                />
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {deal?.name}
                  </h3>

                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${getStageColor(
                      deal?.status,
                    )}`}
                  >
                    {deal?.status}
                  </span>
                </div>

                {/* Project Name */}
                {deal?.cProjectName && (
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    {deal?.cProjectName}
                  </div>
                )}

                {/* Assigned User */}
                {deal?.assignedUserName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Icon name="User" size={12} />
                    Assigned to{" "}
                    <span className="truncate">{deal?.assignedUserName}</span>
                  </div>
                )}

                {/* Created At */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Icon name="Calendar" size={12} />
                  Created: {formatDate(deal?.createdAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsTable;
