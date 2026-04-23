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
  createAccount,
  createAccStream,
  deleteAccStream,
  fetchContactByAccount,
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
import { useCalenderById } from "hooks/useCalender";
import { createNewAttendance, updateAttendance } from "services/calender.service";
const AttendanceDrawer = ({
  data,
  accType,
  industry,
  accounts,
  isOpen,
  onClose,
  mode = "view",
  onSuccess,
  onBulkUpdate,
  selectedIds = [],
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(accounts || {});
  const [drawerMode, setDrawerMode] = useState(mode);
  const [streams, setStreams] = useState([]);
  const [streamLoading, setStreamLoading] = useState(false);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [postingStream, setPostingStream] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

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
  console.log("entering inside fetc", account);
  // Form state for create/edit mode
  const [formData, setFormData] = useState({
    name: "", // reason
    department: "",
    employeeCode: "",
    requestType: "",
    status: "Pending",
    startDate: "",
    endDate: "",
    // leaveBalance: 0,
    // leaveConsumed: 0,
    description: "",
    reportingManagerEmail: "",
    teamsIds: [],
    collaboratorsIds: []
  });
  useEffect(() => {
    if (account && (drawerMode === "view" || drawerMode === "edit")) {
      setFormData({
        name: account?.name || "",
        department: account?.department || "",
        employeeCode: account?.employeeCode || "",
        requestType: account?.requestType || "",
        status: account?.status || "Pending",
        startDate: account?.startDate || "",
        endDate: account?.endDate || "",
        // leaveBalance: account?.leaveBalance || 0,
        // leaveConsumed: account?.leaveConsumed || 0,
        description: account?.description || "",
        reportingManagerEmail: account?.reportingManagerEmail || "",
        teamsIds: account?.teamsIds || [],
        collaboratorsIds: account?.collaboratorsIds || []
      });
    }
  }, [account, drawerMode]);
  useEffect(() => {
    if (!isOpen || !account?.id || activeTab !== "stream") return;

    const loadStream = async () => {
      try {
        setStreamLoading(true);
        const res = await fetchAccStreamById(account.id);
        console.log("ACCOUNT STREAM:", res);
        setStreams(res.list || []);
      } catch (err) {
        console.error("Failed to load account stream", err);
      } finally {
        setStreamLoading(false);
      }
    };

    loadStream();
  }, [isOpen, account?.id, activeTab]);

  const formatDateTime = (value) => {
    if (!value) return "—";

    // backend format: "YYYY-MM-DD HH:mm:ss"
    const safeValue = value.replace(" ", "T"); // ISO safe
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
    // Reset form data to original account data
    if (account) {
      setFormData({
        name: account?.name || "",
        website: account?.website || "",
        industry: account?.industry || "",
        phoneNumber: account?.phoneNumber || "",
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
      alert("Account name is required");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const loadData = async (id) => {
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

  useEffect(() => {
    if (!isOpen || !account?.id || activeTab !== "contacts") return;

    const loadContacts = async () => {
      try {
        setContactLoading(true);
        const res = await fetchContactByAccount(account.id);
        setContacts(res?.list || []);
      } catch (err) {
        console.error("Failed to load contacts", err);
      } finally {
        setContactLoading(false);
      }
    };

    loadContacts();
  }, [isOpen, account?.id, activeTab]);

  const userOptions = (users || [])?.filter((u) => u?.isActive) // ✅ only active users
    ?.map((u) => ({
      value: u.id,
      label: u.name || u.userName,
    }));
  const teamOptions = (team || [])?.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const IndustryOptions = (industry || []).filter((item) => item !== "")
    .map((item) => ({
      value: item,
      label: item,
    }));
  const accountType = (accType || []).filter((item) => item !== "")
    .map((item) => ({
      value: item,
      label: item,
    }));

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      const payload = { ...formData };

      console.log("UPDATE ACCOUNT PAYLOAD", payload);
      console.log("UPDATE versionNumber", account?.versionNumber);

      await updateAttendance(account.id, payload);

      onSuccess(); // refresh table
      onClose(); // close drawer
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update account");
    }
  };
  const handleCreate = async () => {
    try {
      const payload = {
        name: formData.name,
        department: formData.department,
        employeeCode: formData.employeeCode,
        requestType: formData.requestType,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        leaveBalance: Number(formData.leaveBalance),
        leaveConsumed: Number(formData.leaveConsumed),
        description: formData.description,
        reportingManagerEmail: formData.reportingManagerEmail,
        teamsIds: formData.teamsIds,
        collaboratorsIds: formData.collaboratorsIds
      };

      console.log("CREATE ATTENDANCE PAYLOAD", payload);

      await createNewAttendance(payload);

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = () => {
    if (drawerMode === "edit") {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const handleCancel = () => {
    setEditData(account);
    setIsEditing(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(parseFloat(value?.replace(/[$,]/g, "")) || 0);
  };

  const formatDate = (dateString) => {
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
    //post activity
    setShowStreamForm(true);
  };

  const handlePostStream = async (e) => {
    e.preventDefault();

    if (!streamText.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    try {
      setPostingStream(true);

      const payload = {
        post: streamText,
        parentId: account.id, // ✅ ACCOUNT ID
        parentType: "Account", // ✅ IMPORTANT
        type: "Post",
        isInternal: false,
        attachmentsIds: [],
      };

      const newStream = await createAccStream(payload);

      // 🔥 Instantly update UI
      setStreams((prev) => [newStream, ...prev]);

      setStreamText("");
      setShowStreamForm(false);
    } catch (err) {
      console.error("Failed to post stream", err);
      alert("Failed to post activity");
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

    if (mode === "mass-update") {
      setDrawerMode("mass-update");
      setIsEditing(false);
      setActiveTab(null); // no tabs in mass update

      // reset form for bulk update
      setFormData({
        assignedUserId: "",
        industry: "",
        type: "",
        teamId: "",
      });

      setMassFields({
        assignedUserId: false,
        industry: false,
        type: false,
        teamId: false,
      });
    }

    if (mode === "create") {
      setDrawerMode("create");
      setIsEditing(false);
      setActiveTab("overview");
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
  }, [isOpen, mode]);

  const handleBulkUpdate = (e) => {
    e.preventDefault();

    const payload = {};

    if (massFields.assignedUserId)
      payload.assignedUserId = formData.assignedUserId;

    if (massFields.industry) payload.industry = formData.industry;

    if (massFields.type) payload.type = formData.type;

    if (massFields.teamId) payload.teamId = formData.teamId;

    if (!Object.keys(payload).length) {
      toast.error("Select at least one field");
      return;
    }

    onBulkUpdate(selectedIds, payload);
    onClose();
  };
  const handleUnlinkContact = async (contact) => {
    try {
      await unlinkContactFromAccount(contact.id);

      toast.success("Contact unlinked from account");

      // remove contact from UI list
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to unlink contact");
    }
  };
  const handleDeleteTask = async (task) => {
    try {
      await deleteTasks(task.id);

      toast.success("Task Delete.");

      // remove contact from UI list
      setContacts((prev) => prev.filter((c) => c.id !== task.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };
  const handleDeleteStream = async (id) => {
    try {
      await deleteAccStream(id);
      toast.success("Stream Delete.");
      setStreams((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Stream");
    }
  };

  const requestType = [
    { value: "Contribution Credit", label: "Contribution Credit" },
    { value: "Short Leave", label: "Short Leave" },
    { value: "Leave", label: "Leave" },
    { value: "Half Day", label: "Half Day" }
  ];
  const handleFieldListChange = (selectedOptions) => {
    const ids = (selectedOptions || []).map(opt => opt.value);

    setFormData(prev => ({
      ...prev,
      collaboratorsIds: ids
    }));
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
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Building2" size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {drawerMode === "create"
                    ? "Add Request"
                    : drawerMode === "edit"
                      ? "Edit Request"
                      : account?.company}
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
            {/* Tabs */}
            {/* Tabs */}
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
                    </label>
                    <Input
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Employee Code
                    </label>
                    <Input
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Request Type
                    </label>
                    <Select
                      value={formData.requestType}
                      options={requestType}
                      onChange={(v) => handleChange("requestType", v.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Status
                    </label>
                    <Select
                      value={formData.status}
                      options={[
                        { value: "Pending", label: "Pending" },
                        { value: "Approved", label: "Approved" },
                        { value: "Rejected", label: "Rejected" }
                      ]}
                      onChange={(v) => handleChange("status", v.value)}
                    />
                  </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="date"
                      label="Start Date"
                      value={formData.startDate}
                      onChange={(e) => handleChange("startDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      label="End Date"
                      value={formData.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Leave Balance
                    </label>
                    <Input
                      name="leaveBalance"
                      type="number"
                      value={formData.leaveBalance}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Leave Duration (Total Number of Days)
                    </label>
                    <Input
                      name="leaveConsumed"
                      type="number"
                      value={formData.leaveConsumed}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

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

                <div className="grid grid-cols-2 gap-4 rounded-xl p-4 border border-[#7BC47F] shadow-sm hover:shadow-md transition bg-background">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reporting Manager
                    </label>
                    <Select
                      value={formData.reportingManagerEmail || ""}
                      options={userOptions}
                      onChange={(v) => {
                        const user = users.find(u => u.id === v);
                        handleChange("reportingManagerEmail", user?.email);
                      }}
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
                      options={userOptions}
                      value={formData.fieldList}
                      onChange={handleFieldListChange}
                      placeholder="Select Field List..."
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "42px",
                          borderColor: state.isFocused ? "#a3d9a5" : "#a3d9a5",
                          boxShadow: "none",
                          "&:hover": { borderColor: "#6366f1" },
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: "#EEF2FF",
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: "#000",
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: "#e8a8a0",
                          ":hover": {
                            backgroundColor: "#e8a8a0",
                            color: "#fff",
                          },
                        }),
                      }}
                    />
                  </div>
                </div>


                <div className="flex items-center space-x-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading
                      ? "Saving..."
                      : drawerMode === "edit"
                        ? "Update Account"
                        : "Save Account"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={drawerMode === "edit" ? handleCancelEdit : onClose}
                    disabled={isLoading}
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

                  {/* Industry */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.industry}
                      onChange={() => toggleMassField("industry")}
                    />
                    <Select
                      label="Industry"
                      name="industry"
                      value={formData.industry || ""}
                      options={IndustryOptions}
                      onChange={(value) =>
                        handleSelectChange("industry", value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.type}
                      onChange={() => toggleMassField("type")}
                    />
                    <Select
                      label="Type"
                      value={formData.type}
                      options={accountType}
                      disabled={!massFields.type}
                      onChange={(v) => handleChange("type", v)}
                    />
                  </div>

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

            {activeTab === "overview" &&
              (drawerMode === "view" || drawerMode === "edit") &&
              account && (
                <div className="space-y-6">
                  {/* Key Metrics */}

                  {/* Account Details update*/}
                  <div className="space-y-4">
                    {isEditing ? (
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Reason <span className="text-destructive">*</span>
                          </label>
                          <textarea
                            name="name"
                            value={formData?.name}
                            onChange={handleInputChange}
                            placeholder="Acme Corporation"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Department
                          </label>
                          <Input
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Employee Code
                            </label>
                            <Input
                              name="employeeCode"
                              value={formData.employeeCode}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Request Type
                            </label>
                            <Select
                              name="requestType"
                              value={formData.requestType || ""}
                              options={requestType}
                              onChange={(v) =>
                                handleSelectChange("requestType", v.value)
                              }
                              placeholder="Select Team"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Status
                          </label>
                          <Select
                            name="status"
                            value={formData.status || ""}
                            options={[
                              { value: "Pending", label: "Pending" },
                              { value: "Approved", label: "Approved" },
                              { value: "Rejected", label: "Rejected" }
                            ]}
                            onChange={(value) =>
                              handleSelectChange("status", value)
                            }
                            placeholder="status"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Input
                              type="date"
                              label="Start Date"
                              value={formData.startDate}
                              onChange={(e) => handleChange("startDate", e.target.value)}
                            />
                          </div>
                          <div>
                            <Input
                              type="date"
                              label="End Date"
                              value={formData.endDate}
                              onChange={(e) => handleChange("endDate", e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Leave Balance
                          </label>
                          <Input
                            name="leaveBalance"
                            type="number"
                            value={formData.leaveBalance}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Leave Duration (Total Number of Days)
                          </label>
                          <Input
                            name="leaveConsumed"
                            type="number"
                            value={formData.leaveConsumed}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="col-span-2">
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Reporting Manager
                          </label>
                          <Select
                            value={formData.reportingManagerEmail || ""}
                            options={userOptions}
                            onChange={(v) => {
                              const user = users.find(u => u.id === v);
                              handleChange("reportingManagerEmail", user?.email);
                            }}
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
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            CC
                          </label>
                          <ReactSelect
                            isMulti
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            options={userOptions}
                            value={formData.fieldList}
                            onChange={handleFieldListChange}
                            placeholder="Select Field List..."
                            classNamePrefix="react-select"
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                minHeight: "42px",
                                borderColor: state.isFocused ? "#a3d9a5" : "#a3d9a5",
                                boxShadow: "none",
                                "&:hover": { borderColor: "#6366f1" },
                              }),
                              multiValue: (base) => ({
                                ...base,
                                backgroundColor: "#EEF2FF",
                              }),
                              multiValueLabel: (base) => ({
                                ...base,
                                color: "#000",
                                fontWeight: 500,
                              }),
                              multiValueRemove: (base) => ({
                                ...base,
                                color: "#e8a8a0",
                                ":hover": {
                                  backgroundColor: "#e8a8a0",
                                  color: "#fff",
                                },
                              }),
                            }}
                          />
                        </div>

                        <div className="flex items-center space-x-3 pt-4">
                          <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            {isLoading
                              ? "Saving..."
                              : drawerMode === "edit"
                                ? "Update Account"
                                : "Save Account"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={
                              drawerMode === "edit" ? handleCancelEdit : onClose
                            }
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* ================= Overview ================= */}
                        <div className="border border-border rounded-xl p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">
                                Reason
                              </p>
                              <p className="text-foreground font-medium">
                                {account?.name || "None"}
                              </p>
                            </div>

                            {/* Website */}
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Department
                              </p>
                              <a
                                href={account?.department}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all"
                              >
                                {account?.department || "None"}
                              </a>
                            </div>

                            {/* Email */}
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Employee Code
                              </p>
                              <p className="text-foreground">
                                {account?.employeeCode || "None"}
                              </p>
                            </div>

                            {/* Phone */}
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Request Type
                              </p>
                              <p className="text-foreground">
                                {account?.requestType || "None"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Status
                              </p>
                              <p className="text-foreground">
                                {account?.status || "None"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Start Date
                              </p>
                              <p className="text-foreground font-medium">
                                {account?.startDate || "None"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                End Date
                              </p>
                              <p className="text-foreground font-medium">
                                {account?.endDate || "None"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Leave Balance
                              </p>
                              <p className="text-foreground font-medium">
                                {account?.leaveBalance || "None"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Leave Duration
                              </p>
                              <p className="text-foreground font-medium">
                                {account?.leaveConsumed || "None"}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-muted-foreground">
                                Description
                              </p>
                              <p className="text-foreground leading-relaxed">
                                {account?.description || "None"}
                              </p>
                            </div>
                          </div>
                        </div>


                      </div>
                    )}
                  </div>
                </div>
              )}

            {activeTab === "contacts" && (
              <div className="space-y-4">
                {/* ================= Details ================= */}
                <div className="border border-border rounded-xl p-6">


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Type */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Reporting Manager
                      </p>
                      <p className="text-foreground font-medium">
                        {account?.assignedUserName || "None"}
                      </p>
                    </div>

                    {/* Industry */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Team Names
                      </p>
                      <p className="text-foreground font-medium">
                        {account?.teamsIds?.length
                          ? account.teamsIds
                            .map((id) => account?.teamsNames?.[id])
                            .filter(Boolean)
                            .join(", ")
                          : "None"}
                      </p>
                    </div>
                    {/* Industry */}
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        CC
                      </p>
                      <p className="text-foreground font-medium">
                        {account?.collaboratorsIds?.length
                          ? account.collaboratorsIds
                            .map((id) => account?.collaboratorsNames?.[id])
                            .filter(Boolean)
                            .join(", ")
                          : "None"}
                      </p>
                    </div>
                    {/* Industry */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Created
                      </p>
                      <p className="text-foreground font-medium">
                        {formatDateTime(account?.createdAt)}{" : "}{account?.createdByName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Modified At
                      </p>
                      <p className="text-foreground font-medium">
                        {formatDateTime(account?.modifiedAt)}
                      </p>
                    </div>

                    {/* Description */}

                  </div>
                </div>

              </div>
            )}

            {activeTab === "task" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Active Task
                  </h3>
                </div>

                <div className="space-y-3">
                  {tasks.lenght === 0 ? (
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
                                  task.status,
                                )}`}
                              >
                                {task.status}
                              </span>
                            )}
                            {/* Delete */}
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
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <img
                        src="/public/assets/images/check.png"
                        alt="No Activities"
                        className="w-40 opacity-80"
                      />
                      <p className="mt-3 text-sm text-muted-foreground">
                        Currently you don't have any task
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "stream" && (
              <div className="space-y-4">
                {/* Header */}
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

                      <Button type="submit" size="sm" disabled={postingStream}>
                        {postingStream ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Stream List */}
                {streams.lenght > 0 ? (
                  streams?.map((item) => (
                    <div
                      key={item.id}
                      className="flex space-x-3 p-4 bg-muted/30 rounded-lg group"
                    >
                      {/* Avatar */}
                      <Avatar
                        name={item.createdByName || "System"}
                        size="36"
                        round
                        textSizeRatio={2}
                      />

                      {/* Content */}
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

                            {/* Actions (hover only) */}
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

                        {/* Message */}
                        <p className="text-sm text-muted-foreground mt-1">
                          {getStreamMessage(item)}
                        </p>

                        {/* Status Badge */}
                        {item.data?.value && (
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStageColor(
                              item.data.value,
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
                      alt="No Activities"
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
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Activities
                  </h3>
                </div>

                {/* Activity List */}
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const isOpen = expandedActivityId === activity.id;

                    return (
                      <div
                        key={activity.id}
                        onClick={() => toggleActivity(activity.id)}
                        className="cursor-pointer rounded-lg bg-muted/30 p-4 transition hover:bg-muted/50"
                      >
                        {/* COLLAPSED HEADER */}
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

                        {/* EXPANDED CONTENT */}
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
    </>
  );
};

export default AttendanceDrawer;
