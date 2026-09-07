import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "NotificationContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEntityConfig } from "routes/entityRoutes";
import Button from "./ui/Button";

const PAGE_SIZE = 5;

// What happened — read from `noteData.type`, not the outer `type` (which is
// almost always just "Note").
const NOTE_VERBS = {
  Create: "created",
  CreateRelated: "created",
  Assign: "assigned",
  Update: "updated",
  Status: "changed the status of",
  Post: "posted on",
  EmailReceived: "received an email on",
  EmailSent: "sent an email on",
  Relate: "linked",
  MentionInPost: "mentioned you in",
};

// Entity type → the words a person would actually use.
const ENTITY_LABELS = {
  CAttendanceRequest: "attendance request",
  CWorkplaceNotes: "workplace note",
  CProfileDetails: "profile",
  KnowledgeBaseArticle: "knowledge base article",
  KnowledgeBaseCategory: "knowledge base category",
  Case: "complaint",
  Lead: "lead",
  Task: "task",
  Meeting: "meeting",
  Call: "call",
  Account: "account",
  Contact: "contact",
  Opportunity: "opportunity",
  Document: "document",
  TargetList: "target list",
  User: "user",
};

// Small coloured badge per entity so the kind is scannable at a glance.
const ENTITY_BADGES = {
  CAttendanceRequest: { icon: "📋", tone: "bg-amber-50 text-amber-700" },
  CWorkplaceNotes: { icon: "📝", tone: "bg-violet-50 text-violet-700" },
  KnowledgeBaseArticle: { icon: "📚", tone: "bg-sky-50 text-sky-700" },
  Case: { icon: "🎫", tone: "bg-rose-50 text-rose-700" },
  Lead: { icon: "👤", tone: "bg-blue-50 text-blue-700" },
  Task: { icon: "✅", tone: "bg-emerald-50 text-emerald-700" },
  Meeting: { icon: "📅", tone: "bg-indigo-50 text-indigo-700" },
  Account: { icon: "🏢", tone: "bg-slate-100 text-slate-700" },
  Contact: { icon: "📇", tone: "bg-teal-50 text-teal-700" },
  Opportunity: { icon: "💼", tone: "bg-purple-50 text-purple-700" },
};

// "CAttendanceRequest" → "attendance request" for anything not mapped above.
const formatEntityName = (type) =>
  type
    ? type
        .replace(/^C(?=[A-Z])/, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase()
    : "record";

// "assignedUser" → "Assigned User"
const formatFieldName = (field) =>
  String(field || "")
    .replace(/Id$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "object") return "—";
  return String(value);
};

// Field-level changes, so a status flip reads "Status  Pending → Approved"
// exactly like the old CRM did.
//   Update note → data.fields + data.attributes.was / .became
//   Status note → data.field + data.value (no previous value is sent)
const getChanges = (note) => {
  const data = note?.data || {};

  if (Array.isArray(data.fields) && data.attributes) {
    return data.fields
      .filter((field) => !/Id$/.test(field))
      .map((field) => ({
        field: formatFieldName(field),
        from: displayValue(data.attributes.was?.[field]),
        to: displayValue(data.attributes.became?.[field]),
      }));
  }

  if (note?.type === "Status" && data.field) {
    return [
      {
        field: formatFieldName(data.field),
        from: null,
        to: displayValue(data.value),
      },
    ];
  }

  return [];
};

const NotificationDropdown = () => {
  const audioRef = useRef(null);
  const prevCountRef = useRef(0);
  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { open, notifications, setNotifications, setOpen } = useNotification();
  const navigate = useNavigate();

  // Used to decide between "assigned to you" and "assigned to <name>".
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("login_object"))?.id || null;
    } catch {
      return null;
    }
  })();
  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      audioRef.current?.play();
    }
    prevCountRef.current = notifications.length;
  }, [notifications]);

  // Close on outside click — listener attaches only while open, removes on cleanup.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  const parseNotification = (n) => {
    const note = n.noteData || {};

    const entityType = note.parentType || n.relatedParentType || "";

    // The actor is the person who did the thing (noteData.createdByName).
    // `n.userName` is the *recipient* — i.e. the logged-in user — so using it
    // here made every row read "You performed an action".
    const actor = note.createdByName || n.userName || "Someone";

    // `noteData.type` is what actually happened; `n.type` is almost always
    // just "Note" and tells us nothing on its own.
    const action = NOTE_VERBS[note.type] || NOTE_VERBS[n.type] || "updated";

    const assignedUserId = note.data?.assignedUserId;
    const assignedUserName = note.data?.assignedUserName;

    // "assigned to you" when the record landed on the current user, otherwise
    // name the person — this is the detail the old CRM showed.
    let assignedTo = "";
    if (assignedUserId) {
      assignedTo =
        assignedUserId === currentUserId ? "you" : assignedUserName || "";
    }

    return {
      id: n.id,
      actor,
      action,
      entity: entityType,
      entityLabel: ENTITY_LABELS[entityType] || formatEntityName(entityType),
      title: note.parentName || n.data?.entityName || "",
      assignedTo,
      // An "Assign" note already says "assigned", so the tail is just "to X" —
      // otherwise it reads "assigned lead X assigned to Y".
      assignedPrefix: note.type === "Assign" ? "to" : "assigned to",
      // Target record for click-through. Only offered when the entity is in
      // the route registry, so a row never links somewhere that 404s.
      entityId: note.parentId || n.relatedParentId || "",
      canOpen: Boolean(
        (note.parentId || n.relatedParentId) && getEntityConfig(entityType),
      ),
      changes: getChanges(note),
      post: note.post || "",
      message: n.message || "",
      groupedCount: n.groupedCount || 0,
      time: n.createdAt,
      read: n.read,
    };
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;

    return d.toLocaleDateString();
  };
  // notification filter
  const filterNotification =
    activeTab == "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  // pagination
  const totalItems = filterNotification.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  // Clamp current page to valid range (in case the filtered list shrinks).
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filterNotification.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleMarkAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Open the record the notification is about: /<EntityType>/view/<id>, which
  // the entity router resolves to the right page with its drawer in view mode.
  const handleOpen = (item) => {
    if (!item.canOpen) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
    );
    setOpen(false);
    navigate(`/${item.entity}/view/${item.entityId}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="absolute right-0 mt-2 w-96 bg-white shadow-2xl rounded-2xl z-50 border overflow-hidden"
        >
          <audio ref={audioRef} src="/notification.mp3" preload="auto" />
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-800">Notifications</h3>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  setActiveTab("all");
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-full ${activeTab === "all" ? "bg-gray-100" : "text-gray-500"}`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setActiveTab("unread");
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-full ${activeTab === "unread" ? "bg-gray-100" : "text-gray-500"}`}
              >
                Unread
              </button>
              <button
                onClick={handleMarkAll}
                disabled={notifications.every((n) => n.read)}
                className="px-2 py-1 rounded-full text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                Mark all
              </button>
            </div>
          </div>
          {/* Body */}
          <div className="max-h-96 overflow-y-auto">
            {filterNotification.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-gray-500">
                  {activeTab === "unread"
                    ? "You're all caught up 🎉"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              pageItems.map((n) => {
                const item = parseNotification(n);
                const isUnread = !item.read;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    role={item.canOpen ? "button" : undefined}
                    tabIndex={item.canOpen ? 0 : undefined}
                    onClick={() => handleOpen(item)}
                    onKeyDown={(e) => {
                      if (item.canOpen && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleOpen(item);
                      }
                    }}
                    className={`group flex gap-3 px-4 py-3 border-b ${
                      item.canOpen
                        ? "cursor-pointer hover:bg-gray-50"
                        : "cursor-default"
                    } ${isUnread ? "bg-gray-50" : ""}`}
                  >
                    {/* Avatar — the person who acted */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {item.actor?.[0]?.toUpperCase()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* One readable sentence:
                          "Sushil Kumar Singh created attendance request
                           Woke up late this morning assigned to you" */}
                      <p className="text-sm leading-5 text-gray-700">
                        <span className="font-semibold text-gray-900">
                          {item.actor}
                        </span>{" "}
                        {item.action}
                        {item.entityLabel ? ` ${item.entityLabel}` : ""}{" "}
                        {item.title && (
                          <span className="font-semibold text-gray-900">
                            {item.title}
                          </span>
                        )}
                        {item.assignedTo && (
                          <>
                            {" "}
                            {item.assignedPrefix}{" "}
                            <span className="font-medium text-gray-900">
                              {item.assignedTo}
                            </span>
                          </>
                        )}
                      </p>

                      {/* Field changes: "Status  Pending → Approved" */}
                      {item.changes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.changes.map((change) => (
                            <div
                              key={change.field}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="text-gray-500 shrink-0">
                                {change.field}
                              </span>
                              {change.from && (
                                <>
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 line-through decoration-gray-400">
                                    {change.from}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                </>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 font-medium text-emerald-700">
                                {change.to}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Post body / system message */}
                      {(item.post || item.message) && (
                        <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                          {item.post || item.message}
                        </p>
                      )}

                      {/* Entity badge + time */}
                      <div className="mt-1.5 flex items-center gap-2">
                        {item.entity && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              ENTITY_BADGES[item.entity]?.tone ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <span>{ENTITY_BADGES[item.entity]?.icon || "🔔"}</span>
                            {item.entityLabel}
                          </span>
                        )}
                        {item.groupedCount > 1 && (
                          <span className="text-[11px] text-gray-500">
                            +{item.groupedCount - 1} more
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatTime(item.time)}
                        </span>
                        {item.canOpen && (
                          <span className="ml-auto text-[11px] font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                            Open →
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination footer — always shown when there are notifications */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-white text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="text-xs px-3"
              >
                ‹ Prev
              </Button>
              <span className="text-gray-600">
                Page <b className="text-gray-900">{safePage}</b> / {totalPages}
                <span className="text-gray-400"> · {totalItems} total</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
                className="text-xs px-3"
              >
                Next ›
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
