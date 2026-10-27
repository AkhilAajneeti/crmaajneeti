import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useUsers } from "hooks/useUsers";
import { useTeams } from "hooks/useTeams";

// Option lists mirror the profile drawer so a record created here matches one
// created there.
const SHIFT_TIMING_OPTIONS = [
  { value: "9 AM", label: "9 AM" },
  { value: "10 AM", label: "10 AM" },
  { value: "11 AM", label: "11 AM" },
];

const ORGANISATION_OPTIONS = [
  { value: "ACL", label: "ACL" },
  { value: "AAJneeti Advertising", label: "AAJneeti Advertising" },
];

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const SALUTATION_OPTIONS = [
  { value: "Mr.", label: "Mr." },
  { value: "Ms.", label: "Ms." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Dr.", label: "Dr." },
];

const EMPTY = {
  assignedUserId: "",
  teamsIds: [],
  salutationName: "",
  gender: "",
  empCode: "",
  organisation: "",
  shiftTimings: "",
  joiningDate: "",
  lastAppraisalDate: "",
  nextAppraisalDate: "",
  exitDate: "",
  fNFDate: "",
  officialGmail: "",
  personalEmail: "",
  personalMobile: "",
  localAddress: "",
  permanentAddress: "",
  emergencyContactPerson: "",
  emergencyContactNumber: "",
  birthday: "",
  documentBirthday: "",
  weddingAnniversary: "",
  monthlyAttendanceSummary: "",
  profile: "",
};

// Bank details live in `description` as a labelled block; the drawer parses it
// back out with the same labels, so the shape has to match exactly.
const EMPTY_BANK = {
  upiId: "",
  uanNo: "",
  name: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
};

const buildDescription = (bank) =>
  `UPI ID: ${bank.upiId}
UAN No: ${bank.uanNo}
Name: ${bank.name}
Bank Name: ${bank.bankName}
Account Number: ${bank.accountNumber}
IFSC: ${bank.ifsc}`;

const Field = ({ label, required, hint, className = "", children }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-[13px] font-medium text-foreground">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
  </div>
);

const SectionTitle = ({ icon, children }) => (
  <div className="col-span-full flex items-center gap-2 pt-1">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon name={icon} size={15} />
    </span>
    <h4 className="text-sm font-semibold text-foreground">{children}</h4>
    <span className="h-px flex-1 bg-border" />
  </div>
);

/**
 * Create a staff profile.
 *
 * Only the fields EspoCRM leaves editable on create are here. name, userName,
 * designation, department, branch, mode, official email and mobile are all
 * derived from the linked user record, which is why they render read-only on
 * the native form — so this collects the linked user instead, and the rest
 * follows from it.
 */
const CreateProfileModal = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState(EMPTY);
  const [bank, setBank] = useState(EMPTY_BANK);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: usersData } = useUsers();
  const { data: teamsData } = useTeams();

  const userOptions = useMemo(
    () =>
      (usersData?.list || []).map((u) => ({
        value: u.id,
        label: u.name || u.userName,
      })),
    [usersData]
  );

  const teamOptions = useMemo(
    () =>
      (teamsData?.list || []).map((t) => ({ value: t.id, label: t.name })),
    [teamsData]
  );

  // A fresh form each time it opens, so a cancelled entry is not offered back.
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setBank(EMPTY_BANK);
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && !isSaving && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const setBankField = (key, value) => {
    setBank((prev) => ({ ...prev, [key]: value }));
    if (errors.bank) setErrors((prev) => ({ ...prev, bank: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.assignedUserId) next.assignedUserId = "Pick the user this profile belongs to";
    if (!form.gender) next.gender = "Gender is required";
    if (!form.empCode.trim()) next.empCode = "Emp code is required";
    if (!form.documentBirthday) next.documentBirthday = "Document birthday is required";
    if (!bank.accountNumber.trim() && !bank.upiId.trim())
      next.bank = "Add at least a UPI ID or an account number";
    if (form.officialGmail && !/^\S+@\S+\.\S+$/.test(form.officialGmail))
      next.officialGmail = "Enter a valid email";
    if (form.personalEmail && !/^\S+@\S+\.\S+$/.test(form.personalEmail))
      next.personalEmail = "Enter a valid email";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { teamsIds, assignedUserId, ...rest } = form;

    // Send only what was filled in — empty strings would overwrite the
    // server's own defaults with blanks.
    const payload = Object.fromEntries(
      Object.entries(rest)
        .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
        .filter(([, v]) => v !== "" && v != null)
    );

    payload.assignedUserId = assignedUserId;
    if (teamsIds.length) payload.teamsIds = teamsIds;
    payload.description = buildDescription(bank);

    try {
      setIsSaving(true);
      await onCreate(payload);
      toast.success("Profile created successfully");
      onClose();
    } catch (err) {
      console.error("Profile create failed", err);
      toast.error("Could not create the profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => !isSaving && onClose()}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name="UserPlus" size={20} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Add Profile
                </h3>
                <p className="text-sm text-muted-foreground">
                  Name, designation, department and official contacts come from
                  the linked user.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => !isSaving && onClose()}
              aria-label="Close"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 overflow-y-auto p-6 sm:grid-cols-2">
              <SectionTitle icon="UserCog">Linked user</SectionTitle>

              <Field label="Assigned User" required>
                <Select
                  options={userOptions}
                  value={form.assignedUserId}
                  onChange={(v) => set("assignedUserId", v)}
                  placeholder="Select user"
                  searchable
                  error={errors.assignedUserId}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Teams">
                <Select
                  options={teamOptions}
                  value={form.teamsIds}
                  onChange={(v) => set("teamsIds", Array.isArray(v) ? v : [v])}
                  placeholder="Select teams"
                  multiple
                  searchable
                  clearable
                  disabled={isSaving}
                />
              </Field>

              <SectionTitle icon="BriefcaseBusiness">Employment</SectionTitle>

              <Field label="Emp code" required>
                <Input
                  value={form.empCode}
                  onChange={(e) => set("empCode", e.target.value)}
                  placeholder="e.g. 2026D000026"
                  error={errors.empCode}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Gender" required>
                <Select
                  options={GENDER_OPTIONS}
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                  placeholder="Select gender"
                  error={errors.gender}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Organisation">
                <Select
                  options={ORGANISATION_OPTIONS}
                  value={form.organisation}
                  onChange={(v) => set("organisation", v)}
                  placeholder="Select organisation"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Shift Timings">
                <Select
                  options={SHIFT_TIMING_OPTIONS}
                  value={form.shiftTimings}
                  onChange={(v) => set("shiftTimings", v)}
                  placeholder="Select shift"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Joining Date">
                <Input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => set("joiningDate", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Last Appraisal Date">
                <Input
                  type="date"
                  value={form.lastAppraisalDate}
                  onChange={(e) => set("lastAppraisalDate", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Next Appraisal Date">
                <Input
                  type="date"
                  value={form.nextAppraisalDate}
                  onChange={(e) => set("nextAppraisalDate", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Exit Date">
                <Input
                  type="date"
                  value={form.exitDate}
                  onChange={(e) => set("exitDate", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field label="FNF Date">
                <Input
                  type="date"
                  value={form.fNFDate}
                  onChange={(e) => set("fNFDate", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <SectionTitle icon="Contact">Contact</SectionTitle>

              <Field label='Official "@gmail.com"'>
                <Input
                  type="email"
                  value={form.officialGmail}
                  onChange={(e) => set("officialGmail", e.target.value)}
                  placeholder="name@gmail.com"
                  error={errors.officialGmail}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Personal Email">
                <Input
                  type="email"
                  value={form.personalEmail}
                  onChange={(e) => set("personalEmail", e.target.value)}
                  placeholder="name@example.com"
                  error={errors.personalEmail}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Personal Mobile">
                <Input
                  value={form.personalMobile}
                  onChange={(e) => set("personalMobile", e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Emergency Contact Person">
                <Input
                  value={form.emergencyContactPerson}
                  onChange={(e) => set("emergencyContactPerson", e.target.value)}
                  placeholder="Name and relation"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Emergency Contact Number">
                <Input
                  value={form.emergencyContactNumber}
                  onChange={(e) => set("emergencyContactNumber", e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Local Address" className="sm:col-span-2">
                <Input
                  value={form.localAddress}
                  onChange={(e) => set("localAddress", e.target.value)}
                  placeholder="Current address"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Permanent Address" className="sm:col-span-2">
                <Input
                  value={form.permanentAddress}
                  onChange={(e) => set("permanentAddress", e.target.value)}
                  placeholder="Permanent address"
                  disabled={isSaving}
                />
              </Field>

              <SectionTitle icon="Cake">Personal</SectionTitle>

              <Field label="Salutation">
                <Select
                  options={SALUTATION_OPTIONS}
                  value={form.salutationName}
                  onChange={(v) => set("salutationName", v)}
                  placeholder="Select"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Document Birthday" required hint="As printed on official documents.">
                <Input
                  type="date"
                  value={form.documentBirthday}
                  onChange={(e) => set("documentBirthday", e.target.value)}
                  error={errors.documentBirthday}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Celebration Birthday">
                <Input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => set("birthday", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Wedding Anniversary">
                <Input
                  type="date"
                  value={form.weddingAnniversary}
                  onChange={(e) => set("weddingAnniversary", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <SectionTitle icon="Landmark">Bank details</SectionTitle>

              <Field label="UPI ID">
                <Input
                  value={bank.upiId}
                  onChange={(e) => setBankField("upiId", e.target.value)}
                  placeholder="name@oksbi"
                  disabled={isSaving}
                />
              </Field>

              <Field label="UAN No">
                <Input
                  value={bank.uanNo}
                  onChange={(e) => setBankField("uanNo", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Account Holder Name">
                <Input
                  value={bank.name}
                  onChange={(e) => setBankField("name", e.target.value)}
                  placeholder="As per bank records"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Bank Name">
                <Input
                  value={bank.bankName}
                  onChange={(e) => setBankField("bankName", e.target.value)}
                  placeholder="e.g. ICICI Bank"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Account Number">
                <Input
                  value={bank.accountNumber}
                  onChange={(e) => setBankField("accountNumber", e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field label="IFSC">
                <Input
                  value={bank.ifsc}
                  onChange={(e) => setBankField("ifsc", e.target.value)}
                  placeholder="e.g. ICIC0000915"
                  disabled={isSaving}
                />
              </Field>

              {errors.bank && (
                <p className="col-span-full -mt-1 text-[12.5px] text-destructive">
                  {errors.bank}
                </p>
              )}

              <SectionTitle icon="NotepadText">Other</SectionTitle>

              <Field label="Profile" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={form.profile}
                  onChange={(e) => set("profile", e.target.value)}
                  placeholder="Short bio or notes"
                  disabled={isSaving}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
              </Field>

              <Field label="Monthly Attendance Summary" className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={form.monthlyAttendanceSummary}
                  onChange={(e) => set("monthlyAttendanceSummary", e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSaving} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateProfileModal;
