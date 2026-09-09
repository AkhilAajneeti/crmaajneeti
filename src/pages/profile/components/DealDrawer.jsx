import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import Avatar from "react-avatar";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { createLeadActivity, updateStream } from "services/leads.service";
import { useProfileById, useUserById, useUsers } from "hooks/useUsers";
import { useQueryClient } from "@tanstack/react-query";
import {
  canEdit,
  canEditField,
  canEditRecord,
  canReadField,
  getScopeLevel,
  hasFieldRule,
} from "utils/permissions";

// From /Metadata entityDefs.CProfileDetails.fields.shiftTimings.options
const SHIFT_TIMING_OPTIONS = [
  { value: "9 AM", label: "9 AM" },
  { value: "10 AM", label: "10 AM" },
  { value: "11 AM", label: "11 AM" },
];

// From /Metadata entityDefs.CProfileDetails.fields.organisation.options
const ORGANISATION_OPTIONS = [
  { value: "ACL", label: "ACL" },
  { value: "AAJneeti Advertising", label: "AAJneeti Advertising" },
];

// `profile` is type: "wysiwyg" in metadata, so it stores HTML.
const PROFILE_EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const DealDrawer = ({
  deal,
  isOpen,
  onClose,
  mode,
  onCreate,
  onUpdate,
  onDelete,
  onBulkUpdate,
  selectedIds = [],
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [activityText, setActivityText] = useState("");

  const [editingActivityId, setEditingActivityId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "+91",
    emailAddress: "",
    whatsapp: "",
    addressCity: "",
    cProjectName: "",
    cNextContactAt: "",
    cQuestion: "",
    assignedUserId: "",
    teamId: "",
    status: "",
    source: "",
    description: "",
    industry: "",
  });
  const queryClient = useQueryClient();
  const [bankData, setBankData] = useState({
    upiId: "",
    uanNo: "",
    name: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  });
  const ENTITY = "CProfileDetails";
  const { data: user, isLoading } = useProfileById(deal?.id, isOpen);

  // ── Two tiers of edit permission ─────────────────────────────────────────
  // They answer different questions and must not be collapsed into one flag:
  //
  //   1. RECORD level — may this user edit this record at all? Drives whether
  //      the Edit button appears.
  //   2. FIELD level  — inside edit mode, which fields may they change?
  //
  // Two users can both pass (1) and still differ on (2): HR and an employee
  // may both edit a profile, while only HR may change the appraisal dates.
  //
  // Previously this checked canEditRecord("User", user). `user` is a
  // CProfileDetails record, so it was resolving against the wrong entity's
  // ACL — harmless while both happened to be "own", but it blocks HR the
  // moment their role grants CProfileDetails edit:"all" (they are not the
  // assignedUser on anyone else's profile).
  const canEditThisRecord = canEdit(ENTITY) && canEditRecord(ENTITY, user);

  // Mirror of /Metadata entityDefs.CProfileDetails. These are structural
  // flags from the backend that NO role can override — `readOnly` fields are
  // `type: "foreign"` mirrors of the linked User record (edit User.cDepartment,
  // not this), and `readOnlyAfterCreate` locks once the record exists.
  // TODO: replace with a live /Metadata fetch so this can't drift.
  const META_READ_ONLY = [
    "name", "branch", "department", "designation", "email", "employeeCode",
    "leaveBalance", "mode", "phone", "salutationName", "subDepartment",
    "userName", "createdAt", "createdBy", "modifiedAt", "modifiedBy",
  ];
  const META_READ_ONLY_AFTER_CREATE = [
    "assignedUser", "documentBirthday", "empCode", "gender", "joiningDate",
  ];

  // ── Interim front-end-only field rules ───────────────────────────────────
  // These fields are absent from `acl.fieldTable.CProfileDetails`, and an
  // absent entry means *permitted* — so the ACL currently lets any employee
  // edit them on their own record. Until a role restriction exists in Espo,
  // hold them to HR here.
  //
  // "HR" is inferred from the ACL rather than a role name: employees hold
  // CProfileDetails edit:"own" (their own record only), HR holds "all". If
  // HR's role turns out to be "team", widen this one predicate.
  //
  // Each rule applies ONLY while the ACL is silent about that field —
  // `hasFieldRule()` hands control back to the backend the moment a role
  // defines it, so a stale local rule can never override a real grant.
  // `organisation` is deliberately absent: it already has a backend rule
  // ({read:"no", edit:"no"} for employees) and needs nothing here.
  const isHrScope = () => getScopeLevel(ENTITY, "edit") === "all";

  const INTERIM_FIELD_RULES = {
    profile: { read: isHrScope, edit: isHrScope },
    exitDate: { read: isHrScope, edit: isHrScope },
    fNFDate: { read: isHrScope, edit: isHrScope },
  };

  const interimRule = (field, action) => {
    const rule = INTERIM_FIELD_RULES[field]?.[action];
    // A backend rule always wins over the interim one.
    if (!rule || hasFieldRule(ENTITY, field)) return null;
    return rule;
  };

  // Field-level answer, with metadata taking precedence over the ACL: a role
  // can only ever narrow access, never unlock a structurally read-only field.
  const canEditFieldNow = (field) => {
    if (META_READ_ONLY.includes(field)) return false;
    if (META_READ_ONLY_AFTER_CREATE.includes(field) && mode !== "add") return false;
    if (!canEditThisRecord) return false;

    const interim = interimRule(field, "edit");
    if (interim) return interim();

    return canEditField(ENTITY, field);
  };

  const canReadFieldNow = (field) => {
    const interim = interimRule(field, "read");
    if (interim) return interim();

    return canReadField(ENTITY, field);
  };

  // const user = UserData|| [];
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

  // A default parameter only fills in for `undefined`. The API sends `null`
  // for an empty monthlyAttendanceSummary, which sailed past `= ""` and made
  // `summary.match()` throw — blanking the whole profile page for any record
  // that has no summary yet. Normalise the value instead of defaulting it.
  const parseAttendance = (summary) => {
    const text = typeof summary === "string" ? summary : "";

    const getValue = (label) => {
      const regex = new RegExp(`${label}:\\s*([^\\n]*)`);
      const match = text.match(regex);
      return match ? match[1].trim() : "—";
    };

    return {
      month: getValue("Month"),
      leavesTaken: getValue("Leaves Taken"),
      salaryDeduction: getValue("Salary Deduction"),
      contribution: getValue("Contribution credit"),
      nextBalance: getValue("New Leave Balance for Next Month"),
      Discription: getValue("TimeStamp"),
    };
  };
  const attendance = parseAttendance(user?.monthlyAttendanceSummary);


  const handleEditActivity = (activity) => {
    setEditingActivityId(activity.id);
    setActivityText(activity.post || "");
    setActivityForm(true);
  };
  const toggleActivity = (id) => {
    setExpandedActivityId((prev) => (prev === id ? null : id));
  };
  // const showForm = mode === "add" || isEditing;
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
    { id: "BankDetails", label: "Bank Details", icon: "Users" },
    { id: "MonthlyAttendance", label: "Monthly Attendance", icon: "Users" },
    { id: "AssignedUsers", label: "Assigned User", icon: "Users" }
  ];

  const toEspoDateTime = (value) => {
    if (!value) return null;

    // already Espo format → do nothing
    if (value.includes(" ")) {
      return value;
    }

    // from datetime-local input
    return value.replace("T", " ") + ":00";
  };

  // Same null-vs-undefined trap as parseAttendance above: `description` comes
  // back null for a profile with no bank details, and `= ""` doesn't catch it.
  const parseBankDetails = (description) => {
    const text = typeof description === "string" ? description : "";

    const getValue = (label) => {
      const regex = new RegExp(`${label}:\\s*([^\\n]*)`);
      const match = text.match(regex);
      const value = match ? match[1].trim() : "";

      // prevent picking next label
      if (/^[A-Za-z ]+:$/.test(value)) return "";

      return value;
    };

    return {
      upiId: getValue("UPI ID"),
      uanNo: getValue("UAN No"),
      name: getValue("Name"),
      bankName: getValue("Bank Name"),
      accountNumber: getValue("Account Number"),
      ifsc: getValue("IFSC"),
    };
  };

  // ✅ Load data
  useEffect(() => {
    if (deal?.description) {
      setBankData(parseBankDetails(deal.description));
    }
  }, [deal]);

  useEffect(() => {
    if (mode === "edit") {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [mode]);
  // ✅ Build description
  const buildDescription = () => {
    return `UPI ID: ${bankData.upiId}
UAN No: ${bankData.uanNo}
Name: ${bankData.name}
Bank Name: ${bankData.bankName}
Account Number: ${bankData.accountNumber}
IFSC: ${bankData.ifsc}`;
  };

  // ✅ Save
  const buildUpdatePayload = () => {
    if (!user) return {};

    const {
      id,
      createdAt,
      modifiedAt,
      modifiedById,
      modifiedByName,
      ...rest
    } = user;

    return {
      ...rest,

      // ✅ Bank details
      description: buildDescription(),

      // ✅ Overview fields (ONLY override if changed)
      name: formData.name || user.name,
      // `email` / `phone` are readOnly foreign fields — not overridden here.
      officialGmail: formData.officialGmail ?? user.officialGmail,
      gender: formData.gender || user.gender,
      designation: formData.designation || user.designation,
      empCode: formData.empCode || user.empCode,
      department: formData.department || user.department,
      subDepartment: formData.subDepartment || user.subDepartment,
      branch: formData.branch || user.branch,
      mode: formData.mode || user.mode,
      personalEmail: formData.personalEmail || user.personalEmail,
      personalMobile: formData.personalMobile || user.personalMobile,
      lastAppraisalDate:
        formData.lastAppraisalDate || user.lastAppraisalDate,
      nextAppraisalDate:
        formData.nextAppraisalDate || user.nextAppraisalDate,
      joiningDate: formData.joiningDate || user.joiningDate,
      shiftTimings: formData.shiftTimings || user.shiftTimings,
      localAddress: formData.localAddress || user.localAddress,
      permanentAddress:
        formData.permanentAddress || user.permanentAddress,
      birthday: formData.birthday || user.birthday,
      weddingAnniversary:
        formData.weddingAnniversary || user.weddingAnniversary,
      emergencyContactPerson:
        formData.emergencyContactPerson || user.emergencyContactPerson,
      emergencyContactNumber:
        formData.emergencyContactNumber || user.emergencyContactNumber,
      leaveBalance: formData.leaveBalance || user.leaveBalance,
      exitDate: formData.exitDate ?? user.exitDate,
      fNFDate: formData.fNFDate ?? user.fNFDate,
      organisation: formData.organisation ?? user.organisation,
      profile: formData.profile ?? user.profile,
      monthlyAttendanceSummary:
        formData.monthlyAttendanceSummary ?? user.monthlyAttendanceSummary,
    };
  };

  // Send only what this user is actually allowed to change. The builder above
  // spreads the whole record, so without this a PUT carries back every
  // read-only and ACL-denied field — the server discards them, but it also
  // means the request no longer reflects the user's real permissions. Fields
  // are dropped rather than sent-and-ignored.
  const stripForbiddenFields = (payload) => {
    const allowed = {};
    const dropped = [];

    for (const [field, value] of Object.entries(payload)) {
      if (canEditFieldNow(field)) allowed[field] = value;
      else dropped.push(field);
    }

    if (dropped.length) {
      console.debug("[profile] not editable, omitted from PUT:", dropped);
    }

    return allowed;
  };

  const handleSave = async () => {
    try {
      const payload = stripForbiddenFields(buildUpdatePayload());

      await onUpdate(deal.id, payload);

      toast.success("Profile updated successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  useEffect(() => {
    if (deal) {
      setBankData(parseBankDetails(deal.description));
    }
  }, [deal]);
  const bank = parseBankDetails(deal?.description);
  const getValue = (val) => {
    return val && val.trim() ? val : "None";
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
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Icon name="Edit" size={16} className="mr-1" />
                  Edit
                </Button>
              )}

              {isEditing && (
                <>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setBankData(parseBankDetails(deal.description));
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}

              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">

            {!isMassUpdate && deal && (
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
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* ================= Employment ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="BriefcaseBusiness" size={17} className="text-primary" />
                          Employment
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Name */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                              <Icon name="AtSign" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">User Name</p>
                            {isEditing ? (
                              <Input
                                value={formData.name || user.name}
                                onChange={(e) =>
                                  setFormData({ ...formData, name: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.name || "None"}
                              </p>
                            )}
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="Wallet" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Leave Balance</p>

                            {isEditing ? (
                              <Input
                                value={formData.leaveBalance || user.leaveBalance}
                                onChange={(e) =>
                                  setFormData({ ...formData, leaveBalance: e.target.value })
                                }
                                disabled={!canEditFieldNow("leaveBalance")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.leaveBalance || "None"}
                              </p>
                            )}
                            </div>
                          </div>

                          {/* Email */}

                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                              <Icon name="UserRound" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Name</p>
                            {isEditing ? (
                              <Input
                                value={formData.name || user.name}
                                onChange={(e) =>
                                  setFormData({ ...formData, name: e.target.value })
                                }
                                disabled={!canEditFieldNow("name")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.name || "None"}</p>

                            )}
                            </div>
                          </div>

                          {/* WhatsApp */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-pink-50 text-pink-600 ring-pink-200/70">
                              <Icon name="VenusAndMars" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Gender</p>

                            {isEditing ? (
                              <Input
                                value={formData.gender || user.gender}
                                onChange={(e) =>
                                  setFormData({ ...formData, gender: e.target.value })
                                }
                                disabled={!canEditFieldNow("gender")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.gender || "None"}</p>

                            )}
                            </div>
                          </div>

                          {/* City */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-amber-50 text-amber-600 ring-amber-200/70">
                              <Icon name="Award" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Designation</p>
                            {isEditing ? (
                              <Input
                                value={formData.designation || user?.designation}
                                onChange={(e) =>
                                  setFormData({ ...formData, designation: e.target.value })
                                }
                                disabled={!canEditFieldNow("designation")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.designation || "None"}</p>

                            )}
                            </div>
                          </div>

                          {/* Next Contact */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-slate-50 text-slate-600 ring-slate-200/70">
                              <Icon name="Hash" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Emp Code</p>
                            {isEditing ? (
                              <Input
                                value={formData.empCode || user?.empCode}
                                onChange={(e) =>
                                  setFormData({ ...formData, empCode: e.target.value })

                                }
                                disabled={!canEditFieldNow("empCode")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.empCode || "None"}</p>

                            )}
                            </div>
                          </div>

                          {/* Project Name */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                              <Icon name="Building2" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Department</p>
                            {isEditing ? (
                              <Input
                                value={formData.department || user?.department}
                                onChange={(e) =>
                                  setFormData({ ...formData, department: e.target.value })
                                }
                                disabled={!canEditFieldNow("department")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.department || "None"}</p>

                            )}
                            </div>
                          </div>

                          {/* Preference */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-cyan-50 text-cyan-600 ring-cyan-200/70">
                              <Icon name="Network" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Sub Department</p>

                            {isEditing ? (
                              <Input
                                value={formData.subDepartment || user?.subDepartment}
                                onChange={(e) =>
                                  setFormData({ ...formData, subDepartment: e.target.value })
                                }
                                disabled={!canEditFieldNow("subDepartment")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.subDepartment || "None"}</p>

                            )}
                            </div>
                          </div>
                          {/* Preference */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-rose-50 text-rose-600 ring-rose-200/70">
                              <Icon name="MapPin" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Branch</p>
                            {isEditing ? (
                              <Input
                                value={formData.branch || user?.branch}
                                onChange={(e) =>
                                  setFormData({ ...formData, branch: e.target.value })
                                }
                                disabled={!canEditFieldNow("branch")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.branch || "None"}</p>

                            )}
                            </div>
                          </div>
                          {/* Preference */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-teal-50 text-teal-600 ring-teal-200/70">
                              <Icon name="Laptop" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Mode</p>
                            {isEditing ? (
                              <Input
                                value={formData.mode || user?.mode}
                                onChange={(e) =>
                                  setFormData({ ...formData, mode: e.target.value })
                                }
                                disabled={!canEditFieldNow("mode")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.mode || "None"}</p>

                            )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= Contact ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="Contact" size={17} className="text-primary" />
                          Contact
                        </h3>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Official Email — `email` is a readOnly foreign
                              mirror of the linked User record, so it can never
                              be written from here. Change it on the User. */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                              <Icon name="Mail" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Official Email</p>
                            {user?.email ? (
                              <a
                                href={`mailto:${user.email}`}
                                className="text-primary hover:underline break-words"
                              >
                                {user.email}
                              </a>
                            ) : (
                              <p className="text-medium font-medium">None</p>
                            )}
                            </div>
                          </div>

                          {/* Official Gmail — the writable counterpart */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-red-50 text-red-600 ring-red-200/70">
                              <Icon name="AtSign" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Official Gmail</p>
                            {isEditing ? (
                              <Input
                                value={
                                  formData.officialGmail ?? user?.officialGmail ?? ""
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    officialGmail: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <p className="text-medium font-medium">
                                {user?.officialGmail || "None"}
                              </p>
                            )}
                            </div>
                          </div>

                          {/* Official Mobile — readOnly foreign mirror, same
                              as Official Email above. */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-blue-50 text-blue-600 ring-blue-200/70">
                              <Icon name="Phone" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Official Mobile</p>
                            {user?.phone ? (
                              <a
                                href={`tel:${user.phone}`}
                                className="text-primary hover:underline"
                              >
                                {user.phone}
                              </a>
                            ) : (
                              <p className="text-medium font-medium">None</p>
                            )}
                            </div>
                          </div>
                          {/* Status */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                              <Icon name="MailOpen" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Personal Email</p>

                            {isEditing ? (
                              <Input
                                value={formData.personalEmail || user?.personalEmail}
                                onChange={(e) =>
                                  setFormData({ ...formData, personalEmail: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-medium font-medium break-words">
                                {user?.personalEmail || "None"}
                              </p>

                            )}
                            </div>
                          </div>

                          {/* Source */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="Smartphone" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Personal Mobile</p>

                            {isEditing ? (
                              <Input
                                value={formData.personalMobile || user?.personalMobile}
                                onChange={(e) =>
                                  setFormData({ ...formData, personalMobile: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.personalMobile || "None"}</p>

                            )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= Leave &amp; Appraisal ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="CalendarCheck" size={17} className="text-primary" />
                          Leave &amp; Appraisal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-amber-50 text-amber-600 ring-amber-200/70">
                              <Icon name="CalendarCheck" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Last Appraisal Date</p>

                            {canReadField("CProfileDetails", "lastAppraisalDate") &&
                              (isEditing &&
                                canEditFieldNow("lastAppraisalDate") ? (
                                <Input
                                  type="date"
                                  value={formData.lastAppraisalDate || user?.lastAppraisalDate}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      lastAppraisalDate: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <p className="text-medium font-medium pt-2">
                                  {user?.lastAppraisalDate || "None"}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Description */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-orange-50 text-orange-600 ring-orange-200/70">
                              <Icon name="CalendarClock" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Next Appraisal Date</p>

                            {canReadField("CProfileDetails", "nextAppraisalDate") &&
                              (isEditing &&
                                canEditFieldNow("nextAppraisalDate") ? (
                                <Input
                                  type="date"
                                  value={formData.nextAppraisalDate || user?.nextAppraisalDate}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      nextAppraisalDate: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <p className="text-medium font-medium pt-2">
                                  {user?.nextAppraisalDate || "None"}
                                </p>
                              ))}
                            </div>
                          </div>
                          {/* Description */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="CalendarPlus" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Joining Date</p>

                            {isEditing ? (
                              <Input
                                value={formData.joiningDate || user?.joiningDate}
                                onChange={(e) =>
                                  setFormData({ ...formData, joiningDate: e.target.value })
                                }
                                disabled={!canEditFieldNow("joiningDate")}
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.joiningDate || "None"}</p>

                            )}
                            </div>
                          </div>
                          {/* Description */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                              <Icon name="Clock" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Shift Timings</p>

                            {canReadField("CProfileDetails", "shiftTimings") &&
                              (isEditing &&
                                canEditFieldNow("shiftTimings") ? (
                                // enum in metadata — a free-text input let any
                                // value through and the server would reject it.
                                <Select
                                  value={
                                    formData.shiftTimings ||
                                    user?.shiftTimings ||
                                    ""
                                  }
                                  options={SHIFT_TIMING_OPTIONS}
                                  onChange={(value) =>
                                    setFormData({
                                      ...formData,
                                      shiftTimings: value,
                                    })
                                  }
                                />
                              ) : (
                                <p className="text-medium font-medium pt-2">
                                  {user?.shiftTimings || "None"}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Exit Date — the whole cell is inside the read
                              guard, otherwise the label and icon still render
                              above an empty "—" for people who may not see it. */}
                          {canReadFieldNow("exitDate") && (
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-rose-50 text-rose-600 ring-rose-200/70">
                                <Icon name="CalendarX" size={18} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">Exit Date</p>

                                {isEditing && canEditFieldNow("exitDate") ? (
                                  <Input
                                    type="date"
                                    value={formData.exitDate ?? user?.exitDate ?? ""}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        exitDate: e.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  <p className="text-medium font-medium pt-2">
                                    {formatDate(user?.exitDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* F&F Date */}
                          {canReadFieldNow("fNFDate") && (
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-teal-50 text-teal-600 ring-teal-200/70">
                                <Icon name="BadgeCheck" size={18} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">
                                  Full &amp; Final Date
                                </p>

                                {isEditing && canEditFieldNow("fNFDate") ? (
                                  <Input
                                    type="date"
                                    value={formData.fNFDate ?? user?.fNFDate ?? ""}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        fNFDate: e.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  <p className="text-medium font-medium pt-2">
                                    {formatDate(user?.fNFDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Organisation — read:"no" for employees in the ACL,
                              so this cell disappears for them entirely. */}
                          {canReadFieldNow("organisation") && (
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                                <Icon name="Building2" size={18} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted-foreground">Organisation</p>

                                {isEditing && canEditFieldNow("organisation") ? (
                                  <Select
                                    value={
                                      formData.organisation ??
                                      user?.organisation ??
                                      ""
                                    }
                                    options={ORGANISATION_OPTIONS}
                                    onChange={(value) =>
                                      setFormData({
                                        ...formData,
                                        organisation: value,
                                      })
                                    }
                                  />
                                ) : (
                                  <p className="text-medium font-medium pt-2">
                                    {user?.organisation || "None"}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ================= Profile (rich text) ================= */}
                      {canReadFieldNow("profile") && (
                        <div className="border border-border rounded-xl p-6">
                          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                            <Icon name="FileText" size={17} className="text-primary" />
                            Profile
                          </h3>

                          {isEditing && canEditFieldNow("profile") ? (
                            <div className="custom-quill">
                              <ReactQuill
                                theme="snow"
                                value={formData.profile ?? user?.profile ?? ""}
                                onChange={(value) =>
                                  setFormData({ ...formData, profile: value })
                                }
                                style={{ height: "180px", marginBottom: "48px" }}
                                modules={PROFILE_EDITOR_MODULES}
                              />
                            </div>
                          ) : user?.profile ? (
                            // Server-authored HTML from the same wysiwyg field.
                            <div
                              className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_img]:max-w-full"
                              dangerouslySetInnerHTML={{ __html: user.profile }}
                            />
                          ) : (
                            <p className="text-medium font-medium text-muted-foreground">
                              None
                            </p>
                          )}
                        </div>
                      )}

                      {/* ================= Personal ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="UserRound" size={17} className="text-primary" />
                          Personal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-teal-50 text-teal-600 ring-teal-200/70">
                              <Icon name="House" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Local Address</p>

                            {isEditing ? (
                              <Input
                                value={formData.localAddress || user?.localAddress}
                                onChange={(e) =>
                                  setFormData({ ...formData, localAddress: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.localAddress || "None"}</p>

                            )}
                            </div>
                          </div>
                          {/* Description */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-rose-50 text-rose-600 ring-rose-200/70">
                              <Icon name="MapPinHouse" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Permanent Address</p>

                            {isEditing ? (
                              <Input
                                value={formData.permanentAddress || user?.permanentAddress}
                                onChange={(e) =>
                                  setFormData({ ...formData, permanentAddress: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.permanentAddress || "None"}</p>

                            )}
                            </div>
                          </div>
                          {/* Description */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-pink-50 text-pink-600 ring-pink-200/70">
                              <Icon name="Cake" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Celebration Birthday</p>

                            {isEditing ? (
                              <Input
                                type="date"
                                value={formData.birthday || user?.birthday}
                                onChange={(e) =>
                                  setFormData({ ...formData, birthday: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.birthday || "None"}</p>

                            )}
                            </div>
                          </div>

                          {/* Document Birthday — separate field from the
                              celebration birthday above. It is
                              readOnlyAfterCreate on the backend, so on an
                              existing record it is display-only; EspoCRM
                              renders it as plain text in edit mode too. */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-slate-50 text-slate-600 ring-slate-200/70">
                              <Icon name="FileBadge" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Document Birthday</p>
                            <p className="text-medium font-medium">
                              {user?.documentBirthday || "None"}
                            </p>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-rose-50 text-rose-600 ring-rose-200/70">
                              <Icon name="Heart" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Wedding Anniversary</p>

                            {isEditing ? (
                              <Input
                                type="date"
                                value={formData.weddingAnniversary || user?.weddingAnniversary}
                                onChange={(e) =>
                                  setFormData({ ...formData, weddingAnniversary: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.weddingAnniversary || "None"}</p>

                            )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= Emergency Contact ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="ShieldAlert" size={17} className="text-primary" />
                          Emergency Contact
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-red-50 text-red-600 ring-red-200/70">
                              <Icon name="UserRoundCheck" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Emergency Contact Person</p>
                            {isEditing ? (
                              <Input
                                value={formData.emergencyContactPerson || user?.emergencyContactPerson}
                                onChange={(e) =>
                                  setFormData({ ...formData, emergencyContactPerson: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.emergencyContactPerson || "None"}</p>

                            )}
                            </div>
                          </div>
                          {/* Description */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-red-50 text-red-600 ring-red-200/70">
                              <Icon name="PhoneCall" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Emergency Contact Number</p>
                            {isEditing ? (
                              <Input
                                value={formData.emergencyContactNumber || user?.emergencyContactNumber}
                                onChange={(e) =>
                                  setFormData({ ...formData, emergencyContactNumber: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.emergencyContactNumber || "None"}</p>

                            )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "BankDetails" && (
                    <div className="space-y-6">
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                          {/* UPI ID */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                              <Icon name="QrCode" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">UPI ID</p>
                            {isEditing ? (
                              <Input
                                value={bankData.upiId}
                                onChange={(e) =>
                                  setBankData({ ...bankData, upiId: e.target.value })
                                }
                                disabled={!canEditFieldNow("description")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.upiId)}
                              </p>
                            )}
                            </div>
                          </div>

                          {/* UAN No */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                              <Icon name="Hash" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">UAN No</p>
                            {isEditing ? (
                              <Input
                                value={bankData.uanNo}
                                onChange={(e) =>
                                  setBankData({ ...bankData, uanNo: e.target.value })
                                }
                                disabled={!canEditFieldNow("description")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.uanNo)}
                              </p>
                            )}
                            </div>
                          </div>

                          {/* Name */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                              <Icon name="UserRound" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Name</p>
                            {isEditing ? (
                              <Input
                                value={bankData.name}
                                onChange={(e) =>
                                  setBankData({ ...bankData, name: e.target.value })
                                }
                                disabled={!canEditFieldNow("description")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.name)}
                              </p>
                            )}
                            </div>
                          </div>

                          {/* Bank Name */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="Landmark" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Bank Name</p>
                            {isEditing ? (
                              <Input
                                value={bankData.bankName}
                                onChange={(e) =>
                                  setBankData({ ...bankData, bankName: e.target.value })
                                }
                                disabled={!canEditFieldNow("description")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.bankName)}
                              </p>
                            )}
                            </div>
                          </div>

                          {/* Account Number */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                              <Icon name="CreditCard" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Account Number</p>

                            {canReadField(ENTITY, "accountNumber") &&
                              (isEditing &&
                                canEditFieldNow("accountNumber") ? (
                                <Input
                                  value={bankData.accountNumber}
                                  onChange={(e) =>
                                    setBankData({
                                      ...bankData,
                                      accountNumber: e.target.value,
                                    })
                                  }
                                  disabled={!canEditFieldNow("description")}
                                />
                              ) : (
                                <p className="text-foreground font-medium">
                                  {getValue(bankData.accountNumber)}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* IFSC */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-amber-50 text-amber-600 ring-amber-200/70">
                              <Icon name="Building2" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">IFSC</p>
                            {isEditing ? (
                              <Input
                                value={bankData.ifsc}
                                onChange={(e) =>
                                  setBankData({ ...bankData, ifsc: e.target.value })
                                }
                                disabled={!canEditFieldNow("description")}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.ifsc)}
                              </p>
                            )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "MonthlyAttendance" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                              <Icon name="CalendarRange" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Month</p>
                            <p className="text-foreground font-medium">
                              {attendance.month || "None"}
                            </p>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-orange-50 text-orange-600 ring-orange-200/70">
                              <Icon name="CalendarMinus" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Leaves Taken</p>
                            <p className="text-foreground font-medium">
                              {attendance.leavesTaken || "—"}
                            </p>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-red-50 text-red-600 ring-red-200/70">
                              <Icon name="IndianRupee" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Salary Deduction</p>
                            <p className="text-foreground font-medium">
                              {attendance.salaryDeduction || "—"}
                            </p>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="CalendarPlus" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Contribution Credit</p>
                            <p className="text-foreground font-medium">
                              {attendance.contribution || "—"}
                            </p>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="Wallet" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">New Leave Balance for Next Month</p>
                            <p className="text-foreground font-medium">
                              {attendance.nextBalance || "—"}
                            </p>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <p className="text-medium text-muted-foreground">
                              I, {user?.name}, confirm that the above detaiils are correct.
                            </p>
                            <p className="text-foreground font-medium pt-1">
                              TimeStamp: {attendance.Discription || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Raw summary — the cards above are parsed out of this
                          single text field, so editing happens on the source. */}
                      {canReadField(ENTITY, "monthlyAttendanceSummary") &&
                        isEditing &&
                        canEditFieldNow("monthlyAttendanceSummary") && (
                          <div className="border border-border rounded-xl p-6">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
                              <Icon
                                name="PencilLine"
                                size={17}
                                className="text-primary"
                              />
                              Edit Summary
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Keep one <code>Label: value</code> per line — the
                              cards above are read from these labels.
                            </p>

                            <textarea
                              rows={8}
                              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground font-mono text-[13px] leading-6 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
                              value={
                                formData.monthlyAttendanceSummary ??
                                user?.monthlyAttendanceSummary ??
                                ""
                              }
                              placeholder={
                                "Month: September 2026\nLeaves Taken: 2\nSalary Deduction: 0\nContribution credit: 1\nNew Leave Balance for Next Month: 1.5\nTimeStamp: "
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  monthlyAttendanceSummary: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                    </div>
                  )}

                  {activeTab === "AssignedUsers" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Assigned User */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                              <Icon name="UserCog" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Assigned User:</p>
                            <p className="text-foreground font-medium">
                              {user?.assignedUserName || "—"}
                            </p>
                            </div>
                          </div>
                          {/* Assigned User */}
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                              <Icon name="Users" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Teams:</p>

                            {Object.keys(user?.teamsNames || {}).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(user?.teamsNames || {}).map(([id, name]) => (
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
                            </div>
                          </div>
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="CalendarPlus" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Created</p>
                            <p className="text-foreground font-medium">
                              {deal?.createdAt
                                ? `${formatDateTime(deal.createdAt)} by ${deal?.createdByName || "—"}`
                                : "—"}
                            </p>
                            </div>
                          </div>
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 bg-slate-50 text-slate-600 ring-slate-200/70">
                              <Icon name="History" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Last Modified</p>
                            <p className="text-foreground font-medium">
                              {deal?.modifiedAt
                                ? `${formatDateTime(deal.modifiedAt)} by ${deal?.modifiedByName || "—"}`
                                : "—"}
                            </p>
                            </div>
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
      </div >
    </>
  );
};

export default React.memo(DealDrawer);
