import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { deleteLead } from "services/leads.service";
import { canDeleteRecord, canEditRecord } from "utils/permissions";

// Initials from a person's name: "Rani Muskan" -> "RM"
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

// Avatar + name pill (used for person fields like "Created By" / "Reporting
// Manager"). Text sits at the table's base size so it matches the plain cells.
const UserPill = ({ name }) => {
  if (!name) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      title={name}
      className="inline-flex items-center gap-2 pl-1 pr-3 py-1 max-w-[200px] rounded-full border border-border bg-background shadow-sm"
    >
      <span
        className={`flex items-center justify-center shrink-0 h-7 w-7 rounded-full text-xs font-semibold text-white ${getAvatarColor(
          name
        )}`}
      >
        {getInitials(name)}
      </span>
      <span className="font-medium text-foreground truncate min-w-0">
        {name}
      </span>
    </span>
  );
};

// "SLC" (Contribution Credit) and "Short Leave" carry their duration in
// `durationInMinutes`; the day-based types (Leave / Half Day) use
// `leaveConsumed` instead — same split the drawer's Duration tile uses.
const MINUTE_BASED_TYPES = ["SLC", "Short Leave"];

// 90 -> "1h 30m", 45 -> "45m", 120 -> "2h"
const formatMinutes = (minutes) => {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return null;

  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// 1 -> "1 day", 2.5 -> "2.5 days"
const formatDays = (days) => {
  const total = Number(days);
  if (!Number.isFinite(total) || total <= 0) return null;
  return `${total} ${total === 1 ? "day" : "days"}`;
};

// Readable duration for any request type; null when there's nothing to show.
const formatDuration = (deal) =>
  MINUTE_BASED_TYPES.includes(deal?.requestType)
    ? formatMinutes(deal?.durationInMinutes)
    : formatDays(deal?.leaveConsumed);

// Colored pill per leave request type.
const getRequestTypeColor = (type) => {
  switch (type) {
    case "Leave":
      return "bg-blue-100 text-blue-700";
    case "Half Day":
      return "bg-purple-100 text-purple-700";
    case "Short Leave":
      return "bg-amber-100 text-amber-700";
    case "SLC":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const DealsTable = ({
  deals,
  selectedDeals,
  onDealClick,
  onSelectDeal,
  onSelectAll,
  sortConfig,
  onSort,
  currentPage,
  itemsPerPage,
  isLoading,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const currentUserId = JSON.parse(localStorage.getItem("login_object"))?.id;

  const canEditDeal = (deal) =>
    canEditRecord("CAttendanceRequest", deal) &&
    deal?.assignedUserId === currentUserId;

  const canDeleteDeal = (deal) =>
    canDeleteRecord("CAttendanceRequest", deal) &&
    deal?.assignedUserId === currentUserId;
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
      Approved: "bg-green-100 text-green-900",
      Pending: "bg-sky-100 text-sky-800",
      Rejected: "bg-orange-100 text-orange-800",
      LWP: "bg-purple-100 text-purple-800",
    };

    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };

  // Subtle card background/border tint per attendance status (mobile cards)
  const getStatusGradient = (status) => {
    const gradients = {
      Approved:
        "bg-gradient-to-br from-green-50/70 to-background border-green-100",
      Pending: "bg-gradient-to-br from-sky-50/70 to-background border-sky-100",
      Rejected:
        "bg-gradient-to-br from-orange-50/70 to-background border-orange-100",
      LWP: "bg-gradient-to-br from-purple-50/70 to-background border-purple-100",
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

  // const canEditDeal = (deal) =>
  //   typeof canEdit === "function" ? canEdit(deal) : canEdit;

  // const canDeleteDeal = (deal) =>
  //   typeof canDelete === "function" ? canDelete(deal) : canDelete;

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

  // `deals` is already the current page from the server (maxSize + offset),
  // so render it as-is — slicing again would blank out every page past the first.
  const paginatedDeals = deals || [];

  // Drop the Duration column entirely when nothing on the page has one —
  // otherwise it renders as a column of dashes.
  const hasDuration = useMemo(
    () => paginatedDeals.some((deal) => formatDuration(deal)),
    [paginatedDeals]
  );

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
                  <span>Reason</span>
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("account")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Created By</span>
                  {getSortIcon("Project Name")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("Source")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Request Type</span>
                  {getSortIcon("value")}
                </button>
              </th>
              <th className="d-flex justify-content-center px-4 py-3">
                <button
                  onClick={() => onSort("Status")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Status</span>
                  {getSortIcon("owner")}
                </button>
              </th>
              {hasDuration && (
                <th className="d-flex justify-content-center px-4 py-3">
                  <button
                    onClick={() => onSort("Status")}
                    className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                  >
                    <span className="whitespace-nowrap">Duration</span>
                  </button>
                </th>
              )}
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("account")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Start Date</span>
                  {getSortIcon("Project Name")}
                </button>
              </th>
              <th className="d-flex justify-content-center px-4 py-3">
                <button
                  onClick={() => onSort("Status")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span className="whitespace-nowrap">Reporting Manager</span>
                </button>
              </th>
              {(canEdit || canDelete) && (
                <th className="text-left px-4 py-3">
                  <button className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth">
                    <span>Action</span>
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !paginatedDeals?.length ? (
              <tr>
                <td colSpan="5">
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No Attendance Request Available
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
                    <div className="font-medium text-foreground truncate max-w-[400px]">
                      {deal?.name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <UserPill name={deal?.createdByName} />
                  </td>
                  <td className="px-4 py-4">
                    {deal?.requestType ? (
                      <span
                        className={`inline-block px-3 py-1 font-medium rounded-full ${getRequestTypeColor(
                          deal?.requestType
                        )}`}
                      >
                        {deal?.requestType === "SLC"
                          ? "Contribution Credit"
                          : deal?.requestType}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`inline-flex justify-center items-center px-3 py-1 font-medium rounded-full ${getStageColor(
                        deal?.status,
                      )}`}
                    >
                      {deal?.status}
                    </div>
                  </td>
                  {hasDuration && (
                    <td className="px-4 py-4">
                      {formatDuration(deal) ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                          <Icon name="Clock" size={15} />
                          {formatDuration(deal)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-4">
                    <div className="text-foreground whitespace-nowrap">{formatDate(deal?.startDate)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <UserPill name={deal?.assignedUserName} />
                  </td>
                  {(canEditDeal(deal) || canDeleteDeal(deal)) ? (
                    <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        {canEditDeal(deal) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(deal);
                            }}
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                        )}
                        {canDeleteDeal(deal) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(deal);
                            }}>
                            <Icon name="Trash2" size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  ) : (
                    <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                      <div className="flex items-center space-x-1">

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDealClick(deal);
                          }}>
                          <Icon name="ArrowUpRight" size={20} />
                        </Button>
                      </div>
                    </td>
                  )}
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
