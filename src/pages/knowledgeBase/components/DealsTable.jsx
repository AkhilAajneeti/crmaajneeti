import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

// Deterministic pill color for open-ended values (sector / category),
// so the same value always gets the same color.
const PILL_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

const getCategoryColor = (value) => {
  if (!value) return "bg-gray-100 text-gray-700";
  let sum = 0;
  for (let i = 0; i < value.length; i++) sum += value.charCodeAt(i);
  return PILL_COLORS[sum % PILL_COLORS.length];
};

const DealsTable = ({
  deals,
  selectedDeals,
  onSelectDeal,
  onSelectAll,
  onDealClick,
  sortConfig,
  onSort,
  page,
  setPage,
  onDelete,
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
      Draft: "bg-gray-100 text-gray-700",
      "In Review": "bg-orange-100 text-orange-800",
      Published: "bg-green-100 text-green-800",
      Archived: "bg-purple-100 text-purple-800",
    };

    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };

  // Subtle card background/border tint per article status (mobile cards)
  const getStatusGradient = (status) => {
    const gradients = {
      Draft: "bg-gradient-to-br from-gray-50/70 to-background border-gray-200",
      "In Review":
        "bg-gradient-to-br from-orange-50/70 to-background border-orange-100",
      Published:
        "bg-gradient-to-br from-green-50/70 to-background border-green-100",
      Archived:
        "bg-gradient-to-br from-purple-50/70 to-background border-purple-100",
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

  // const paginatedDeals = useMemo(() => {
  //   if (!deals?.length) return [];
  //   const startIndex = (page - 1) * setPage;
  //   return deals?.slice(startIndex, startIndex + setPage);
  // }, [deals, page, setPage]);
  const paginatedDeals = deals;
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
                  onClick={() => onSort("cProjectName")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Sector</span>
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
                  <span>Create At</span>
                  {getSortIcon("closeDate")}
                </button>
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
                <td colSpan="9">
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
                    <div className="font-medium text-foreground">
                      {deal?.name}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {deal?.type ? (
                      <span
                        title={deal?.type}
                        className={`inline-block max-w-[160px] truncate align-middle px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                          deal?.type
                        )}`}
                      >
                        {deal?.type}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
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
                    <div className="text-sm text-foreground">
                      {formatDate(deal?.createdAt)}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div
                      className={`flex items-center space-x-1 transition-opacity ${hoveredRow === deal?.id ? "opacity-100" : "opacity-0"
                        }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleQuickAction(e, "edit", deal)}
                        className="h-8 w-8"
                      >
                        <Icon name="Edit" size={14} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, deal)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
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
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : !paginatedDeals?.length ? (
          <tr>
            <td colSpan="6">
              <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                No leads available
              </div>
            </td>
          </tr>
        ) : (
          paginatedDeals?.map((deal) => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(DealsTable);
