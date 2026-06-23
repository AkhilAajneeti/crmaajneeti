import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import ReactSelect from "react-select";
import makeAnimated from "react-select/animated";
import Input from "../../../components/ui/Input";
import {
  accActivitesById,
  createAccStream,
  deleteAccStream,
  fetchTaskByAccount,
  unlinkContactFromAccount,
  updateAccount,
} from "services/account.service";
import { fetchUser } from "services/user.service";
import Select from "components/ui/Select";
import { fetchTeam } from "services/team.service";
import { fetchAccStreamById } from "services/account.service";
import { deleteTasks } from "services/tasks.service";
import { useAccountById } from "hooks/useAccounts";
import { useCalenderById, useCalenderStream } from "hooks/useCalender";
import { createNewAttendance, updateAttendance } from "services/calender.service";
import AttendanceSuccessModal from "./AttendanceSuccessModal";

const AttendanceDrawer = ({
  data,
  isOpen,
  onClose,
  mode = "view",
  onSuccess,
  onBulkUpdate,
  selectedIds = [],
  // ✅ NEW: Permission props
  canCreate = false,
  canEdit = false,
  canEditStatus = false,
  canEditDep = false,
  canEditEmpCode = false,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [drawerMode, setDrawerMode] = useState(mode);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [postingStream, setPostingStream] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Holds the requestType of a just-created request → drives the success modal.
  const [successType, setSuccessType] = useState(null);
  const [users, setUsers] = useState([]);
  const [team, setTeam] = useState([]);
  const [massFields, setMassFields] = useState({
    assignedUserId: false,
    industry: false,
    type: false,
    teamId: false,
  });

  const isMassUpdate = drawerMode === "mass-update";
  const animatedComponents = makeAnimated();
  const { data: account, isLoading } = useCalenderById(data?.id);
  const {
    data: streams,
    isLoading: streamLoading,
  } = useCalenderStream(data?.id, isOpen, activeTab);

  // ✅ FIXED: Complete form state with all fields
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    department: "",
    employeeCode: "",

    // Request Details
    requestType: "",
    status: "Pending",
    startDate: "",
    endDate: "",
    duration: "",
    durationInMinutes: 0,

    // Leave Details
    leaveBalance: 0,
    leaveConsumed: 0,
    leaveCreditsDeducted: 0,

    // Description & Notes
    description: "",
    rejectionReason: null,

    // Assignment
    assignedUserId: "",
    teamsIds: [],
    collaboratorsIds: [],

    // Meta Fields
    applicantEmail: "",
    jobDesignation: [],
    selfRejected: false,
  });

  // ✅ FIXED: Complete initialization from account data
  useEffect(() => {
    if (account && (drawerMode === "view" || drawerMode === "edit")) {
      setFormData({
        // Basic Info
        name: account?.name || "",
        department: account?.department || "",
        employeeCode: account?.employeeCode || "",

        // Request Details
        requestType: account?.requestType || "",
        status: account?.status || "Pending",
        date: account?.startDate || "",
        startDate: account?.startDate || "",
        endDate: account?.endDate || account?.startDate,
        duration: account?.durationInMinutes || "",
        durationInMinutes: account?.durationInMinutes || 0,

        // Leave Details
        leaveBalance: account?.leaveBalance || 0,
        leaveConsumed: account?.leaveConsumed || 0,
        leaveCreditsDeducted: account?.leaveCreditsDeducted || 0,

        // Description & Notes
        description: account?.description || "",
        rejectionReason: account?.rejectionReason || null,

        // Assignment
        assignedUserId: account?.assignedUserId || "",
        teamsIds: Array.isArray(account?.teamsIds) ? account.teamsIds : [],
        collaboratorsIds: Array.isArray(account?.collaboratorsIds)
          ? account.collaboratorsIds
          : [],

        // Meta Fields
        applicantEmail: account?.applicantEmail || "",
        jobDesignation: Array.isArray(account?.jobDesignation)
          ? account.jobDesignation
          : [],
        selfRejected: account?.selfRejected || false,
      });
    }
  }, [account, drawerMode]);

  const formatDateTime = (value) => {
    if (!value) return "—";

    const safeValue = value.replace(" ", "T");
    const date = new Date(safeValue);

    if (isNaN(date.getTime())) return "—";

    return (
      date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  };

  useEffect(() => {
    if (!isOpen || !account?.id || activeTab !== "activities") return;

    const loadActivities = async () => {
      try {
        setActivityLoading(true);
        const res = await accActivitesById(account.id);
        setActivities(res?.list || []);
      } catch (err) {
        console.error("Failed to load activities", err);
      } finally {
        setActivityLoading(false);
      }
    };

    loadActivities();
  }, [isOpen, account?.id, activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      let clean = value.replace(/\D/g, "");

      if (!clean.startsWith("91")) {
        clean = "91" + clean;
      }

      setFormData((prev) => ({
        ...prev,
        phoneNumber: "+" + clean,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDrawerMode("view");
    if (account) {
      setFormData({
        name: account?.name || "",
        department: account?.department || "",
        employeeCode: account?.employeeCode || "",
        requestType: account?.requestType || "",
        status: account?.status || "Pending",
        startDate: account?.startDate || "",
        endDate: account?.endDate || "",
        leaveBalance: account?.leaveBalance || 0,
        leaveConsumed: account?.leaveConsumed || 0,
        leaveCreditsDeducted: account?.leaveCreditsDeducted || 0,
        description: account?.description || "",
        assignedUserId: account?.assignedUserId || "",
        teamsIds: account?.teamsIds || [],
        collaboratorsIds: account?.collaboratorsIds || [],
        applicantEmail: account?.applicantEmail || "",
      });
    }
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "Building2" },
    { id: "contacts", label: "Contacts", icon: "Users" },
    { id: "task", label: "Task", icon: "Target" },
    { id: "stream", label: "Stream", icon: "FileText" },
    { id: "activities", label: "Activities", icon: "Calendar" },
  ];

  const validateForm = () => {
    if (!formData?.name?.trim()) {
      toast.error("Reason is required");
      return false;
    }
    if (!formData?.requestType) {
      toast.error("Request type is required");
      return false;
    }
    if (!formData?.startDate) {
      toast.error("Start date is required");
      return false;
    }
    if (formData?.requestType === "Leave" && !formData?.endDate) {
      toast.error("End date is required for full leave");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, teamRes] = await Promise.all([
          fetchUser(),
          fetchTeam(),
        ]);

        setUsers(usersRes.list || []);
        setTeam(teamRes.list || []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isOpen || !account?.id || activeTab !== "task") return;

    const loadTasks = async () => {
      try {
        setTaskLoading(true);
        const res = await fetchTaskByAccount(account.id);
        setTasks(res?.list || []);
      } catch (err) {
        console.error("Failed to load tasks", err);
      } finally {
        setTaskLoading(false);
      }
    };

    loadTasks();
  }, [isOpen, account?.id, activeTab]);

  const ccOptions = (users || [])
    ?.filter((u) => u?.isActive)
    ?.map((u) => ({
      value: u.id,
      label: u.name || u.userName,
    }));
  const userOptions = (users || [])
    ?.filter((u) => u?.isActive)
    ?.map((u) => ({
      value: u.id,
      label: u.name || u.userName,
    }));

  const teamOptions = (team || [])?.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  // ✅ FIXED: Proper UPDATE payload with permission checks
  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const payload = {
        // Always updatable
        name: formData.name?.trim(),
        description: formData.description,

        // ✅ Only if user has permission to edit status
        ...(canEditStatus && { status: formData.status }),

        // Leave details can be updated
        leaveConsumed: Number(formData.leaveConsumed) || 0,
        leaveBalance: Number(formData.leaveBalance) || 0,
        leaveCreditsDeducted: Number(formData.leaveConsumed) || 0,

        // Dates can be updated
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,
        durationInMinutes: Number(formData.durationInMinutes) || null,

        // Assignment can be updated
        assignedUserId: formData.assignedUserId,
        teamsIds: Array.isArray(formData.teamsIds) ? formData.teamsIds : [],
        collaboratorsIds: Array.isArray(formData.collaboratorsIds)
          ? formData.collaboratorsIds
          : [],
      };

      await updateAttendance(account.id, payload);
      toast.success("Attendance request updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update attendance request");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ FIXED: Proper CREATE payload with permission-based status
  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      // Get current user email
      const user = JSON.parse(localStorage.getItem("login_object"));
      const applicantEmail = user?.email || "";

      // ✅ If user cannot edit status, default to "Pending"
      const statusValue = canEditStatus ? formData.status : "Pending";

      const payload = {
        // Basic Info (Required)
        name: formData.name?.trim(),
        department: formData.department,
        employeeCode: formData.employeeCode,

        // Request Details (Required)
        requestType: formData.requestType,
        status: statusValue, // ✅ Conditional based on permission
        date: formData.startDate,
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,

        // Leave Details
        leaveBalance: Number(formData.leaveBalance) || 0,
        leaveConsumed: Number(formData.leaveConsumed) || 0,
        leaveCreditsDeducted: Number(formData.leaveConsumed) || 0,

        // Duration (optional)
        durationInMinutes: Number(formData.durationInMinutes) || null,

        // Description & Notes
        description: formData.description || "",
        rejectionReason: null,

        // Assignment
        assignedUserId: formData.assignedUserId,
        teamsIds: Array.isArray(formData.teamsIds) ? formData.teamsIds : [],
        collaboratorsIds: Array.isArray(formData.collaboratorsIds)
          ? formData.collaboratorsIds
          : [],

        // Meta Fields
        applicantEmail: applicantEmail,
        jobDesignation: [],
        selfRejected: false,
      };

      console.log("CREATE ATTENDANCE PAYLOAD", payload);

      await createNewAttendance(payload);
      // Show the premium success modal; the drawer's onSuccess/onClose run when
      // the user dismisses it via "Got It" (see handleSuccessModalClose).
      setSuccessType(formData.requestType);
    } catch (err) {
      console.error("Create failed:", err);
      toast.error(err?.message || "Failed to create attendance request");
    } finally {
      setIsSaving(false);
    }
  };

  // Dismiss the success modal, then run the original post-create flow.
  const handleSuccessModalClose = () => {
    setSuccessType(null);
    onSuccess();
    onClose();
  };

  const handleSave = () => {
    // Route on record identity, not on UI mode flags that can drift out of sync.
    if (account?.id) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString)?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "call":
        return "Phone";
      case "email":
        return "Mail";
      case "meeting":
        return "Calendar";
      default:
        return "Activity";
    }
  };

  const getStageColor = (stage) => {
    switch (stage?.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "qualified":
        return "bg-yellow-100 text-yellow-800";
      case "proposal":
        return "bg-purple-100 text-purple-800";
      case "won":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStreamIcon = (type = "") => {
    switch (type) {
      case "Post":
        return "MessageSquare";
      case "Update":
        return "RefreshCcw";
      case "CreateRelated":
        return "Link";
      default:
        return "Activity";
    }
  };

  const getStreamIconColor = (type = "") => {
    switch (type) {
      case "Post":
        return "text-indigo-600";
      case "Update":
        return "text-blue-600";
      case "CreateRelated":
        return "text-purple-600";
      default:
        return "text-gray-500";
    }
  };

  const getStreamMessage = (item) => {
    if (item.type === "Post") return item.post;
    if (item.type === "Update" && item.data?.value)
      return `Status updated to ${item.data.value}`;
    if (item.type === "CreateRelated") return "Activity updated";
    return "Activity updated";
  };

  const createStream = async () => {
    setShowStreamForm(true);
  };

  const handlePostStream = async (e) => {
    e.preventDefault();

    if (!streamText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setPostingStream(true);

      const payload = {
        post: streamText,
        parentId: account.id,
        parentType: "Account",
        type: "Post",
        isInternal: false,
        attachmentsIds: [],
      };

      const newStream = await createAccStream(payload);

      setStreams((prev) => [newStream, ...prev]);

      setStreamText("");
      setShowStreamForm(false);
      toast.success("Comment added successfully");
    } catch (err) {
      console.error("Failed to post stream", err);
      toast.error("Failed to post activity");
    } finally {
      setPostingStream(false);
    }
  };

  const toggleActivity = (id) => {
    setExpandedActivityId((prev) => (prev === id ? null : id));
  };

  const toggleMassField = (key) => {
    setMassFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "create") {
      setDrawerMode("create");
      setIsEditing(false);
      setActiveTab("overview");

      // ✅ Initialize with default status based on permission
      const defaultStatus = canEditStatus ? "Pending" : "Pending";

      setFormData((prev) => ({
        ...prev,
        status: defaultStatus,
        name: "",
        department: "",
        employeeCode: "",
        requestType: "",
        startDate: "",
        endDate: "",
        leaveBalance: 0,
        leaveConsumed: 0,
        description: "",
        assignedUserId: "",
        teamsIds: [],
        collaboratorsIds: [],
      }));

      // ✅ Add current user as collaborator
      const user = JSON.parse(localStorage.getItem("login_object"));
      if (user?.id) {
        setFormData((prev) => ({
          ...prev,
          collaboratorsIds: [user.id],
          applicantEmail: user?.email || "",
        }));
      }
    }

    if (mode === "edit") {
      setDrawerMode("edit");
      setIsEditing(true);
      setActiveTab("overview");
    }

    if (mode === "view") {
      setDrawerMode("view");
      setIsEditing(false);
      setActiveTab("overview");
    }
  }, [isOpen, mode, canEditStatus]);

  const handleBulkUpdate = (e) => {
    e.preventDefault();

    const payload = {};

    if (massFields.assignedUserId)
      payload.assignedUserId = formData.assignedUserId;

    if (massFields.teamId) payload.teamId = formData.teamId;

    if (!Object.keys(payload).length) {
      toast.error("Select at least one field");
      return;
    }

    onBulkUpdate(selectedIds, payload);
    onClose();
  };

  const handleDeleteTask = async (task) => {
    try {
      await deleteTasks(task.id);
      toast.success("Task deleted successfully");
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  const handleDeleteStream = async (id) => {
    try {
      await deleteAccStream(id);
      toast.success("Stream deleted successfully");
      setStreams((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete stream");
    }
  };

  const requestOption = [
    { value: "SLC", label: "Contribution Credit" },
    { value: "Short Leave", label: "Short Leave" },
    { value: "Leave", label: "Leave" },
    { value: "Half Day", label: "Half Day" },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}

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
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon
                  name="ClipboardList"
                  size={24}
                  className="text-primary"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {drawerMode === "create"
                    ? "Add Request"
                    : drawerMode === "edit"
                      ? "Edit Request"
                      : account?.name || "Request Details"}
                </h2>
                <h3 className="text-lg font-semibold text-foreground">
                  {drawerMode === "view" ? "Attendance Request Details" : ""}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {drawerMode !== "create" && !isMassUpdate && (
              <div className="flex border-b border-border overflow-x-scroll md:overflow-hidden ">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
          flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
          ${activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                      }
        `}
                  >
                    <Icon name={tab.icon} size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {drawerMode === "create" && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reason <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter reason"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department
                      {canEditDep ? (
                        <span className="text-destructive">*</span>
                      ) : (
                        <span className="text-muted-foreground text-xs ml-1">
                          (Read-only)
                        </span>
                      )}
                    </label>
                    <Input
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={!canEditDep}
                      placeholder={canEditDep ? "Enter department" : "No access"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Employee Code
                      {canEditEmpCode ? (
                        <span className="text-destructive">*</span>
                      ) : (
                        <span className="text-muted-foreground text-xs ml-1">
                          (Read-only)
                        </span>
                      )}
                    </label>
                    <Input
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleInputChange}
                      disabled={!canEditEmpCode}
                      placeholder={canEditEmpCode ? "Enter code" : "No access"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Request Type <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={formData.requestType}
                      options={requestOption}
                      onChange={(v) => handleChange("requestType", v)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Status
                      {canEditStatus ? (
                        <span className="text-destructive">*</span>
                      ) : (
                        <span className="text-muted-foreground text-xs ml-1">
                          (Auto: Pending)
                        </span>
                      )}
                    </label>
                    <Select
                      value={formData.status}
                      options={[
                        { value: "Pending", label: "Pending" },
                        { value: "Approved", label: "Approved" },
                        { value: "Rejected", label: "Rejected" },
                      ]}
                      onChange={(v) => handleChange("status", v)}
                      disabled={!canEditStatus}
                      placeholder={
                        canEditStatus ? "Select status" : "Pending (Fixed)"
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                  />

                  {formData.requestType === "Short Leave" && (
                    <Input
                      type="number"
                      label="Duration (Minutes)"
                      value={formData.durationInMinutes ?? ""}
                      onChange={(e) =>
                        handleChange("durationInMinutes", Number(e.target.value))
                      }
                    />
                  )}

                  {formData.requestType === "SLC" && (
                    <Input
                      type="number"
                      label="Duration (Minutes)"
                      value={formData.durationInMinutes ?? ""}
                      onChange={(e) =>
                        handleChange("durationInMinutes", Number(e.target.value))
                      }
                    />
                  )}
                </div>

                {formData.requestType === "Half Day" && (
                  <Input
                    type="number"
                    label="Leave Duration (Days)"
                    name="leaveConsumed"
                    value={formData.leaveConsumed ?? ""}
                    onChange={handleInputChange}
                  />
                )}

                {formData.requestType === "Leave" && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="End Date"
                      value={formData.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                    />

                    <Input
                      type="number"
                      label="Leave Duration (Days)"
                      name="leaveConsumed"
                      value={formData.leaveConsumed ?? ""}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* ✅ Assignment Section - Always editable for create */}
                <div className="grid grid-cols-2 gap-4 rounded-xl p-4 border border-[#7BC47F] shadow-sm hover:shadow-md transition bg-background">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reporting Manager
                    </label>
                    <Select
                      value={formData.assignedUserId || ""}
                      options={userOptions}
                      onChange={(v) =>
                        handleChange("assignedUserId", v)
                      }
                      placeholder="Select Reporting Manager"
                      searchable
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Teams
                    </label>
                    <Select
                      value={formData.teamsIds[0] || ""}
                      options={teamOptions}
                      onChange={(v) => handleChange("teamsIds", [v])}
                      placeholder="Select Team"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      CC
                    </label>
                    <ReactSelect
                      isMulti
                      closeMenuOnSelect={false}
                      components={animatedComponents}
                      options={ccOptions}
                      value={ccOptions.filter((opt) =>
                        formData.collaboratorsIds?.includes(opt.value)
                      )}
                      onChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          collaboratorsIds: (selected || []).map(
                            (opt) => opt.value
                          ),
                        }))
                      }
                      placeholder="Select CC users..."
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Saving..." : "Save Request"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isMassUpdate && (
              <form className="space-y-6" onSubmit={handleBulkUpdate}>
                <h3 className="text-lg font-semibold text-foreground">
                  Mass Update Accounts
                </h3>

                <p className="text-sm text-muted-foreground">
                  Updating {selectedIds.length} selected accounts
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {activeTab === "overview" &&
              (drawerMode === "view" || drawerMode === "edit") &&
              account && (
                <div className="space-y-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Editing Request
                          </p>
                          <h2 className="text-lg font-semibold text-foreground">
                            {formData?.name || "Attendance Request"}
                          </h2>
                        </div>

                        <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          {formData?.status || "Pending"}
                        </span>
                      </div>

                      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Basic Information
                        </h3>

                        <textarea
                          name="name"
                          value={formData?.name}
                          onChange={handleInputChange}
                          placeholder="Enter reason..."
                          className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary"
                        />

                        {/* ✅ Department - Disabled if no permission */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Department
                            {!canEditDep && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (Read-only)
                              </span>
                            )}
                          </label>
                          <Input
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            disabled
                            placeholder={canEditDep ? "" : "-"}

                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* ✅ Employee Code - Disabled if no permission */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Employee Code
                              {!canEditEmpCode && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (Read-only)
                                </span>
                              )}
                            </label>
                            <Input
                              name="employeeCode"
                              value={formData.employeeCode}
                              onChange={handleInputChange}
                              disabled
                              placeholder={canEditEmpCode ? "" : "No edit access"}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Request Type
                            </label>
                            <Select
                              value={formData?.requestType}
                              options={requestOption}
                              disabled={true} // Read-only in edit
                              onChange={(v) => handleChange("requestType", v)}
                            />
                          </div>
                        </div>

                        {/* ✅ Status - Editable only with permission */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Status
                            {!canEditStatus && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (Read-only)
                              </span>
                            )}
                          </label>
                          <Select
                            value={formData.status}
                            options={[
                              { value: "Pending", label: "Pending" },
                              { value: "Approved", label: "Approved" },
                              { value: "Rejected", label: "Rejected" },
                            ]}
                            disabled={!canEditStatus}
                            onChange={(v) => handleChange("status", v)}
                          />
                        </div>
                      </div>

                      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Leave Duration
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                          <Input
                            type="date"
                            label="Start Date"
                            value={formData.startDate}
                            onChange={(e) =>
                              handleChange("startDate", e.target.value)
                            }
                          />

                          <Input
                            type="date"
                            label="End Date"
                            value={formData.endDate}
                            onChange={(e) =>
                              handleChange("endDate", e.target.value)
                            }
                          />

                          {["Short Leave", "SLC"].includes(formData.requestType) ? (
                            <Input
                              name="durationInMinutes"
                              label="Duration (Minutes)"
                              type="number"
                              value={formData.durationInMinutes ?? ""}
                              onChange={(e) =>
                                handleChange("durationInMinutes", Number(e.target.value))
                              }
                            />
                          ) : (
                            <Input
                              name="leaveConsumed"
                              label="Days"
                              type="number"
                              value={formData.leaveConsumed ?? ""}
                              onChange={handleInputChange}
                            />
                          )}
                        </div>

                        <Input
                          name="leaveBalance"
                          label="Leave Balance"
                          type="number"
                          value={formData.leaveBalance}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>

                      <div className="bg-background border border-border rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Description
                        </h3>

                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Assignment
                        </h3>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Reporting Manager
                          </label>

                          <Select
                            value={formData.assignedUserId || ""}
                            options={userOptions}
                            onChange={(v) =>
                              handleChange("assignedUserId", v)
                            }
                            placeholder="Select Reporting Manager"
                            searchable
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Teams
                          </label>

                          <Select
                            value={formData.teamsIds[0] || ""}
                            options={teamOptions}
                            onChange={(v) => handleChange("teamsIds", [v])}
                            placeholder="Select Team"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            CC
                          </label>

                          <ReactSelect
                            isMulti
                            options={ccOptions}
                            value={ccOptions.filter((opt) =>
                              formData.collaboratorsIds?.includes(opt.value)
                            )}
                            onChange={(selected) =>
                              setFormData((prev) => ({
                                ...prev,
                                collaboratorsIds: (selected || []).map(
                                  (opt) => opt.value
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={handleSave}
                          className="flex-1 bg-primary hover:bg-primary/90 shadow-md"
                          disabled={isSaving}
                        >
                          {isSaving ? "Updating..." : "Update Request"}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-gradient-to-br from-background to-muted/30 border border-border rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Reason
                            </p>
                            <h2 className="text-xl font-semibold text-foreground">
                              {account?.name || "N/A"}
                            </h2>
                          </div>

                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full
        ${getStageColor(account?.status)}`}
                          >
                            {account?.status || "Pending"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Department
                            </p>
                            <p className="font-medium text-foreground">
                              {account?.department || "None"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Employee Code
                            </p>
                            <p className="font-medium text-foreground">
                              {account?.employeeCode || "0"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Request Type
                            </p>
                            <p className="font-medium text-foreground">
                              {account?.requestType || "None"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Leave Balance
                            </p>
                            <p className="font-medium text-foreground">
                              {account?.leaveBalance || "0"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-xs text-muted-foreground">
                              Start Date
                            </p>
                            <p className="font-semibold text-foreground">
                              {formatDate(account?.startDate)}
                            </p>
                          </div>

                          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-xs text-muted-foreground">
                              End Date
                            </p>
                            <p className="font-semibold text-foreground">
                              {formatDate(account?.endDate)}
                            </p>
                          </div>

                          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                            <p className="text-xs text-muted-foreground">
                              Duration
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {["Short Leave", "SLC"].includes(account?.requestType)
                                ? `${account?.durationInMinutes || 0} minutes`
                                : `${account?.leaveConsumed || 0} days`}
                            </p>
                          </div>
                        </div>

                        <div className="bg-muted/40 border border-border rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-2">
                            Description
                          </p>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                            {account?.description || "No description provided"}
                          </p>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}

            {activeTab === "contacts" && (
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-background to-muted/30 border border-border rounded-2xl p-7 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold tracking-wide text-foreground">
                      Assignment Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Reporting Manager
                      </p>

                      {account?.assignedUserName ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold shadow-sm hover:shadow transition">
                          <span className="text-base">👤</span>
                          {account.assignedUserName}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">None</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Teams
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {account?.teamsIds?.length ? (
                          account.teamsIds.map((id) => (
                            <span
                              key={id}
                              className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold shadow-sm hover:shadow transition"
                            >
                              {account?.teamsNames?.[id]}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">CC</p>

                      <div className="flex flex-wrap gap-2">
                        {account?.collaboratorsIds?.length ? (
                          account.collaboratorsIds.map((id) => (
                            <span
                              key={id}
                              className="px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold shadow-sm hover:shadow transition"
                            >
                              {account?.collaboratorsNames?.[id]}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border my-2" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Created
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {formatDateTime(account?.createdAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        by{" "}
                        <span className="font-medium text-foreground">
                          {account?.createdByName}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Last Updated
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {formatDateTime(account?.modifiedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "task" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Active Tasks
                  </h3>
                </div>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <img
                        src="/public/assets/images/check.png"
                        alt="No Tasks"
                        className="w-40 opacity-80"
                      />
                      <p className="mt-3 text-sm text-muted-foreground">
                        Currently you don't have any tasks
                      </p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="relative rounded-xl border-l-4 border-l-[#A3D9A5] border border-border bg-background p-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {task.name}
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                              Start Date: {formatDate(task.dateStart)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Assigned: {task.assignedUserName || "—"}
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-5">
                            {task.status && (
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStageColor(
                                  task.status
                                )}`}
                              >
                                {task.status}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-red-50"
                              onClick={() => handleDeleteTask(task)}
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "stream" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">
                    Recent Stream
                  </h3>

                  <Button size="sm" variant="outline" onClick={createStream}>
                    <Icon name="Plus" size={16} className="mr-1" />
                    Add Stream
                  </Button>
                </div>

                {showStreamForm && (
                  <form onSubmit={handlePostStream} className="space-y-2">
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      rows={4}
                      placeholder="Write your comment..."
                      value={streamText}
                      onChange={(e) => setStreamText(e.target.value)}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowStreamForm(false);
                          setStreamText("");
                        }}
                      >
                        Cancel
                      </Button>

                      <Button
                        type="submit"
                        size="sm"
                        disabled={postingStream}
                      >
                        {postingStream ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </form>
                )}

                {streams?.list && streams.list.length > 0 ? (
                  streams.list.map((item) => (
                    <div
                      key={item.id}
                      className="flex space-x-3 p-4 bg-muted/30 rounded-lg group"
                    >
                      <Avatar
                        name={item.createdByName || "System"}
                        size="36"
                        round
                        textSizeRatio={2}
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground">
                              {item.createdByName || "System"}
                            </h4>

                            <Icon
                              name={getStreamIcon(item.type)}
                              size={14}
                              className={getStreamIconColor(item.type)}
                            />

                            <span className="text-xs text-muted-foreground">
                              {item.type}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.createdAt)}
                            </span>

                            <div className="opacity-0 group-hover:opacity-100 transition">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Icon name="Edit" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStream(item.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Icon name="Trash2" size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {getStreamMessage(item)}
                        </p>

                        {item.data?.value && (
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStageColor(
                              item.data.value
                            )}`}
                          >
                            {item.data.value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <img
                      src="/public/assets/images/comment.png"
                      alt="No Comments"
                      className="w-40 opacity-80"
                    />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Currently you don't have any comments
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "activities" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Activities
                  </h3>
                </div>

                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const isOpen = expandedActivityId === activity.id;

                    return (
                      <div
                        key={activity.id}
                        onClick={() => toggleActivity(activity.id)}
                        className="cursor-pointer rounded-lg bg-muted/30 p-4 transition hover:bg-muted/50"
                      >
                        <div className="flex gap-3">
                          <Avatar
                            name={activity.assignedUserName || "System"}
                            size="36"
                            round
                          />

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-medium text-foreground">
                                {activity.name || "Activity"}
                              </h4>

                              <span className="text-xs text-muted-foreground">
                                {activity._scope}
                              </span>

                              {activity.status && (
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${getStageColor(
                                    activity.status
                                  )}`}
                                >
                                  {activity.status}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon name="Clock" size={12} />
                                {formatDateTime(activity.dateStart)}
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

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen
                            ? "max-h-[500px] opacity-100 mt-4"
                            : "max-h-0 opacity-0"
                            }`}
                        >
                          <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Direction
                              </p>
                              <p className="font-medium">
                                {activity.direction || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Assigned User
                              </p>
                              <p className="font-medium">
                                {activity.assignedUserName || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Start
                              </p>
                              <p className="font-medium">
                                {formatDateTime(activity.dateStart)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                End
                              </p>
                              <p className="font-medium">
                                {formatDateTime(activity.dateEnd)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Created
                              </p>
                              <p className="font-medium">
                                {formatDateTime(activity.createdAt)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Parent
                              </p>
                              <p className="font-medium text-primary">
                                {activity.parentType}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
        </div>
      </div>

      {/* Premium success modal — appears after a request is created */}
      <AttendanceSuccessModal
        isOpen={!!successType}
        requestType={successType}
        onClose={handleSuccessModalClose}
      />
    </>
  );
};

export default AttendanceDrawer;