import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { deleteLead } from "services/leads.service";

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
  onSelectDeal,
  onSelectAll,
  onDealClick,
  sortConfig,
  onSort,
  currentPage,
  itemsPerPage,
  onDelete,
  isLoading,
  canEdit = true,
  canDelete = true,
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
      Planned: "bg-blue-100 text-blue-800",
      "Not Held": "bg-red-100 text-red-800",
      Held: "bg-green-100 text-green-800",
    };

    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };

  // Subtle card background/border tint per meeting status (mobile cards)
  const getStatusGradient = (status) => {
    const gradients = {
      Planned: "bg-gradient-to-br from-blue-50/70 to-background border-blue-100",
      Held: "bg-gradient-to-br from-green-50/70 to-background border-green-100",
      "Not Held":
        "bg-gradient-to-br from-red-50/70 to-background border-red-100",
    };

    return (
      gradients?.[status] ||
      "bg-gradient-to-br from-background to-muted/20 border-border/50"
    );
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-yellow-600";
    if (probability >= 40) return "text-orange-600";
    return "text-red-600";
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

  const paginatedDeals =deals;

  const isAllSelected =
    selectedDeals?.length === paginatedDeals?.length &&
    paginatedDeals?.length > 0;
  const isIndeterminate =
    selectedDeals?.length > 0 && selectedDeals?.length < paginatedDeals?.length;
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
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                />
              </th>
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
                  <span>Parent</span>
                  {getSortIcon("Project Name")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("Status")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Status</span>
                  {getSortIcon("owner")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("createdAt")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Start Date</span>
                  {getSortIcon("closeDate")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  Assigned User
                </span>
              </th>
              <th className="w-24 px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !paginatedDeals?.length ? (
              <tr>
                <td colSpan="8">
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
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedDeals?.includes(deal?.id)}
                      onChange={(e) => {
                        e?.stopPropagation();
                        onSelectDeal(deal?.id, e?.target?.checked);
                      }}
                    />
                  </td>
                  <td className="px-4 py-4" onClick={() => onDealClick(deal)}>
                    <div className="font-medium text-foreground truncate max-w-[400px]">
                      {deal?.name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-foreground">{deal?.parentName}</div>
                  </td>
                  {/* <td className="px-4 py-4">
                  <div className="font-medium text-foreground">
                    {deal?.source}
                  </div>
                </td> */}
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
                  {/* <td className="px-4 py-4">
                  <span
                    className={`inline-flex px-1 py-1 text-xs font-medium rounded-full`}
                  >
                    {formatDate(deal?.cNextContact)}
                  </span>
                </td> */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground">
                      {formatDate(deal?.dateStart)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <UserPill name={deal?.assignedUserName} />
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`flex items-center space-x-1 transition-opacity ${
                        hoveredRow === deal?.id ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleQuickAction(e, "edit", deal)}
                          className="h-8 w-8"
                        >
                          <Icon name="Edit" size={14} />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(e, deal)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      )}
                    </div>
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
                    onSelectDeal(deal?.id, e.target.checked);
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
