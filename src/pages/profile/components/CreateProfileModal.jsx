import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import Icon from "../../../components/AppIcon";
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

// Field chrome. Inputs sit on the glass as their own slightly-raised
// surfaces, so the form reads as layers rather than boxes on a panel.
const FIELD =
  "h-11 rounded-xl border-transparent bg-white/75 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.06] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/40";

// Select renders its own trigger button, so reach it through the wrapper
// rather than editing the shared component.
const SELECT_FIELD =
  "[&>div>button]:h-11 [&>div>button]:rounded-xl [&>div>button]:border-transparent [&>div>button]:bg-white/75 [&>div>button]:text-[14px] [&>div>button]:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] [&>div>button]:ring-1 [&>div>button]:ring-black/[0.06]";

const TEXTAREA =
  "w-full rounded-xl border-transparent bg-white/75 px-3.5 py-2.5 text-[14px] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.06] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60";

const Field = ({ label, required, hint, className = "", children }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11.5px] text-slate-400">{hint}</p>}
  </div>
);

/** A titled glass card. Each group is its own surface on the panel. */
const Section = ({ icon, title, children }) => (
  <section className="rounded-[20px] bg-white/55 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-white/60 sm:p-5">
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-white text-primary shadow-[0_2px_6px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.03]">
        <Icon name={icon} size={16} />
      </span>
      <h4 className="text-[15px] font-semibold text-slate-900">{title}</h4>
      <span className="h-px flex-1 bg-gradient-to-r from-black/[0.10] to-transparent" />
    </div>
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
  </section>
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[5px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => !isSaving && onClose()}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add profile"
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white/75 backdrop-blur-2xl ring-1 ring-white/70"
            style={{
              boxShadow:
                "0 50px 110px -35px rgba(15,23,42,0.55), 0 0 0 1px rgba(172,35,52,0.1), 0 24px 70px -30px rgba(172,35,52,0.35), inset 0 1px 0 rgba(255,255,255,0.85)",
            }}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.9 }}
          >
            {/* Accent wash down from the top edge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.12] to-transparent"
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-4 px-6 pt-6 pb-5 sm:px-7">
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full text-white"
                  style={{
                    background: "linear-gradient(160deg, #b2152f, #8e1526)",
                    boxShadow:
                      "0 10px 26px -10px rgba(172,35,52,0.9), 0 0 0 10px rgba(172,35,52,0.1), inset 0 1px 0 rgba(255,255,255,0.35)",
                  }}
                >
                  <Icon name="UserPlus" size={24} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[23px] font-bold leading-tight tracking-tight text-slate-900">
                    Add Profile
                  </h3>
                  <p className="mt-1 text-[13.5px] text-slate-500">
                    Name, designation, department and official contacts come
                    from the linked user.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSaving && onClose()}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70 transition-colors hover:bg-white hover:text-slate-900"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-6 py-5 sm:px-7">
              <Section icon="UserCog" title="Linked user">
                <Field label="Assigned User" required>
                  <Select
                    options={userOptions}
                    value={form.assignedUserId}
                    onChange={(v) => set("assignedUserId", v)}
                    placeholder="Select user"
                    searchable
                    error={errors.assignedUserId}
                    disabled={isSaving}
                    className={SELECT_FIELD}
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
                    className={SELECT_FIELD}
                  />
                </Field>
              </Section>

              <Section icon="BriefcaseBusiness" title="Employment">
                <Field label="Emp code" required>
                  <Input
                    value={form.empCode}
                    onChange={(e) => set("empCode", e.target.value)}
                    placeholder="e.g. 2026D000026"
                    error={errors.empCode}
                    disabled={isSaving}
                    className={FIELD}
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
                    className={SELECT_FIELD}
                  />
                </Field>

                <Field label="Organisation">
                  <Select
                    options={ORGANISATION_OPTIONS}
                    value={form.organisation}
                    onChange={(v) => set("organisation", v)}
                    placeholder="Select organisation"
                    disabled={isSaving}
                    className={SELECT_FIELD}
                  />
                </Field>

                <Field label="Shift Timings">
                  <Select
                    options={SHIFT_TIMING_OPTIONS}
                    value={form.shiftTimings}
                    onChange={(v) => set("shiftTimings", v)}
                    placeholder="Select shift"
                    disabled={isSaving}
                    className={SELECT_FIELD}
                  />
                </Field>

                <Field label="Joining Date">
                  <Input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => set("joiningDate", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Last Appraisal Date">
                  <Input
                    type="date"
                    value={form.lastAppraisalDate}
                    onChange={(e) => set("lastAppraisalDate", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Next Appraisal Date">
                  <Input
                    type="date"
                    value={form.nextAppraisalDate}
                    onChange={(e) => set("nextAppraisalDate", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Exit Date">
                  <Input
                    type="date"
                    value={form.exitDate}
                    onChange={(e) => set("exitDate", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="FNF Date">
                  <Input
                    type="date"
                    value={form.fNFDate}
                    onChange={(e) => set("fNFDate", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>
              </Section>

              <Section icon="Contact" title="Contact">
                <Field label='Official "@gmail.com"'>
                  <Input
                    type="email"
                    value={form.officialGmail}
                    onChange={(e) => set("officialGmail", e.target.value)}
                    placeholder="name@gmail.com"
                    error={errors.officialGmail}
                    disabled={isSaving}
                    className={FIELD}
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
                    className={FIELD}
                  />
                </Field>

                <Field label="Personal Mobile">
                  <Input
                    value={form.personalMobile}
                    onChange={(e) => set("personalMobile", e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Emergency Contact Person">
                  <Input
                    value={form.emergencyContactPerson}
                    onChange={(e) => set("emergencyContactPerson", e.target.value)}
                    placeholder="Name and relation"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Emergency Contact Number">
                  <Input
                    value={form.emergencyContactNumber}
                    onChange={(e) => set("emergencyContactNumber", e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Local Address" className="sm:col-span-2">
                  <Input
                    value={form.localAddress}
                    onChange={(e) => set("localAddress", e.target.value)}
                    placeholder="Current address"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Permanent Address" className="sm:col-span-2">
                  <Input
                    value={form.permanentAddress}
                    onChange={(e) => set("permanentAddress", e.target.value)}
                    placeholder="Permanent address"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>
              </Section>

              <Section icon="Cake" title="Personal">
                <Field label="Salutation">
                  <Select
                    options={SALUTATION_OPTIONS}
                    value={form.salutationName}
                    onChange={(v) => set("salutationName", v)}
                    placeholder="Select"
                    disabled={isSaving}
                    className={SELECT_FIELD}
                  />
                </Field>

                <Field label="Document Birthday" required hint="As printed on official documents.">
                  <Input
                    type="date"
                    value={form.documentBirthday}
                    onChange={(e) => set("documentBirthday", e.target.value)}
                    error={errors.documentBirthday}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Celebration Birthday">
                  <Input
                    type="date"
                    value={form.birthday}
                    onChange={(e) => set("birthday", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Wedding Anniversary">
                  <Input
                    type="date"
                    value={form.weddingAnniversary}
                    onChange={(e) => set("weddingAnniversary", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>
              </Section>

              <Section icon="Landmark" title="Bank details">
                <Field label="UPI ID">
                  <Input
                    value={bank.upiId}
                    onChange={(e) => setBankField("upiId", e.target.value)}
                    placeholder="name@oksbi"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="UAN No">
                  <Input
                    value={bank.uanNo}
                    onChange={(e) => setBankField("uanNo", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Account Holder Name">
                  <Input
                    value={bank.name}
                    onChange={(e) => setBankField("name", e.target.value)}
                    placeholder="As per bank records"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Bank Name">
                  <Input
                    value={bank.bankName}
                    onChange={(e) => setBankField("bankName", e.target.value)}
                    placeholder="e.g. ICICI Bank"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="Account Number">
                  <Input
                    value={bank.accountNumber}
                    onChange={(e) => setBankField("accountNumber", e.target.value)}
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                <Field label="IFSC">
                  <Input
                    value={bank.ifsc}
                    onChange={(e) => setBankField("ifsc", e.target.value)}
                    placeholder="e.g. ICIC0000915"
                    disabled={isSaving}
                    className={FIELD}
                  />
                </Field>

                {errors.bank && (
                  <p className="col-span-full -mt-1 text-[12.5px] text-destructive">
                    {errors.bank}
                  </p>
                )}
              </Section>

              <Section icon="NotepadText" title="Other">
                <Field label="Profile" className="sm:col-span-2">
                  <textarea
                    rows={3}
                    value={form.profile}
                    onChange={(e) => set("profile", e.target.value)}
                    placeholder="Short bio or notes"
                    disabled={isSaving}
                    className={TEXTAREA}
                  />
                </Field>

                <Field label="Monthly Attendance Summary" className="sm:col-span-2">
                  <textarea
                    rows={2}
                    value={form.monthlyAttendanceSummary}
                    onChange={(e) => set("monthlyAttendanceSummary", e.target.value)}
                    disabled={isSaving}
                    className={TEXTAREA}
                  />
                </Field>
              </Section>
            </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-white/60 bg-white/45 px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-7">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-[14px] bg-white/85 px-6 py-2.5 text-[15px] font-semibold text-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.05] transition-colors hover:bg-white disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-[14px] px-6 py-2.5 text-[15px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-70"
                  style={{
                    background: "linear-gradient(160deg, #b2152f, #9b0428)",
                    boxShadow:
                      "0 10px 24px -10px rgba(155,4,40,0.85), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <Icon
                    name={isSaving ? "LoaderCircle" : "Check"}
                    size={16}
                    className={isSaving ? "animate-spin" : ""}
                  />
                  {isSaving ? "Creating..." : "Create Profile"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CreateProfileModal;
