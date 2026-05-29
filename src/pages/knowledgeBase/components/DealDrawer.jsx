import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { createLeadActivity, updateStream } from "services/leads.service";
import { useTeams } from "hooks/useTeams";
import { useUsers } from "hooks/useUsers";
import { useLeadStream } from "hooks/useLeadStream";
import { useLeadActivity } from "hooks/useLeadActivity";
import { useQueryClient } from "@tanstack/react-query";

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
  const [attachments, setAttachments] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    status: "Draft",
    language: "en_US",
    description: "",
    teamId: "",
    publishDate: "",
    expirationDate: "",
  });
  const queryClient = useQueryClient();
  const { data: usersData } = useUsers();
  const { data: teamData } = useTeams();

  const users = usersData?.list || [];
  const team = teamData?.list || [];
  console.log("leadDetails", leadsDetails);

  useEffect(() => {
    if (mode === "add") {
      setFormData({
        name: "",
        status: "Draft",
        language: "en_US",
        description: "",
        teamId: "",
        publishDate: "",
        expirationDate: "",
      });
      setIsEditing(true);
    } else if (deal && mode === "view") {
      setFormData({
        name: deal.name || "",
        status: deal.status || "Draft",
        language: deal.language || "en_US",
        description: deal.body || "",
        teamId: deal.teamsIds?.[0] || "",
        publishDate: deal.publishDate || "",
        expirationDate: deal.expirationDate || "",
      });
      setIsEditing(false);
    }
  }, [deal, mode]);

  const [massFields, setMassFields] = useState({
    assignedUserId: false,
    status: false,
    source: false,
    teamId: false,
    cNextContactAt: false,
  });

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

  const tabs = [
    { id: "overview", label: "Overview", icon: "Eye" },
    { id: "AssignedUsers", label: "Assigned User", icon: "Users" }
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
  const parseBody = (html) => {
    if (!html) return "—";

    const temp = document.createElement("div");
    temp.innerHTML = html;

    return temp.innerText;
  };
  const getActivityMessage = (activity) => {
    const { type, post, data, createdByName } = activity;

    if (type === "Post") {
      return post;
    }

    if (type === "Assign") {
      return `Assigned to ${data?.assignedUserName}`;
    }

    if (type === "Create") {
      return "Lead was created";
    }

    if (type === "Update") {
      if (data?.value) {
        return `Status updated to ${data.value}`;
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("Name is required");
      return;
    }

    const payload = {
      name: formData.name.trim(),

      // ✅ required
      status: formData.status,
      language: formData.language,
      type: "Article",

      // ✅ content
      body: formData.description || "",

      // ✅ optional
      publishDate: formData.publishDate || null,
      expirationDate: formData.expirationDate || null,

      // ✅ teams
      teamsIds: formData.teamId ? [formData.teamId] : [],

      // ✅ attachments (future)
      attachmentsIds: [],
    };

    try {
      if (mode === "add") {
        await onCreate(payload);
        toast.success("Article created ✅");
      } else {
        await onUpdate(deal.id, payload);
        toast.success("Article updated ✏️");
      }

      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save article ❌");
    }
  };
  const handleBulkUpdate = (e) => {
    e.preventDefault();

    const payload = {};

    if (massFields.assignedUserId)
      payload.assignedUserId = formData.assignedUserId;

    if (massFields.cNextContactAt)
      payload.cNextContactAt = toEspoDateTime(formData.cNextContactAt);

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
    const ok = window.confirm(`Delete Stream ${activity?.createdByName}?`);
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
  const langOptions = [
    { value: "en_US", label: "English (US)" },
    { value: "en_GB", label: "English (UK)" },
    { value: "ar", label: "Arabic" },
    { value: "de", label: "German" },
    { value: "es_ES", label: "Spanish (Spain)" },
    { value: "es_MX", label: "Spanish (Mexico)" },
    { value: "fr_FR", label: "French (France)" },
    { value: "ja", label: "Japanese" },
    { value: "id", label: "Indonesian" },
    { value: "it", label: "Italian" },
  ];
  const statusOptions = [
    { value: "Draft", label: "Draft" },
    { value: "In Review", label: "In Review" },
    { value: "Published", label: "Published" },
    { value: "Archived", label: "Archived" },
  ];

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const toEspoDateTime = (value) => {
    if (!value) return null;

    // already Espo format → do nothing
    if (value.includes(" ")) {
      return value;
    }

    // from datetime-local input
    return value.replace("T", " ") + ":00";
  };


  const leadData = leadsDetails || deal;
  const handleFileChange = (files) => {
    const newFiles = Array.from(files);
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
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
                  ? `Mass Update (${selectedIds.length}) Article`
                  : mode === "add"
                    ? "Add Article"
                    : isEditing
                      ? "Edit Article"
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
              {mode == "view" && (
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
              <div className="p-6">
                {/* Lead Form Here */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ================= Overview ================= */}
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Name *"
                        value={formData.name || ""}
                        onChange={(e) =>
                          handleChange("name", e.target.value)
                        }
                      />

                    </div>

                  </div>

                  {/* ================= Assigned User ================= */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Assigned User"
                        value={formData.assignedUserId || ""}
                        options={userOptions} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("assignedUserId", value)
                        }
                        searchable
                      />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Teams"
                        value={formData.teamId || ""}
                        options={teamOptions} // 👉 later API se teams
                        onChange={(value) =>
                          handleSelectChange("teamId", value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Details ================= */}
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium text-foreground">Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Status"
                        value={formData.status || "New"}
                        options={statusOptions}
                        onChange={(value) => handleChange("status", value)}
                      />
                      <Select
                        label="Language"
                        value={formData.language || ""}
                        options={langOptions}
                        onChange={(value) => handleChange("language", value)}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Description
                      </label>

                      <div className="custom-quill">
                        <ReactQuill
                          theme="snow"
                          value={formData.description || ""}
                          onChange={(value) => handleChange("description", value)}
                          style={{ height: "150px", marginBottom: "40px" }}
                          modules={{
                            toolbar: [
                              ["bold", "italic", "underline", "strike"],
                              [{ header: [1, 2, 3, false] }],
                              [{ list: "ordered" }, { list: "bullet" }],
                              ["link", "image"],
                              ["clean"],
                            ],
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 pt-3">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Attachments
                      </label>

                      <div
                        className="relative border-2 border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-all bg-gradient-to-br from-background to-primary/5"
                        onClick={() => document.getElementById("fileInput").click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleFileChange(e.dataTransfer.files);
                        }}
                      >
                        <input
                          id="fileInput"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileChange(e.target.files)}
                        />

                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon name="UploadCloud" size={22} />
                          </div>

                          <p className="text-sm font-medium">
                            Drag & drop files here or <span className="text-primary">browse</span>
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Supports images, PDFs, docs
                          </p>
                        </div>
                      </div>

                      {/* Selected Files */}
                      {attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
                            >
                              <div className="flex items-center gap-2">
                                <Icon name="FileText" size={16} />
                                <span className="text-sm truncate max-w-[200px]">
                                  {file.name}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Icon name="X" size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================= Actions ================= */}
                  <div className="flex justify-end gap-3">
                    <Button type="submit">Save Article</Button>
                  </div>
                </form>
              </div>
            )}
            {/* mass upadte */}
            {isMassUpdate && (
              <form className="space-y-6 p-5" onSubmit={handleBulkUpdate}>
                <h3 className="text-lg font-semibold text-foreground">
                  Mass Update Article
                </h3>

                <p className="text-sm text-muted-foreground">
                  Updating {selectedIds.length} selected Leads
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assigned User */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.assignedUserId}
                      onChange={() => toggleMassField("assignedUserId")}
                    />
                    <Select
                      label="Assigned User"
                      value={formData.assignedUserId}
                      options={userOptions}
                      disabled={!massFields.assignedUserId}
                      onChange={(v) => handleChange("assignedUserId", v)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Team */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.teamId}
                      onChange={() => toggleMassField("teamId")}
                    />
                    <Select
                      label="Team"
                      value={formData.teamId}
                      options={teamOptions}
                      disabled={!massFields.teamId}
                      onChange={(v) => handleChange("teamId", v)}
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
                <div className="flex items-center space-x-1 p-4 border-b border-border">
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
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* ================= Overview ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Name */}
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">
                              Name
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.name || "None"}
                            </p>
                          </div>

                          {/* Phone */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Status
                            </p>
                            {deal?.status || "None"}
                          </div>

                          {/* Email */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Publish Date
                            </p>
                            {deal?.publishDate
                              ? formatDateTime(deal.publishDate)
                              : "None"}
                          </div>

                          {/* WhatsApp */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Categories
                            </p>
                            {(deal?.categoriesNames &&
                              Object.values(deal.categoriesNames).join(", ")) ||
                              "None"}
                          </div>

                          {/* City */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Expiration Date
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.expirationDate || "None"}
                            </p>
                          </div>

                          {/* Next Contact */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Portals
                            </p>
                            <p className="text-foreground font-medium">
                              {(deal?.portalsNames &&
                                Object.values(deal.portalsNames).join(", ")) ||
                                "None"}
                            </p>
                          </div>

                          {/* Project Name */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Language
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.language || "None"}
                            </p>
                          </div>


                        </div>
                      </div>

                      {/* ================= Details ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="text-base font-semibold text-foreground mb-6">
                          Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Status */}
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">
                              Body
                            </p>
                            <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-success" >
                              <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: deal?.body || "" }}
                              />
                            </div>
                          </div>

                          {/* Source */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Attachments
                            </p>
                            <p className="text-foreground font-medium">
                              {(deal?.attachmentsNames &&
                                Object.values(deal.attachmentsNames).join(", ")) ||
                                "None"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "AssignedUsers" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Assigned User */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Assigned User
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.assignedUserName || "None"}
                            </p>
                          </div>

                          {/* Followers */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Teams
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.teamsNames ? (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(
                                    deal.teamsNames,
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
                          </div>

                        </div>
                      </div>

                      {/* ================= Audit Information ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="text-base font-semibold text-foreground mb-6">
                          Audit Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Created */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Created
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.createdAt
                                ? `${formatDateTime(deal.createdAt)} by ${deal?.createdByName || "—"}`
                                : "—"}
                            </p>
                          </div>

                          {/* Modified */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Last Modified
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.modifiedAt
                                ? `${formatDateTime(deal.modifiedAt)} by ${deal?.modifiedByName || "—"}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
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
