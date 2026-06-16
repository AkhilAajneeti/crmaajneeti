import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

const DealsTable = ({
  deals,
  selectedDeals,
  onSelectDeal,
  onSelectAll,
  onDealClick,
  sortConfig,
  onSort,

  onDelete,
  isLoading,
  canEdit = true,
  canDelete = true,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  // plain date — used for "Created At" (no status coloring)
  const formatDate = (value) => {
    if (!value) return "—";

    const parsed = new Date(value.replace(" ", "T"));
    if (isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // next-contact date with status color:
  // 🔴 red = past (missed), 🟡 amber = today, 🟢 green = future
  const formatNextContact = (value) => {
    if (!value) {
      return {
        text: "—",
        color: "text-gray-500",
        bg: "bg-gray-100",
      };
    }

    const safe = value.replace(" ", "T");
    const date = new Date(safe);

    if (isNaN(date.getTime())) {
      return {
        text: "—",
        color: "text-gray-500",
        bg: "bg-gray-100",
      };
    }

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const target = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffDays = Math.round(
      (target - today) / (1000 * 60 * 60 * 24)
    );

    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 🔴 OVERDUE
    if (diffDays < 0) {
      return {
        text:
          diffDays === -1
            ? `Yesterday ${time}`
            : `${Math.abs(diffDays)} days overdue`,
        color: "text-red-600",
        bg: "bg-red-100",
      };
    }

    // 🟡 TODAY
    if (diffDays === 0) {
      return {
        text: `Today ${time}`,
        color: "text-green-500",
        bg: "bg-amber-100",
      };
    }

    // 🟢 TOMORROW
    if (diffDays === 1) {
      return {
        text: `Tomorrow ${time}`,
        color: "text-blue-600",
        bg: "bg-green-100",
      };
    }

    // 🟢 UPCOMING
    if (diffDays <= 7) {
      return {
        text: `In ${diffDays} days`,
        color: "text-green-700",
        bg: "bg-green-100",
      };
    }

    // 🟢 FUTURE (more than a week away)
    return {
      text: date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      color: "text-green-700",
      bg: "bg-green-100",
    };
  };

  const NextContactCell = ({ value }) => {
    const { text, color, bg } = formatNextContact(value);
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${color}`}
      >
        {text}
      </span>
    );
  };

  // Status → color. Keys are lowercased and the lookup normalizes the input,
  // so "Follow Up" / "follow up" / "FOLLOW UP" all hit the same entry.
  // Covers every status in the project's statusOptions list.
  const STATUS_COLORS = {
    // ─── Positive / forward motion ────────────────────────────────
    "new": "bg-blue-100 text-blue-800",
    "interested": "bg-sky-100 text-sky-800",
    "qualified": "bg-emerald-100 text-emerald-800",
    "converted": "bg-green-100 text-green-800",
    "follow up": "bg-indigo-100 text-indigo-800",
    "in process": "bg-violet-100 text-violet-800",
    "proposal shared": "bg-cyan-100 text-cyan-800",
    "future prospect": "bg-teal-100 text-teal-800",
    "webinar": "bg-fuchsia-100 text-fuchsia-800",

    // ─── Pending / waiting ────────────────────────────────────────
    "call later": "bg-amber-100 text-amber-800",
    "call not connecting": "bg-yellow-100 text-yellow-800",
    "call not picked": "bg-rose-100 text-rose-800",

    // ─── Negative / blocked ───────────────────────────────────────
    "not interested": "bg-orange-100 text-orange-800",
    "low budget | low intent": "bg-purple-100 text-purple-800",
    "dead": "bg-red-100 text-red-800",

    // ─── Archived / discarded ─────────────────────────────────────
    "invalid": "bg-gray-100 text-gray-700",
    "duplicate": "bg-slate-100 text-slate-700",
    "z old leads": "bg-stone-100 text-stone-700",

    // Legacy fallbacks (older records that used these labels)
    "broker": "bg-purple-100 text-purple-800",
  };

  const getStageColor = (stage) => {
    if (!stage) return "bg-gray-100 text-gray-800";
    return (
      STATUS_COLORS[String(stage).trim().toLowerCase()] ||
      "bg-gray-100 text-gray-800"
    );
  };

  // Source → color. Same case-insensitive lookup pattern as STATUS_COLORS.
  // Each source uses a tone distinct from the statuses (and from each other)
  // so source pills don't look like dim copies of status pills.
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
  const getStageGradient = (stage) => {
    const gradients = {
      // ─── Positive / forward motion ────────────────────────────────
      "new": "bg-gradient-to-br from-blue-50/70 to-background border-blue-100",
      "interested":
        "bg-gradient-to-br from-sky-50/70 to-background border-sky-100",
      "qualified":
        "bg-gradient-to-br from-emerald-50/70 to-background border-emerald-100",
      "converted":
        "bg-gradient-to-br from-green-50/70 to-background border-green-100",
      "follow up":
        "bg-gradient-to-br from-indigo-50/70 to-background border-indigo-100",
      "in process":
        "bg-gradient-to-br from-violet-50/70 to-background border-violet-100",
      "proposal shared":
        "bg-gradient-to-br from-cyan-50/70 to-background border-cyan-100",
      "future prospect":
        "bg-gradient-to-br from-teal-50/70 to-background border-teal-100",
      "webinar":
        "bg-gradient-to-br from-fuchsia-50/70 to-background border-fuchsia-100",

      // ─── Pending / waiting ────────────────────────────────────────
      "call later":
        "bg-gradient-to-br from-amber-50/70 to-background border-amber-100",
      "call not connecting":
        "bg-gradient-to-br from-yellow-50/70 to-background border-yellow-100",
      "call not picked":
        "bg-gradient-to-br from-rose-50/70 to-background border-rose-100",

      // ─── Negative / blocked ───────────────────────────────────────
      "not interested":
        "bg-gradient-to-br from-orange-50/70 to-background border-orange-100",
      "low budget | low intent":
        "bg-gradient-to-br from-purple-50/70 to-background border-purple-100",
      "dead":
        "bg-gradient-to-br from-red-50/70 to-background border-red-100",

      // ─── Archived / discarded ─────────────────────────────────────
      "invalid":
        "bg-gradient-to-br from-gray-100/70 to-background border-gray-200",
      "duplicate":
        "bg-gradient-to-br from-slate-100/70 to-background border-slate-200",
      "z old leads":
        "bg-gradient-to-br from-stone-100/70 to-background border-stone-200",

      // Legacy fallback
      "broker":
        "bg-gradient-to-br from-purple-50/70 to-background border-purple-100",
    };

    return (
      gradients?.[stage?.toLowerCase()] ||
      "bg-gradient-to-br from-background to-muted/20 border-border/50"
    );
  };

  const handleQuickAction = (e, action, deal) => {
    e?.stopPropagation();
    onDealClick(deal);
    // console.log(`${action} action for deal:`, deal?.id);
  };
  const handleDelete = async (e, deal) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete lead ${deal?.name}?`);
    if (!ok) return;

    await onDelete(deal.id); // 👈 parent ko bol rahe ho
  };


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
                  onClick={() => onSort("cSector")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Sector</span>
                  {getSortIcon("cSector")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("source")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Source</span>
                  {getSortIcon("source")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("status")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Status</span>
                  {getSortIcon("status")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("cNextContact")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Next Contact</span>
                  {getSortIcon("cNextContact")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("createdAt")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Create At</span>
                  {getSortIcon("createdAt")}
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
                  className="hover:bg-muted/30 cursor-pointer transition-smooth"
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
                    <div className="font-medium text-foreground capitalize">
                      {deal?.name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-foreground">{deal?.cSector}</div>
                  </td>
                  <td className="px-4 py-4">
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
                    <NextContactCell value={deal?.cNextContact} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground">
                      {formatDate(deal?.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`text-sm font-medium ${getProbabilityColor(
                        deal?.assignedUserName,
                      )}`}
                    >
                      {deal?.assignedUserName}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`flex items-center space-x-1 transition-opacity ${hoveredRow === deal?.id ? "opacity-100" : "opacity-0"
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
                      {/* whats app button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();

                          const message = `Hello *${deal?.name || "Customer"}*,

Thank you for contacting us for your lead generation requirements.

I'm *${deal?.assignedUserName || "Team Member"}* from *AAJneeti Advertising*.
z
Let me know when you're available so that we can discuss this in more detail.

*aajneeti.social*`;

                          const whatsappUrl = `https://api.whatsapp.com/send/?phone=${deal?.phoneNumber
                            }&text=${encodeURIComponent(message)}`;

                          window.open(whatsappUrl, "_blank");
                        }}
                        className="h-8 w-8 rounded-full hover:bg-green-100 transition-all duration-200"
                      >
                        <img
                          src="/assets/whatsapp-logo.png"
                          alt="WhatsApp"
                          className="w-5 h-5 object-contain"
                        />
                      </Button>

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
    ${getStageGradient(deal?.status)}
    hover:shadow-md
    active:scale-[0.99]
    transition-all duration-200
  `}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left Section */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
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
                          deal?.status
                        )}`}
                      >
                        {deal?.status}
                      </span>
                    </div>

                    {/* Bottom */}
                    <div className="flex items-end justify-between mt-3 gap-3">
                      <div className="space-y-1 min-w-0">
                        {/* Assigned */}
                        {deal?.assignedUserName && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon name="User2" size={12} />
                            <span className="truncate">
                              {deal?.assignedUserName}
                            </span>
                          </div>
                        )}
                        {/* project */}
                        {deal?.cProject && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon name="Building2" size={12} />
                            <span className="truncate">
                              {deal?.cProject}
                            </span>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon name="Calendar" size={12} />
                          <span>{formatDate(deal?.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Call — opens the device dialer via tel: */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Call lead"
                          onClick={(e) => {
                            e.stopPropagation();
                            const phone = deal?.phoneNumber?.replace(/\D/g, "");
                            if (!phone) return;
                            window.location.href = `tel:${phone}`;
                          }}
                          className="h-10 w-10 rounded-full hover:bg-blue-400   active:scale-95 transition-all duration-150 flex items-center justify-center"
                        >
                          <Icon name="PhoneCall" size={20} className="text-blue-600 hover:text-white" />
                        </Button>

                        {/* WhatsApp — brand green, white logo via invert */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Open WhatsApp chat"
                          onClick={(e) => {
                            e.stopPropagation();
                            const phone = deal?.phoneNumber?.replace(/\D/g, "");
                            if (!phone) return;
                            window.open(
                              `https://api.whatsapp.com/send/?phone=${phone}`,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                          className="h-10 w-10 rounded-full  hover:bg-[#1fb85557]  active:scale-95 transition-all duration-150 flex items-center justify-center"
                        >
                          <img
                            src="/assets/whatsapp-logo.png"
                            alt=""
                            className="w-8 h-8 object-contain  "
                          />
                        </Button>
                      </div>
                    </div>
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
