import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import Avatar from "react-avatar";

import { createLeadActivity, updateStream } from "services/leads.service";
import { useTeams } from "hooks/useTeams";
import { useUsers } from "hooks/useUsers";
import { useLeadStream } from "hooks/useLeadStream";
import { useLeadActivity } from "hooks/useLeadActivity";
import { useQueryClient } from "@tanstack/react-query";
import { canEdit, canEditRecord } from "utils/permissions";
import { LEAD_STATUS_OPTIONS, getStatusTheme } from "utils/leadStatus";

// Shared shape for the add/edit form, matching the AccountDrawer's card system:
// grouped sections on soft cards with an uppercase heading, fields on a
// two-column grid that collapses to one on narrow screens.
const FORM_CARD =
  "bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4";

const FORM_HEADING =
  "text-sm font-semibold text-muted-foreground uppercase tracking-wide";

const FIELD = "h-11 rounded-xl";

// Select renders its own trigger button, so size it through the wrapper rather
// than editing the shared component. `>div>button` hits only the trigger, not
// the option buttons in the dropdown.
const SELECT_FIELD = "[&>div>button]:h-11 [&>div>button]:rounded-xl";

const TEXTAREA =
  "w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition";

// Turn plain text into React nodes where any http(s) URL becomes a clickable
// link. Safe (no dangerouslySetInnerHTML) — splits on URLs and renders the rest
// as text, preserving newlines when used inside a `whitespace-pre-line` element.
const linkifyText = (text) => {
  if (!text) return "—";
  const parts = String(text).split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline break-words hover:text-primary/80"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};

// The `cQuestion` field arrives as a single string where each answer is wrapped
// in <b>…</b> tags, e.g.  "How long…? <b>less_than_1_year</b> Budget? <b>need_consultation</b>".
// Parse it into clean { question, answer } pairs so we can render readable Q&A.
const parseQuestionAnswers = (raw) => {
  if (!raw) return [];
  // Split on the bold tags, keeping the captured answer text between segments.
  const parts = String(raw).split(/<b>(.*?)<\/b>/gi);
  const pairs = [];
  for (let i = 0; i < parts.length; i += 2) {
    const question = (parts[i] || "").replace(/<\/?b>/gi, "").trim();
    const answer = (parts[i + 1] || "").trim();
    if (!question && !answer) continue;
    pairs.push({ question, answer });
  }
  return pairs;
};

// snake_case / machine values → human readable: "less_than_1_year" → "Less than 1 year"
const humanizeAnswer = (value) => {
  if (!value) return "";
  const text = value.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Renders the parsed Q&A as a readable list; falls back gracefully when the
// string has no <b> tags (just shows the raw text).
const QuestionAnswers = ({ raw }) => {
  const pairs = parseQuestionAnswers(raw);

  if (!raw) return <p className="text-foreground font-medium">None</p>;

  // No structured answers — show the plain text as-is.
  if (!pairs.some((p) => p.answer)) {
    return (
      <p className="text-foreground font-medium whitespace-pre-line">
        {String(raw).replace(/<\/?b>/gi, "")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-sm font-semibold text-primary">{i + 1}.</span>
          <div className="flex-1">
            {pair.question && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pair.question}
              </p>
            )}
            {pair.answer && (
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {humanizeAnswer(pair.answer)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};


// Coloured icon tiles for the inline-editable rows in the overview.
const INLINE_TONES = {
  violet: "bg-violet-50 text-violet-600 ring-violet-200/70",
  sky: "bg-sky-50 text-sky-600 ring-sky-200/70",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200/70",
  amber: "bg-amber-50 text-amber-600 ring-amber-200/70",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-200/70",
  teal: "bg-teal-50 text-teal-600 ring-teal-200/70",
  rose: "bg-rose-50 text-rose-600 ring-rose-200/70",
};

const PHONE_TYPE_OPTIONS = [
  { value: "Mobile", label: "Mobile" },
  { value: "Office", label: "Office" },
  { value: "Home", label: "Home" },
  { value: "Fax", label: "Fax" },
  { value: "Other", label: "Other" },
];

// EspoCRM keeps every number for a record in `phoneNumberData`; the scalar
// `phoneNumber` is only ever the primary one. Older records (and the leads
// list payload) may carry just the scalar, so seed from whichever exists.
const getPhoneRows = (record) => {
  const rows = Array.isArray(record?.phoneNumberData)
    ? record.phoneNumberData
    : [];

  if (rows.length) {
    return rows.map((row) => ({
      phoneNumber: row?.phoneNumber || "",
      type: row?.type || "Mobile",
      primary: !!row?.primary,
    }));
  }

  return [
    {
      phoneNumber: record?.phoneNumber || "+91",
      type: "Mobile",
      primary: true,
    },
  ];
};

// The tinted icon chip every overview row leads with.
const FieldIcon = ({ name, tone = "violet" }) => (
  <span
    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${INLINE_TONES[tone] || INLINE_TONES.violet}`}
  >
    <Icon name={name} size={18} />
  </span>
);

// Read-only counterpart of InlineEditRow — identical chrome, no editor.
const FieldRow = ({ icon, tone, label, children, className = "" }) => (
  <div className={`flex min-w-0 items-start gap-3 ${className}`}>
    <FieldIcon name={icon} tone={tone} />

    <div className="min-w-0 flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  </div>
);

// One row of the overview: coloured icon tile, label, current value and a
// pencil that swaps the value for the very same Input/Select controls the
// full Edit form uses — the editing mechanism is shared, not duplicated.
const InlineEditRow = ({
  icon,
  tone = "violet",
  label,
  children,
  editor,
  canEdit,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  className = "",
}) => (
  <div className={`flex min-w-0 items-start gap-3 ${className}`}>
    <FieldIcon name={icon} tone={tone} />

    <div className="min-w-0 flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>

      {isEditing ? (
        <div className="mt-2 space-y-3">
          {editor}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={onSave}
              disabled={isSaving}
            >
              <Icon
                name={isSaving ? "LoaderCircle" : "CheckCheck"}
                size={15}
                className={`mr-1.5 ${isSaving ? "animate-spin" : ""}`}
              />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-0.5 flex items-center gap-2">
          <div className="min-w-0">{children}</div>

          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${label}`}
              title={`Edit ${label}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Icon name="Pencil" size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

const DealDrawer = ({

  deal,
  isOpen,
  onClose,
  mode,
  onCreate,
  onUpdate,
  onDelete,
  leadsDetails,
  onBulkUpdate,
  selectedIds = [],
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showActivityForm, setActivityForm] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [postingActivity, setPostingActivity] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [editingActivityId, setEditingActivityId] = useState(null);
  // Which single field the view tab is currently editing inline, and which
  // one is mid-save (drives the spinner on that row's Save button).
  const [editingField, setEditingField] = useState(null);
  const [savingField, setSavingField] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "+91",
    emailAddress: "",
    whatsapp: "",
    addressCity: "",

    cNextContact: "",
    cQuestion: "",
    assignedUserId: "",
    teamId: "",
    status: "",
    source: "",
    description: "",
    cOTPVerified: "No",
  });
  const queryClient = useQueryClient();
  const { data: usersData } = useUsers();
  const { data: teamData } = useTeams();
  const { data: streamData } = useLeadStream(deal?.id, isOpen);
  const { data: activityData } = useLeadActivity(deal?.id, isOpen);

  const users = usersData?.list || [];
  const team = teamData?.list || [];
  const streams = streamData?.list || [];
  const activities = activityData?.list || [];
  useEffect(() => {
    if (mode === "add") {
      setFormData({
        firstName: "",
        lastName: "",
        phoneNumber: "+91",
        emailAddress: "",
        whatsapp: "",
        addressCity: "",

        cNextContact: "",
        cQuestion: "",
        assignedUserId: "",
        teamId: "",
        status: "New",
        source: "",
        description: "",
        cOTPVerified: "No",
      });
      setIsEditing(true); // form open
    } else if (deal && mode === "view") {
      setFormData(deal);
      setIsEditing(false);
    }
  }, [deal, mode]);
  const currentUserId = JSON.parse(localStorage.getItem("login_object"))?.id;

  const canEditDeal = (deal) =>
    canEditRecord("Lead", deal) &&
    deal?.assignedUserId === currentUserId;
  const [massFields, setMassFields] = useState({
    assignedUserId: false,
    status: false,
    source: false,
    teamId: false,
    cNextContact: false,
  });
  // Source
  const sourceOptions = [
    { value: "Call", label: "Call" },
    { value: "Email", label: "Email" },
    { value: "Existing Customer", label: "Existing Customer" },
    { value: "Partner", label: "Partner" },
    { value: "Public Relations", label: "Public Relations" },
    { value: "Web Site", label: "Web Site" },
    { value: "Campaign", label: "Campaign" },
    { value: "Other", label: "Other" },
    { value: "Facebook", label: "Facebook" }, // ✅ added
    { value: "IVR", label: "IVR" }            // ✅ added
  ];
  // Status
  const statusOptions = LEAD_STATUS_OPTIONS;

  const toggleMassField = (field) => {
    setMassFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleEditActivity = (activity) => {
    setEditingActivityId(activity.id);
    setActivityText(activity.post || "");
    setActivityForm(true);
  };
  const toggleActivity = (id) => {
    setExpandedActivityId((prev) => (prev === id ? null : id));
  };
  const showForm = mode === "add" || isEditing;
  const isMassUpdate = mode === "mass-update";

  const formatDate = (date) => {
    if (!date) return "—";

    const safeDate = date.replace(" ", "T"); // 👈 key fix
    const parsed = new Date(safeDate);

    if (isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const formatDateTime = (value) => {
    if (!value) return "—";

    const safe = value.replace(" ", "T"); // EspoCRM fix
    const date = new Date(safe);

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStageColor = (stage) => {
    const colors = {
      // ─── Positive / forward motion ────────────────────────────────
      "New": "bg-blue-100 text-blue-800",
      "Interested": "bg-sky-100 text-sky-800",
      "Qualified": "bg-emerald-100 text-emerald-800",
      "Converted": "bg-green-100 text-green-800",
      "Follow up": "bg-indigo-100 text-indigo-800",
      "In Process": "bg-violet-100 text-violet-800",
      "Proposal Shared": "bg-cyan-100 text-cyan-800",
      "Future Prospect": "bg-teal-100 text-teal-800",
      "Webinar": "bg-fuchsia-100 text-fuchsia-800",

      // ─── Pending / waiting ────────────────────────────────────────
      "Call Later": "bg-amber-100 text-amber-800",
      "Call Not Connecting": "bg-yellow-100 text-yellow-800",
      "Call Not Picked": "bg-rose-100 text-rose-800",

      // ─── Negative / blocked ───────────────────────────────────────
      "Not Interested": "bg-orange-100 text-orange-800",
      "Low budget | Low Intent": "bg-purple-100 text-purple-800",
      "Dead": "bg-red-100 text-red-800",

      // ─── Archived / discarded ─────────────────────────────────────
      "Invalid": "bg-gray-100 text-gray-700",
      "Duplicate": "bg-slate-100 text-slate-700",
      "z old leads": "bg-stone-100 text-stone-700",

      // Legacy fallbacks (older records that used these labels)
      "Broker": "bg-purple-100 text-purple-800",
    };
    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "LayoutList" },
    { id: "AssignedUsers", label: "Assigned User", icon: "UserCog" },
    { id: "Stream", label: "Feedback", icon: "MessageSquareText" },
    { id: "Activity", label: "Activity", icon: "History" },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "Post":
        return "MessageSquare";
      case "Update":
        return "RefreshCcw";
      case "Assign":
        return "UserPlus";
      case "Create":
        return "PlusCircle";
      default:
        return "Activity";
    }
  };

  const getActivityIconColor = (type) => {
    switch (type) {
      case "Post":
        return "text-indigo-600";
      case "Update":
        return "text-blue-600";
      case "Assign":
        return "text-purple-600";
      case "Create":
        return "text-green-600";
      default:
        return "text-gray-500";
    }
  };

  const getActivityMessage = (activity) => {
    const { type, post, data, createdByName } = activity;

    if (type === "Post") {
      // post can be a non-string (e.g. empty object {}) for some legacy stream
      // entries — coerce to string so it never crashes the <p> render.
      return typeof post === "string" ? post : "";
    }

    if (type === "Assign") {
      return `Assigned to ${data?.assignedUserName ?? ""}`;
    }

    if (type === "Create") {
      return "Lead was created";
    }

    if (type === "Update") {
      const value = data?.value;
      if (value != null && typeof value !== "object") {
        return `Status updated to ${value}`;
      }
      return "Lead updated";
    }
    if (activity._scope === "Call") {
      return `${activity.direction || "Call"} call scheduled`;
    }

    if (activity._scope === "Meeting") {
      return "Meeting scheduled";
    }

    return "Activity updated";
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ── Inline editing (view tab) ──────────────────────────────────────────────
  // Deliberately reuses formData + handleChange + onUpdate, so a field edited
  // inline goes through exactly the same path as the full Edit form.
  const startInlineEdit = (field) => {
    setFormData({
      ...leadData,
      phoneNumberData: getPhoneRows(leadData),
    });
    setEditingField(field);
  };

  const cancelInlineEdit = () => {
    setFormData(deal);
    setEditingField(null);
  };

  // Sends only the touched fields — a partial PUT, so an inline save can never
  // clobber a field the drawer happens to be holding a stale copy of.
  const saveInline = async (payload) => {
    if (!deal?.id) return;

    try {
      setSavingField(editingField);
      await onUpdate(deal.id, payload);

      // The page invalidates ["leads"], but the drawer renders the full record
      // from ["leadDetails", id] — refresh that too or it shows stale values.
      queryClient.invalidateQueries({ queryKey: ["leadDetails", deal.id] });
      setEditingField(null);
    } catch (error) {
      console.error("Inline update failed", error);
    } finally {
      setSavingField(null);
    }
  };

  const saveInlineName = () => {
    const firstName = (formData.firstName || "").trim();
    const lastName = (formData.lastName || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();

    // Same rule the full form enforces.
    if (!fullName) {
      toast.error("Name is required");
      return;
    }

    saveInline({ firstName, lastName, name: fullName });
  };

  const saveInlineStatus = () => {
    if (!formData.status) {
      toast.error("Status is required");
      return;
    }

    saveInline({ status: formData.status });
  };

  // ── Contact numbers (array) ────────────────────────────────────────────────
  const phoneRows = Array.isArray(formData.phoneNumberData)
    ? formData.phoneNumberData
    : [];

  const updatePhoneRow = (index, patch) =>
    setFormData((prev) => ({
      ...prev,
      phoneNumberData: (prev.phoneNumberData || []).map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }));

  const addPhoneRow = () =>
    setFormData((prev) => ({
      ...prev,
      phoneNumberData: [
        ...(prev.phoneNumberData || []),
        { phoneNumber: "+91", type: "Mobile", primary: false },
      ],
    }));

  const removePhoneRow = (index) =>
    setFormData((prev) => ({
      ...prev,
      phoneNumberData: (prev.phoneNumberData || []).filter(
        (_, i) => i !== index
      ),
    }));

  // Exactly one number can be primary — selecting one clears the rest.
  const setPrimaryPhone = (index) =>
    setFormData((prev) => ({
      ...prev,
      phoneNumberData: (prev.phoneNumberData || []).map((row, i) => ({
        ...row,
        primary: i === index,
      })),
    }));

  const saveInlineContacts = () => {
    const rows = phoneRows
      .map((row) => ({
        ...row,
        phoneNumber: (row.phoneNumber || "").trim(),
      }))
      .filter((row) => row.phoneNumber);

    if (!rows.length) {
      toast.error("Add at least one contact number");
      return;
    }

    const duplicates = new Set(rows.map((row) => row.phoneNumber));
    if (duplicates.size !== rows.length) {
      toast.error("Duplicate contact numbers");
      return;
    }

    // Fall back to the first row when nothing is flagged primary.
    const primaryIndex = Math.max(
      rows.findIndex((row) => row.primary),
      0
    );
    const normalized = rows.map((row, i) => ({
      ...row,
      primary: i === primaryIndex,
    }));

    saveInline({
      phoneNumberData: normalized,
      // Keep the scalar in sync — the leads table and the WhatsApp links read
      // `phoneNumber`, not the array.
      phoneNumber: normalized[primaryIndex].phoneNumber,
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullName =
      `${formData.firstName || ""} ${formData.lastName || ""}`.trim();

    // 🚨 VALIDATION FIX
    if (!fullName) {
      toast.error("Name is required");
      return;
    }
    const payload = {
      ...formData,
      name: fullName,
      cNextContact: toEspoDateTime(formData.cNextContact),
    };
    try {
      if (mode === "add") {
        await onCreate(payload);
      } else {
        await onUpdate(deal.id, payload);
      }

      setIsEditing(false);
      onClose(); // close drawer after success
    } catch (error) {
      console.error("Failed to save lead", error);
    }
  };
  const handleBulkUpdate = (e) => {
    e.preventDefault();

    const payload = {};

    if (massFields.assignedUserId)
      payload.assignedUserId = formData.assignedUserId;

    if (massFields.cNextContact)
      payload.cNextContact = toEspoDateTime(formData.cNextContact);

    if (massFields.status) payload.status = formData.status;

    if (massFields.source) payload.source = formData.source;

    if (!Object.keys(payload).length) {
      toast.error("Select at least one field");
      return;
    }

    onBulkUpdate(payload);
    onClose();
  };

  const handleDelete = async (e, activity) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete Feedback ${activity?.createdByName}?`);
    if (!ok) return;
    await onDelete(activity.id); // 👈 parent ko bol rahe ho
    queryClient.invalidateQueries(["lead-stream", deal.id]);
  };
  const createActivity = async () => {
    //post activity
    setActivityForm(true);
  };
  const handlePostActivity = async (e) => {
    e.preventDefault();

    if (!activityText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setPostingActivity(true);

      if (editingActivityId) {
        // 🔥 UPDATE STREAM
        const updated = await updateStream(editingActivityId, {
          post: activityText,
        });
        queryClient.invalidateQueries(["lead-stream", deal.id]);
        // setmockStream((prev) =>
        //   prev.map((a) =>
        //     a.id === editingActivityId ? { ...a, post: activityText } : a,
        //   ),
        // );

        toast.success("Activity updated");
      } else {
        // 🔥 CREATE STREAM
        const payload = {
          post: activityText,
          parentId: deal.id,
          parentType: "Lead",
          type: "Post",
          isInternal: false,
          attachmentsIds: [],
        };

        await createLeadActivity(payload);
        queryClient.invalidateQueries(["lead-stream", deal.id]);
        // setmockStream((prev) => [newActivity, ...prev]);

        toast.success("Activity posted");
      }

      setActivityText("");
      setEditingActivityId(null);
      setActivityForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save activity");
    } finally {
      setPostingActivity(false);
    }
  };

  const userOptions = users
    ?.filter((u) => u?.isActive) // ✅ only active users
    ?.map((u) => ({
      value: u.id,
      label: u.name || u.userName,
    }));
  const teamOptions = team?.map((t) => ({
    value: t.id,
    label: t.name,
  }));


  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // EspoCRM expects datetime as exactly "YYYY-MM-DD HH:MM:SS".
  // Accepts datetime-local ("YYYY-MM-DDTHH:MM"), Espo ("YYYY-MM-DD HH:MM:SS")
  // and ISO strings — and always rebuilds them in Espo's exact format.
  const toEspoDateTime = (value) => {
    if (!value) return null;

    const match = String(value)
      .trim()
      .replace("T", " ")
      .match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);

    if (!match) return null;

    return `${match[1]} ${match[2]}:00`;
  };


  const leadData = leadsDetails || deal;
  // Numbers shown in view mode. `getPhoneRows` falls back to a "+91" stub for
  // empty records, which is useful in the editor but noise in the display.
  const contactNumbers = getPhoneRows(leadData).filter(
    (row) => row.phoneNumber && row.phoneNumber !== "+91"
  );
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-foreground">
                {mode === "mass-update"
                  ? `Mass Update (${selectedIds.length}) Leads`
                  : mode === "add"
                    ? "Add Lead"
                    : isEditing
                      ? "Edit Lead"
                      : deal?.name}
              </h2>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(
                  deal?.status,
                )}`}
              >
                {mode !== "view" && deal && <span>{deal.status}</span>}
              </span>
            </div>
            <div className="flex items-center space-x-2">

              {mode == "view" && canEditDeal(deal) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditing) setFormData(deal);
                    setIsEditing(!isEditing);
                  }}
                >
                  <Icon name="Edit" size={16} className="mr-1" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              )}


              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {showForm && !isMassUpdate && (
              <div className="p-5 sm:p-6 bg-gradient-to-br from-background to-muted/30">
                {/* Lead Form Here */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* ================= Basic Info ================= */}
                  <div className={FORM_CARD}>
                    <h3 className={FORM_HEADING}>Basic Info</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="First Name *"
                        icon="UserRound"
                        placeholder="First name"
                        className={FIELD}
                        value={formData.firstName || ""}
                        onChange={(e) =>
                          handleChange("firstName", e.target.value)
                        }
                      />
                      <Input
                        label="Last Name"
                        icon="Users"
                        placeholder="Last name"
                        className={FIELD}
                        value={formData.lastName || ""}
                        onChange={(e) =>
                          handleChange("lastName", e.target.value)
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Phone"
                        icon="PhoneCall"
                        placeholder="+91"
                        className={FIELD}
                        value={formData.phoneNumber || ""}
                        onChange={(e) =>
                          handleChange("phoneNumber", e.target.value)
                        }
                      />
                      <Input
                        label="Email"
                        icon="AtSign"
                        placeholder="name@company.com"
                        className={FIELD}
                        value={formData.emailAddress || ""}
                        onChange={(e) =>
                          handleChange("emailAddress", e.target.value)
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Whatsapp"
                        icon="MessageCircle"
                        placeholder="Whatsapp number"
                        className={FIELD}
                        value={formData.whatsapp || ""}
                        onChange={(e) =>
                          handleChange("whatsapp", e.target.value)
                        }
                      />
                      <Input
                        label="City"
                        icon="MapPinned"
                        placeholder="City"
                        className={FIELD}
                        value={formData.addressCity || ""}
                        onChange={(e) =>
                          handleChange("addressCity", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Lead Details ================= */}
                  <div className={FORM_CARD}>
                    <h3 className={FORM_HEADING}>Lead Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Status"
                        icon="CircleDot"
                        className={SELECT_FIELD}
                        value={formData.status || "New"}
                        options={statusOptions}
                        onChange={(value) => handleChange("status", value)}
                      />
                      <Select
                        label="Source"
                        icon="Radio"
                        className={SELECT_FIELD}
                        value={formData.source || ""}
                        options={sourceOptions}
                        onChange={(value) => handleChange("source", value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="datetime-local"
                        label="Next Contact"
                        icon="CalendarClock"
                        className={FIELD}
                        value={formData.cNextContact || ""}
                        onChange={(e) =>
                          handleChange("cNextContact", e.target.value)
                        }
                      />
                      <Select
                        label="OPT Verified"
                        icon="ShieldCheck"
                        className={SELECT_FIELD}
                        value={formData.cOTPVerified || ""}
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" }
                        ]}
                        onChange={(value) => handleChange("cOTPVerified", value)}
                      />
                    </div>
                  </div>

                  {/* ================= Assignment ================= */}
                  <div className={FORM_CARD}>
                    <h3 className={FORM_HEADING}>Assignment</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Assigned User"
                        icon="UserCheck"
                        className={SELECT_FIELD}
                        value={formData.assignedUserId || ""}
                        options={userOptions} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("assignedUserId", value)
                        }
                        searchable
                      />
                      <Select
                        label="Teams"
                        icon="Network"
                        className={SELECT_FIELD}
                        value={formData.teamId || ""}
                        options={teamOptions} // 👉 later API se teams
                        onChange={(value) =>
                          handleSelectChange("teamId", value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Details ================= */}
                  <div className={FORM_CARD}>
                    <h3 className={FORM_HEADING}>Additional Details</h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Question
                      </label>
                      <textarea
                        className={TEXTAREA}
                        rows={4}
                        value={formData.cQuestion || ""}
                        placeholder="What is the lead asking about?"
                        onChange={(e) =>
                          handleChange("cQuestion", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Description
                      </label>
                      <textarea
                        className={TEXTAREA}
                        rows={4}
                        value={formData.description || ""}
                        placeholder="Any additional context about this lead"
                        onChange={(e) =>
                          handleChange("description", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Actions ================= */}
                  <div className="flex justify-end gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="h-11 rounded-xl px-5"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="h-11 rounded-xl px-6">
                      Save Lead
                    </Button>
                  </div>
                </form>
              </div>
            )}
            {/* mass upadte */}
            {isMassUpdate && (
              <form className="space-y-6 p-5" onSubmit={handleBulkUpdate}>
                <h3 className="text-lg font-semibold text-foreground">
                  Mass Update Leads
                </h3>

                <p className="text-sm text-muted-foreground">
                  Updating {selectedIds.length} selected Leads
                </p>
                <div className="grid grid-cols-1 gap-4">
                  {/* Assigned User */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.assignedUserId}
                      onChange={() => toggleMassField("assignedUserId")}
                    />
                    <Select
                      label="Assigned User"
                      icon="UserCheck"
                      value={formData.assignedUserId}
                      options={userOptions}
                      disabled={!massFields.assignedUserId}
                      onChange={(v) => handleChange("assignedUserId", v)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Team */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.teamId}
                      onChange={() => toggleMassField("teamId")}
                    />
                    <Select
                      label="Team"
                      icon="Network"
                      value={formData.teamId}
                      options={teamOptions}
                      disabled={!massFields.teamId}
                      onChange={(v) => handleChange("teamId", v)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.status}
                      onChange={() => toggleMassField("status")}
                    />
                    <Select
                      label="Status"
                      icon="CircleDot"
                      value={formData.status}
                      options={statusOptions}
                      disabled={!massFields.status}
                      onChange={(v) => handleChange("status", v)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update {selectedIds.length} Accounts
                  </Button>
                </div>
              </form>
            )}

            {!showForm && !isMassUpdate && deal && (
              <>
                {/* Tabs */}
                <div className="flex items-center space-x-1 p-4 border-b border-border overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`
                  flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-smooth
                  ${activeTab === tab?.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }
                `}
                    >
                      <Icon name={tab?.icon} size={16} />
                      <span>{tab?.label}</span>
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* ================= Overview ================= */}
                      <div className="border border-border rounded-xl p-4 sm:p-6">
                        <div className="grid grid-cols-1 gap-5">
                          {/* Name */}
                          <InlineEditRow
                            icon="UserRound"
                            tone="violet"
                            label="Name"
                            canEdit={canEditDeal(deal)}
                            isEditing={editingField === "name"}
                            isSaving={savingField === "name"}
                            onEdit={() => startInlineEdit("name")}
                            onCancel={cancelInlineEdit}
                            onSave={saveInlineName}
                            editor={
                              <div className="grid grid-cols-1 gap-3">
                                <Input
                                  label="First Name *"
                                  icon="UserRound"
                                  value={formData.firstName || ""}
                                  onChange={(e) =>
                                    handleChange("firstName", e.target.value)
                                  }
                                />
                                <Input
                                  label="Last Name"
                                  icon="Users"
                                  value={formData.lastName || ""}
                                  onChange={(e) =>
                                    handleChange("lastName", e.target.value)
                                  }
                                />
                              </div>
                            }
                          >
                            <p className="text-foreground font-medium truncate">
                              {leadData?.name || "None"}
                            </p>
                          </InlineEditRow>
                          {/* Contact numbers — an array, so a lead can carry
                              as many numbers as it needs */}
                          <InlineEditRow
                            icon="PhoneCall"
                            tone="emerald"
                            label="Contact"
                            canEdit={canEditDeal(deal)}
                            isEditing={editingField === "contacts"}
                            isSaving={savingField === "contacts"}
                            onEdit={() => startInlineEdit("contacts")}
                            onCancel={cancelInlineEdit}
                            onSave={saveInlineContacts}
                            editor={
                              <div className="space-y-3">
                                {phoneRows.map((row, index) => (
                                  <div
                                    key={index}
                                    className={`rounded-xl border p-3 transition-colors ${row.primary
                                      ? "border-amber-200 bg-amber-50/40"
                                      : "border-border bg-muted/20"
                                      }`}
                                  >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Contact {index + 1}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => removePhoneRow(index)}
                                        disabled={phoneRows.length === 1}
                                        aria-label="Remove this number"
                                        title={
                                          phoneRows.length === 1
                                            ? "A lead needs at least one number"
                                            : "Remove this number"
                                        }
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                                      >
                                        <Icon name="Trash2" size={15} />
                                      </button>
                                    </div>

                                    <Input
                                      icon="Phone"
                                      type="tel"
                                      value={row.phoneNumber || ""}
                                      placeholder="+91 98765 43210"
                                      onChange={(e) =>
                                        updatePhoneRow(index, {
                                          phoneNumber: e.target.value,
                                        })
                                      }
                                    />

                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="min-w-0 flex-1">
                                        <Select
                                          icon="Tag"
                                          options={PHONE_TYPE_OPTIONS}
                                          value={row.type || "Mobile"}
                                          onChange={(value) =>
                                            updatePhoneRow(index, {
                                              type: value,
                                            })
                                          }
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setPrimaryPhone(index)}
                                        aria-pressed={!!row.primary}
                                        title="The primary number is the one shown in the leads list"
                                        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${row.primary
                                          ? "border-amber-400 bg-amber-100 text-amber-800"
                                          : "border-border bg-background text-muted-foreground hover:border-amber-300 hover:text-amber-700"
                                          }`}
                                      >
                                        <Icon name="Star" size={15} />
                                        {row.primary ? "Primary" : "Set primary"}
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={addPhoneRow}
                                  className="w-full"
                                >
                                  <Icon name="Plus" size={15} className="mr-1.5" />
                                  Add another contact
                                </Button>
                              </div>
                            }
                          >
                            {contactNumbers.length ? (
                              <div className="space-y-1">
                                {contactNumbers.map((row, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-1.5"
                                  >
                                    {/* Type moved to a tooltip and Primary to a
                                        bare star — the drawer column is narrow. */}
                                    <a
                                      href={`tel:${row.phoneNumber}`}
                                      title={row.type || undefined}
                                      className="text-primary hover:underline"
                                    >
                                      {row.phoneNumber}
                                    </a>

                                    {row.primary && contactNumbers.length > 1 && (
                                      <span
                                        title="Primary number"
                                        className="inline-flex shrink-0 items-center text-amber-500"
                                      >
                                        <Icon name="Star" size={13} className="fill-amber-400" />
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-foreground">None</p>
                            )}
                          </InlineEditRow>
                          {/* Email */}
                          <FieldRow
                            icon="AtSign"
                            tone="sky"
                            label="Email"
                          >
                            {deal?.emailAddress ? (
                              <a
                                href={`mailto:${deal.emailAddress}`}
                                className="text-primary hover:underline break-words"
                              >
                                {deal?.emailAddress || "None"}
                              </a>
                            ) : (
                              <p className="text-foreground">None</p>
                            )}
                          </FieldRow>

                          {/* WhatsApp — Quick Reply */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">

                            </div>
                            {deal?.phoneNumber ? (
                              <a
                                href={`https://api.whatsapp.com/send/?phone=${deal.phoneNumber.replace(
                                  /\D/g,
                                  ""
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Opens WhatsApp with a short intro message"
                                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700  transition-colors"
                              >
                                {/* <img
                                  src="/assets/whatsapp-logo.png"
                                  alt="WhatsApp"
                                  className="w-4 h-4 object-contain"
                                /> */}
                                <span className="inline-flex items-center gap-1 p-2 text-[12px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  <Icon name="Zap" size={10} />
                                  Quick Reply on WhatsApp
                                </span>
                              </a>
                            ) : (
                              <p className="text-foreground">None</p>
                            )}
                          </div>

                          {/* City */}
                          <FieldRow
                            icon="MapPinned"
                            tone="amber"
                            label="City"
                          >
                            <p className="text-foreground font-medium">
                              {deal?.addressCity || "None"}
                            </p>
                          </FieldRow>

                          {/* Next Contact */}
                          <FieldRow
                            icon="CalendarClock"
                            tone="indigo"
                            label="Next Contact"
                          >
                            <p className="text-foreground font-medium">
                              {deal?.cNextContact
                                ? formatDateTime(deal.cNextContact)
                                : "None"}
                            </p>
                          </FieldRow>
                          <FieldRow
                            icon="ShieldCheck"
                            tone="teal"
                            label="OTP Verified"
                          >
                            <p className="text-foreground font-medium">
                              {deal?.cOTPVerified || "No"}
                            </p>
                          </FieldRow>

                          

                          {/* WhatsApp — Full Branded Template */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {/* <p className="text-sm text-muted-foreground">
                                WhatsApp
                              </p> */}

                            </div>
                            {deal?.phoneNumber ? (
                              <a
                                href={`https://api.whatsapp.com/send/?phone=${deal.phoneNumber.replace(
                                  /\D/g,
                                  ""
                                )}&text=${encodeURIComponent(
                                  `Hello *${deal?.name || "Customer"}*,

Thank you for contacting us for your lead generation requirements.

I'm *${deal?.assignedUserName || "Team Member"}* from *AAJneeti Advertising*.

Let me know when you're available so that we can discuss this in more detail.

*aajneeti.social*`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Opens WhatsApp with the full branded company template"
                                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                              >
                                <span className="inline-flex items-center gap-1 p-2  text-[12px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Icon name="BadgeCheck" size={10} />
                                  WhatsApp Template
                                </span>
                              </a>
                            ) : (
                              <p className="text-foreground">None</p>
                            )}
                          </div>

                          {/* Question */}
                          <FieldRow
                            icon="MessagesSquare"
                            tone="rose"
                            label="Question"
                          >
                            <QuestionAnswers raw={deal?.cQuestion} />
                          </FieldRow>
                        </div>
                      </div>

                      {/* ================= Details ================= */}
                      <div className="border border-border rounded-xl p-4 sm:p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="SlidersHorizontal" size={17} className="text-primary" />
                          Details
                        </h3>

                        <div className="grid grid-cols-1 gap-5">
                          {/* Status */}
                          <InlineEditRow
                            icon="CircleDot"
                            tone="violet"
                            label="Status"
                            canEdit={canEditDeal(deal)}
                            isEditing={editingField === "status"}
                            isSaving={savingField === "status"}
                            onEdit={() => startInlineEdit("status")}
                            onCancel={cancelInlineEdit}
                            onSave={saveInlineStatus}
                            editor={
                              <div className="flex flex-wrap gap-2">
                                {statusOptions.map((option) => {
                                  const isSelected =
                                    formData.status === option.value;
                                  const theme = getStatusTheme(option.value);

                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      aria-pressed={isSelected}
                                      onClick={() =>
                                        handleChange("status", option.value)
                                      }
                                      className={`rounded-full border px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm transition-all duration-150 ${isSelected
                                        ? `${theme.active} font-semibold shadow-sm`
                                        : `${theme.idle} hover:shadow-sm`
                                        }`}
                                    >
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>
                            }
                          >
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusTheme(
                                leadData?.status
                              ).pill}`}
                            >
                              {leadData?.status || "—"}
                            </span>
                          </InlineEditRow>
                          {/* Source */}
                          <FieldRow
                            icon="Radio"
                            tone="sky"
                            label="Source"
                          >
                            <p className="text-foreground font-medium">
                              {deal?.source || "—"}
                            </p>
                          </FieldRow>
                          {/* Source */}


                          {/* Description */}
                          <FieldRow
                            icon="NotepadText"
                            tone="indigo"
                            label="Description"
                          >
                            <p className="text-foreground leading-relaxed mt-1 whitespace-pre-line break-words">
                              {linkifyText(deal?.description)}
                            </p>
                          </FieldRow>
                        </div>
                      </div>
                    </div>
                  )}



                  {activeTab === "AssignedUsers" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-4 sm:p-6">
                        <div className="grid grid-cols-1 gap-5">
                          {/* Assigned User */}
                          <FieldRow
                            icon="UserCheck"
                            tone="violet"
                            label="Assigned User"
                          >
                            <p className="text-foreground font-medium">
                              {leadData?.assignedUserName || "—"}
                            </p>
                          </FieldRow>

                          {/* Followers */}
                          <FieldRow
                            icon="UsersRound"
                            tone="sky"
                            label="Followers"
                          >
                            <p className="text-foreground font-medium">
                              {leadsDetails?.followersNames ? (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(
                                    leadsDetails.followersNames,
                                  ).map(([id, name]) => (
                                    <span
                                      key={id}
                                      className="text-sm text-primary font-medium"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span>None</span>
                              )}
                            </p>
                          </FieldRow>
                          {/* Followers */}
                          <FieldRow
                            icon="Network"
                            tone="indigo"
                            label="Teams"
                          >
                            <p className="text-foreground font-medium">
                              {leadsDetails?.teamsNames ? (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(
                                    leadsDetails.teamsNames,
                                  ).map(([id, name]) => (
                                    <span
                                      key={id}
                                      className="text-sm text-primary font-medium"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span>None</span>
                              )}
                            </p>
                          </FieldRow>
                        </div>
                      </div>

                      {/* ================= Audit Information ================= */}
                      <div className="border border-border rounded-xl p-4 sm:p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="ScrollText" size={17} className="text-primary" />
                          Audit Information
                        </h3>

                        <div className="grid grid-cols-1 gap-5">
                          {/* Created */}
                          <FieldRow
                            icon="CalendarPlus"
                            tone="teal"
                            label="Created"
                          >
                            <p className="text-foreground font-medium">
                              {deal?.createdAt
                                ? `${formatDateTime(deal.createdAt)} by ${deal?.createdByName || "—"}`
                                : "—"}
                            </p>
                          </FieldRow>

                          {/* Modified */}
                          <FieldRow
                            icon="PencilLine"
                            tone="amber"
                            label="Last Modified"
                          >
                            <p className="text-foreground font-medium">
                              {deal?.modifiedAt
                                ? `${formatDateTime(deal.modifiedAt)} by ${deal?.modifiedByName || "—"}`
                                : "—"}
                            </p>
                          </FieldRow>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "Stream" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-medium text-foreground">
                          <Icon name="Megaphone" size={18} className="text-primary" />
                          Recent Feedback
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={createActivity}
                        >
                          <Icon name="Plus" size={16} className="mr-1" />
                          Add Feedback
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {/* add activity form */}
                        {showActivityForm && (
                          <form onSubmit={handlePostActivity}>
                            <textarea
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              label="Activity"
                              rows={4}
                              placeholder="Write Your Comment Here..."
                              value={activityText}
                              onChange={(e) => setActivityText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setActivityForm(false);
                                  setActivityText("");
                                }}
                              >
                                Cancel
                                <Icon
                                  name="XCircle"
                                  size={16}
                                  className="mr-1"
                                />
                              </Button>

                              <Button
                                type="submit"
                                size="sm"
                                disabled={postingActivity}
                              >
                                {editingActivityId ? "Update" : "Post"}
                                <Icon
                                  name={editingActivityId ? "Save" : "Send"}
                                  size={16}
                                  className="mr-1"
                                />
                              </Button>
                            </div>
                          </form>
                        )}
                        {streams.length > 0 ? (streams?.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex space-x-3 p-4 bg-muted/30 rounded-lg"
                          >
                            {/* AVATAR */}
                            <Avatar
                              name={activity.createdByName || "System"}
                              size="36"
                              round
                              textSizeRatio={2}
                              color={
                                activity.createdById === "system"
                                  ? "#9CA3AF"
                                  : undefined
                              }
                            />

                            {/* CONTENT */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-foreground">
                                    {activity.createdByName || "System"}
                                  </h4>

                                  <Icon
                                    name={getActivityIcon(activity.type)}
                                    size={14}
                                    className={getActivityIconColor(
                                      activity.type,
                                    )}
                                  />

                                  <span className="text-xs text-muted-foreground">
                                    {activity.type}
                                  </span>
                                </div>

                                <span className="text-xs text-muted-foreground">
                                  {formatDate(activity.createdAt)}
                                </span>
                                <div
                                  className={`flex items-center space-x-1 transition-opacity`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditActivity(activity)}
                                    className="h-8 w-8 hidden"
                                  >
                                    <Icon name="Edit" size={14} />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleDelete(e, activity)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Icon name="Trash2" size={14} />
                                  </Button>
                                </div>
                              </div>

                              {/* MESSAGE */}
                              <p className="text-sm text-muted-foreground mt-1">
                                {getActivityMessage(activity)}
                              </p>

                              {/* STATUS BADGE — only show when value is a primitive */}
                              {typeof activity?.data?.value === "string" && (
                                <span
                                  className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStageColor(
                                    activity.data.value,
                                  )}`}
                                >
                                  {activity.data.value}
                                </span>
                              )}

                              {typeof activity?.data?.statusValue === "string" && (
                                <span
                                  className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStageColor(
                                    activity.data.statusValue,
                                  )}`}
                                >
                                  {activity.data.statusValue}
                                </span>
                              )}
                            </div>
                          </div>
                        ))) : (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <img
                              src="/assets/images/comment.png"
                              alt="No Activities"
                              className="w-40 opacity-80"
                            />
                            <p className="mt-3 text-sm text-muted-foreground">
                              Currently you don't have any comments
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "Activity" && (
                    <div className="space-y-4">
                      {activities?.length > 0 ? (
                        activities.map((activity) => (
                          <div
                            key={activity.id}
                            onClick={() => toggleActivity(activity.id)}
                            className={`cursor-pointer rounded-lg p-4 transition-all duration-300${expandedActivityId === activity.id
                              ? "bg-muted shadow-sm"
                              : "bg-muted/30 hover:bg-muted"
                              }`}
                          >
                            {/*  */}
                            <div className="flex space-x-3">
                              <Avatar
                                name={activity.name || "System"}
                                size="36"
                                round
                                textSizeRatio={2}
                              />

                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-foreground">
                                    {activity.name || "Activity"}
                                  </h4>

                                  <span className="text-xs text-muted-foreground">
                                    {activity._scope}
                                  </span>

                                  {activity.status && (
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded-full ${getStageColor(
                                        activity.status,
                                      )}`}
                                    >
                                      {activity.status}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Icon name="Clock" size={12} />
                                    {formatDate(activity.dateStart)}
                                  </span>

                                  {activity.duration && (
                                    <span className="flex items-center gap-1">
                                      <Icon name="Timer" size={12} />
                                      {Math.round(activity.duration / 60)} min
                                    </span>
                                  )}

                                  {activity.parentType && (
                                    <span className="flex items-center gap-1">
                                      <Icon name="Link" size={12} />
                                      {activity.parentType}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/*  */}
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedActivityId === activity.id
                                ? "max-h-[600px] opacity-100 mt-4"
                                : "max-h-0 opacity-0"
                                }`}
                            >
                              <div className="border-t pt-4 text-sm text-muted-foreground">
                                <div className="grid grid-cols-1 gap-y-4">
                                  <div>
                                    <p className="text-xs">Direction</p>
                                    <p className="font-medium text-foreground">
                                      {activity.direction}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs">Assigned User</p>
                                    <p className="font-medium text-foreground">
                                      {activity.assignedUserName}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs">Date Start</p>
                                    <p className="font-medium text-foreground">
                                      {formatDateTime(activity.dateStart)}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs">Date End</p>
                                    <p className="font-medium text-foreground">
                                      {formatDateTime(activity.dateEnd)}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs">Duration</p>
                                    <p className="font-medium text-foreground">
                                      {Math.round(activity.duration / 60)} min
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs">Parent</p>
                                    <p className="font-medium text-primary">
                                      {activity.parentType}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs">Created</p>
                                    <p className="font-medium text-foreground">
                                      {formatDate(activity.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <img
                            src="/assets/images/no-content.png"
                            alt="No Activities"
                            className="w-40 opacity-80"
                          />
                          <p className="mt-3 text-sm text-muted-foreground">
                            Currently you don't have any activities
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(DealDrawer);
