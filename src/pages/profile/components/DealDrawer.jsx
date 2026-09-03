import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import Avatar from "react-avatar";

import { createLeadActivity, updateStream } from "services/leads.service";
import { useProfileById, useUserById, useUsers } from "hooks/useUsers";
import { useQueryClient } from "@tanstack/react-query";
import { canEditField, canEditRecord, canReadField } from "utils/permissions";

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
  const isAdmin =
    String(JSON.parse(localStorage.getItem("login_object"))?.type).toLowerCase() ===
    "admin";

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

  const parseAttendance = (summary = "") => {
    const getValue = (label) => {
      const regex = new RegExp(`${label}:\\s*([^\\n]*)`);
      const match = summary.match(regex);
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

  const parseBankDetails = (description = "") => {
    const getValue = (label) => {
      const regex = new RegExp(`${label}:\\s*([^\\n]*)`);
      const match = description.match(regex);
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
    };
  };

  const handleSave = async () => {
    try {
      const payload = buildUpdatePayload();

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
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                                <Icon name="AtSign" size={15} />
                              </span>
                              User Name
                            </p>
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

                          {/* Phone */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                                <Icon name="Wallet" size={15} />
                              </span>
                              Leave Balance
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.leaveBalance || user.leaveBalance}
                                onChange={(e) =>
                                  setFormData({ ...formData, leaveBalance: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.leaveBalance || "None"}
                              </p>
                            )}
                          </div>

                          {/* Email */}

                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                                <Icon name="UserRound" size={15} />
                              </span>
                              Name
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.name || user.name}
                                onChange={(e) =>
                                  setFormData({ ...formData, name: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.name || "None"}</p>

                            )}
                          </div>

                          {/* WhatsApp */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-pink-50 text-pink-600 ring-pink-200/70">
                                <Icon name="VenusAndMars" size={15} />
                              </span>
                              Gender
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.gender || user.gender}
                                onChange={(e) =>
                                  setFormData({ ...formData, gender: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.gender || "None"}</p>

                            )}
                          </div>

                          {/* City */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-amber-50 text-amber-600 ring-amber-200/70">
                                <Icon name="Award" size={15} />
                              </span>
                              Designation
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.designation || user?.designation}
                                onChange={(e) =>
                                  setFormData({ ...formData, designation: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.designation || "None"}</p>

                            )}
                          </div>

                          {/* Next Contact */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-slate-50 text-slate-600 ring-slate-200/70">
                                <Icon name="Hash" size={15} />
                              </span>
                              Emp Code
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.empCode || user?.empCode}
                                onChange={(e) =>
                                  setFormData({ ...formData, empCode: e.target.value })

                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.empCode || "None"}</p>

                            )}
                          </div>

                          {/* Project Name */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                                <Icon name="Building2" size={15} />
                              </span>
                              Department
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.department || user?.department}
                                onChange={(e) =>
                                  setFormData({ ...formData, department: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.department || "None"}</p>

                            )}
                          </div>

                          {/* Preference */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-cyan-50 text-cyan-600 ring-cyan-200/70">
                                <Icon name="Network" size={15} />
                              </span>
                              Sub Department
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.subDepartment || user?.subDepartment}
                                onChange={(e) =>
                                  setFormData({ ...formData, subDepartment: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.subDepartment || "None"}</p>

                            )}
                          </div>
                          {/* Preference */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-rose-50 text-rose-600 ring-rose-200/70">
                                <Icon name="MapPin" size={15} />
                              </span>
                              Branch
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.branch || user?.branch}
                                onChange={(e) =>
                                  setFormData({ ...formData, branch: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.branch || "None"}</p>

                            )}
                          </div>
                          {/* Preference */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-teal-50 text-teal-600 ring-teal-200/70">
                                <Icon name="Laptop" size={15} />
                              </span>
                              Mode
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.mode || user?.mode}
                                onChange={(e) =>
                                  setFormData({ ...formData, mode: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.mode || "None"}</p>

                            )}
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
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                                <Icon name="Mail" size={15} />
                              </span>
                              Official Email
                            </p>
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

                          {/* Official Gmail — the writable counterpart */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-red-50 text-red-600 ring-red-200/70">
                                <Icon name="AtSign" size={15} />
                              </span>
                              Official Gmail
                            </p>
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

                          {/* Official Mobile — readOnly foreign mirror, same
                              as Official Email above. */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-blue-50 text-blue-600 ring-blue-200/70">
                                <Icon name="Phone" size={15} />
                              </span>
                              Official Mobile
                            </p>
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
                          {/* Status */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                                <Icon name="MailOpen" size={15} />
                              </span>
                              Personal Email
                            </p>

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

                          {/* Source */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                                <Icon name="Smartphone" size={15} />
                              </span>
                              Personal Mobile
                            </p>

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

                      {/* ================= Leave &amp; Appraisal ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="CalendarCheck" size={17} className="text-primary" />
                          Leave &amp; Appraisal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-amber-50 text-amber-600 ring-amber-200/70">
                                <Icon name="CalendarCheck" size={15} />
                              </span>
                              Last Appraisal Date
                            </p>

                            {canReadField("CProfileDetails", "lastAppraisalDate") &&
                              (isEditing &&
                                canEditField("CProfileDetails", "lastAppraisalDate") &&
                                canEditRecord("User", user) ? (
                                <Input
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

                          {/* Description */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-orange-50 text-orange-600 ring-orange-200/70">
                                <Icon name="CalendarClock" size={15} />
                              </span>
                              Next Appraisal Date
                            </p>

                            {canReadField("CProfileDetails", "nextAppraisalDate") &&
                              (isEditing &&
                                canEditField("CProfileDetails", "nextAppraisalDate") &&
                                canEditRecord("User", user) ? (
                                <Input
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
                          {/* Description */}
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                              <Icon name="CalendarPlus" size={15} />
                            </span>
                            Joining Date
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.joiningDate || user?.joiningDate}
                                onChange={(e) =>
                                  setFormData({ ...formData, joiningDate: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.joiningDate || "None"}</p>

                            )}
                          </div>
                          {/* Description */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                                <Icon name="Clock" size={15} />
                              </span>
                              Shift Timings
                            </p>

                            {canReadField("CProfileDetails", "shiftTimings") &&
                              (isEditing &&
                                canEditField("CProfileDetails", "shiftTimings") &&
                                canEditRecord("User", user) ? (
                                <Input
                                  value={formData.shiftTimings || user?.shiftTimings}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      shiftTimings: e.target.value,
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
                      </div>

                      {/* ================= Personal ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="UserRound" size={17} className="text-primary" />
                          Personal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-teal-50 text-teal-600 ring-teal-200/70">
                                <Icon name="House" size={15} />
                              </span>
                              Local Address
                            </p>

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
                          {/* Description */}
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-rose-50 text-rose-600 ring-rose-200/70">
                                <Icon name="MapPinHouse" size={15} />
                              </span>
                              Permanent Address
                            </p>

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
                          {/* Description */}
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-pink-50 text-pink-600 ring-pink-200/70">
                                <Icon name="Cake" size={15} />
                              </span>
                              Celebration Birthday
                            </p>

                            {isEditing ? (
                              <Input
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

                          {/* Document Birthday — separate field from the
                              celebration birthday above. It is
                              readOnlyAfterCreate on the backend, so on an
                              existing record it is display-only; EspoCRM
                              renders it as plain text in edit mode too. */}
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-slate-50 text-slate-600 ring-slate-200/70">
                                <Icon name="FileBadge" size={15} />
                              </span>
                              Document Birthday
                            </p>
                            <p className="text-medium font-medium">
                              {user?.documentBirthday || "None"}
                            </p>
                          </div>

                          {/* Description */}
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-rose-50 text-rose-600 ring-rose-200/70">
                                <Icon name="Heart" size={15} />
                              </span>
                              Wedding Anniversary
                            </p>

                            {isEditing ? (
                              <Input
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

                      {/* ================= Emergency Contact ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-6">
                          <Icon name="ShieldAlert" size={17} className="text-primary" />
                          Emergency Contact
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-red-50 text-red-600 ring-red-200/70">
                                <Icon name="UserRoundCheck" size={15} />
                              </span>
                              Emergency Contact Person

                            </p>
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
                          {/* Description */}
                          <div className="">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-red-50 text-red-600 ring-red-200/70">
                                <Icon name="PhoneCall" size={15} />
                              </span>
                              Emergency Contact Number
                            </p>
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
                  )}

                  {activeTab === "BankDetails" && (
                    <div className="space-y-6">
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                          {/* UPI ID */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                                <Icon name="QrCode" size={15} />
                              </span>
                              UPI ID
                            </p>
                            {isEditing ? (
                              <Input
                                value={bankData.upiId}
                                onChange={(e) =>
                                  setBankData({ ...bankData, upiId: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.upiId)}
                              </p>
                            )}
                          </div>

                          {/* UAN No */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                                <Icon name="Hash" size={15} />
                              </span>
                              UAN No
                            </p>
                            {isEditing ? (
                              <Input
                                value={bankData.uanNo}
                                onChange={(e) =>
                                  setBankData({ ...bankData, uanNo: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.uanNo)}
                              </p>
                            )}
                          </div>

                          {/* Name */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                                <Icon name="UserRound" size={15} />
                              </span>
                              Name
                            </p>
                            {isEditing ? (
                              <Input
                                value={bankData.name}
                                onChange={(e) =>
                                  setBankData({ ...bankData, name: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.name)}
                              </p>
                            )}
                          </div>

                          {/* Bank Name */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                                <Icon name="Landmark" size={15} />
                              </span>
                              Bank Name
                            </p>
                            {isEditing ? (
                              <Input
                                value={bankData.bankName}
                                onChange={(e) =>
                                  setBankData({ ...bankData, bankName: e.target.value })
                                }
                                disabled={!isAdmin}
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.bankName)}
                              </p>
                            )}
                          </div>

                          {/* Account Number */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                                <Icon name="CreditCard" size={15} />
                              </span>
                              Account Number
                            </p>

                            {canReadField(ENTITY, "accountNumber") &&
                              (isEditing &&
                                canEditField(ENTITY, "accountNumber") &&
                                canEditRecord("User", user) ? (
                                <Input
                                  value={bankData.accountNumber}
                                  onChange={(e) =>
                                    setBankData({
                                      ...bankData,
                                      accountNumber: e.target.value,
                                    })
                                  }
                                  disabled={!isAdmin}
                                />
                              ) : (
                                <p className="text-foreground font-medium">
                                  {getValue(bankData.accountNumber)}
                                </p>
                              ))}
                          </div>

                          {/* IFSC */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-amber-50 text-amber-600 ring-amber-200/70">
                                <Icon name="Building2" size={15} />
                              </span>
                              IFSC
                            </p>
                            {isEditing ? (
                              <Input
                                value={bankData.ifsc}
                                onChange={(e) =>
                                  setBankData({ ...bankData, ifsc: e.target.value })
                                }
                                disabled={!isAdmin}
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
                  )}

                  {activeTab === "MonthlyAttendance" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-indigo-50 text-indigo-600 ring-indigo-200/70">
                                <Icon name="CalendarRange" size={15} />
                              </span>
                              Month
                            </p>
                            <p className="text-foreground font-medium">
                              {attendance.month || "None"}
                            </p>
                          </div>

                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-orange-50 text-orange-600 ring-orange-200/70">
                                <Icon name="CalendarMinus" size={15} />
                              </span>
                              Leaves Taken
                            </p>
                            <p className="text-foreground font-medium">
                              {attendance.leavesTaken || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-red-50 text-red-600 ring-red-200/70">
                                <Icon name="IndianRupee" size={15} />
                              </span>
                              Salary Deduction
                            </p>
                            <p className="text-foreground font-medium">
                              {attendance.salaryDeduction || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                                <Icon name="CalendarPlus" size={15} />
                              </span>
                              Contribution Credit
                            </p>
                            <p className="text-foreground font-medium">
                              {attendance.contribution || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                                <Icon name="Wallet" size={15} />
                              </span>
                              New Leave Balance for Next Month
                            </p>
                            <p className="text-foreground font-medium">
                              {attendance.nextBalance || "—"}
                            </p>
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


                    </div>
                  )}

                  {activeTab === "AssignedUsers" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Assigned User */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-violet-50 text-violet-600 ring-violet-200/70">
                                <Icon name="UserCog" size={15} />
                              </span>
                              Assigned User:
                            </p>
                            <p className="text-foreground font-medium">
                              {user?.assignedUserName || "—"}
                            </p>
                          </div>
                          {/* Assigned User */}
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-sky-50 text-sky-600 ring-sky-200/70">
                                <Icon name="Users" size={15} />
                              </span>
                              Teams:
                            </p>

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
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-emerald-50 text-emerald-600 ring-emerald-200/70">
                                <Icon name="CalendarPlus" size={15} />
                              </span>
                              Created
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.createdAt
                                ? `${formatDateTime(deal.createdAt)} by ${deal?.createdByName || "—"}`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 bg-slate-50 text-slate-600 ring-slate-200/70">
                                <Icon name="History" size={15} />
                              </span>
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
      </div >
    </>
  );
};

export default React.memo(DealDrawer);
