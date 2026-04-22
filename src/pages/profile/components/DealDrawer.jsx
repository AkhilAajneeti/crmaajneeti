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

  const { data: user, isLoading } = useProfileById(deal?.id, isOpen);

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
      return match ? match[1].replace(".", "").trim() : "—";
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
      email: formData.email || user.email,
      phone: formData.phone || user.phone,
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

      console.log("FINAL PAYLOAD 👉", payload);

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
                          <div>
                            <p className="text-sm text-muted-foreground">
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
                            <p className="text-sm text-muted-foreground">
                              Leave Balance
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.leaveBalance || user.leaveBalance}
                                onChange={(e) =>
                                  setFormData({ ...formData, leaveBalance: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.leaveBalance || "None"}
                              </p>
                            )}
                          </div>

                          {/* Email */}

                          <div>
                            <p className="text-sm text-muted-foreground">
                              Name
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
                                {user?.name || "None"}</p>

                            )}
                          </div>

                          {/* WhatsApp */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Gender
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.gender || user.gender}
                                onChange={(e) =>
                                  setFormData({ ...formData, gender: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.gender || "None"}</p>

                            )}
                          </div>

                          {/* City */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Designation
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.designation || user?.designation}
                                onChange={(e) =>
                                  setFormData({ ...formData, designation: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.designation || "None"}</p>

                            )}
                          </div>

                          {/* Next Contact */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Emp Code
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.empCode || user?.empCode}
                                onChange={(e) =>
                                  setFormData({ ...formData, empCode: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.empCode || "None"}</p>

                            )}
                          </div>

                          {/* Project Name */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Department
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.department || user?.department}
                                onChange={(e) =>
                                  setFormData({ ...formData, department: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.department || "None"}</p>

                            )}
                          </div>

                          {/* Preference */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Sub Department
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.subDepartment || user?.subDepartment}
                                onChange={(e) =>
                                  setFormData({ ...formData, subDepartment: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.subDepartment || "None"}</p>

                            )}
                          </div>
                          {/* Preference */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Branch
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.branch || user?.branch}
                                onChange={(e) =>
                                  setFormData({ ...formData, branch: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.branch || "None"}</p>

                            )}
                          </div>
                          {/* Preference */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Mode
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.mode || user?.mode}
                                onChange={(e) =>
                                  setFormData({ ...formData, mode: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {user?.mode || "None"}</p>

                            )}
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
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Email
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.email || user?.email}
                                onChange={(e) =>
                                  setFormData({ ...formData, email: e.target.value })
                                }
                              />
                            ) : (
                              <p className="inline-flex px-3 py-1 rounded-full text-medium font-medium bg-success/10 text-success">
                                {user?.email || "None"}</p>

                            )}
                          </div>

                          {/* Source */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Phone
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.phone || user?.phone}
                                onChange={(e) =>
                                  setFormData({ ...formData, phone: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.phone || "None"}</p>

                            )}
                          </div>
                          {/* Status */}
                          <div>
                            <p className="text-sm text-muted-foreground">
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
                              <p className="inline-flex px-3 py-1 rounded-full text-medium font-medium bg-success/10 text-success">
                                {user?.personalEmail || "None"}</p>

                            )}
                          </div>

                          {/* Source */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Personal Phone
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
                          {/* Source */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Last Appraisal Date
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.lastAppraisalDate || user?.lastAppraisalDate}
                                onChange={(e) =>
                                  setFormData({ ...formData, lastAppraisalDate: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.lastAppraisalDate || "None"}</p>

                            )}
                          </div>

                          {/* Description */}
                          <div className="">
                            <p className="text-sm text-muted-foreground">
                              Next Appraisal Date
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.nextAppraisalDate || user?.nextAppraisalDate}
                                onChange={(e) =>
                                  setFormData({ ...formData, nextAppraisalDate: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.nextAppraisalDate || "None"}</p>

                            )}
                          </div>
                          {/* Description */}
                          <div className="">
                            <p className="text-sm text-muted-foreground">
                              Jioning
                            </p>

                            {isEditing ? (
                              <Input
                                value={formData.joiningDate || user?.joiningDate}
                                onChange={(e) =>
                                  setFormData({ ...formData, joiningDate: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.joiningDate || "None"}</p>

                            )}
                          </div>
                          {/* Description */}
                          <div className="">
                            <p className="text-sm text-muted-foreground">
                              Shift Timings
                            </p>
                            {isEditing ? (
                              <Input
                                value={formData.shiftTimings || user?.shiftTimings}
                                onChange={(e) =>
                                  setFormData({ ...formData, shiftTimings: e.target.value })
                                }
                              />
                            ) : (
                              <p className=" text-medium font-medium">
                                {user?.shiftTimings || "None"}</p>

                            )}
                          </div>
                          {/* Description */}
                          <div className="">
                            <p className="text-sm text-muted-foreground">
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
                            <p className="text-sm text-muted-foreground">
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
                            <p className="text-sm text-muted-foreground">
                              Birthday
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
                          {/* Description */}
                          <div className="">
                            <p className="text-sm text-muted-foreground">
                              Wedding Aniversary
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
                          {/* Description */}
                          <div className="">
                            <p className="text-sm text-muted-foreground">
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
                            <p className="text-sm text-muted-foreground">
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
                            <p className="text-sm text-muted-foreground">UPI ID</p>
                            {isEditing ? (
                              <Input
                                value={bankData.upiId}
                                onChange={(e) =>
                                  setBankData({ ...bankData, upiId: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.upiId)}
                              </p>
                            )}
                          </div>

                          {/* UAN No */}
                          <div>
                            <p className="text-sm text-muted-foreground">UAN No</p>
                            {isEditing ? (
                              <Input
                                value={bankData.uanNo}
                                onChange={(e) =>
                                  setBankData({ ...bankData, uanNo: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.uanNo)}
                              </p>
                            )}
                          </div>

                          {/* Name */}
                          <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            {isEditing ? (
                              <Input
                                value={bankData.name}
                                onChange={(e) =>
                                  setBankData({ ...bankData, name: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.name)}
                              </p>
                            )}
                          </div>

                          {/* Bank Name */}
                          <div>
                            <p className="text-sm text-muted-foreground">Bank Name</p>
                            {isEditing ? (
                              <Input
                                value={bankData.bankName}
                                onChange={(e) =>
                                  setBankData({ ...bankData, bankName: e.target.value })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.bankName)}
                              </p>
                            )}
                          </div>

                          {/* Account Number */}
                          <div>
                            <p className="text-sm text-muted-foreground">Account Number</p>
                            {isEditing ? (
                              <Input
                                value={bankData.accountNumber}
                                onChange={(e) =>
                                  setBankData({
                                    ...bankData,
                                    accountNumber: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <p className="text-foreground font-medium">
                                {getValue(bankData.accountNumber)}
                              </p>
                            )}
                          </div>

                          {/* IFSC */}
                          <div>
                            <p className="text-sm text-muted-foreground">IFSC</p>
                            {isEditing ? (
                              <Input
                                value={bankData.ifsc}
                                onChange={(e) =>
                                  setBankData({ ...bankData, ifsc: e.target.value })
                                }
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
                            <p className="text-sm text-muted-foreground">Month</p>
                            <p className="text-foreground font-medium">
                              {attendance.month || "None"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Leaves Taken</p>
                            <p className="text-foreground font-medium">
                              {attendance.leavesTaken || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Salary Deduction</p>
                            <p className="text-foreground font-medium">
                              {attendance.salaryDeduction || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Contribution Credit</p>
                            <p className="text-foreground font-medium">
                              {attendance.contribution || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">
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
                            <p className="text-sm text-muted-foreground">
                              Assigned User:
                            </p>
                            <p className="text-foreground font-medium">
                              {user?.assignedUserName || "—"}
                            </p>
                          </div>
                          {/* Assigned User */}
                          <div>
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
      </div >
    </>
  );
};

export default React.memo(DealDrawer);
