import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

// Mirrors the option lists the profile drawer uses, so a record created here
// matches one created anywhere else.
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
  { value: "Other", label: "Other" },
];

const WORK_MODE_OPTIONS = [
  { value: "Work From Office", label: "Work From Office" },
  { value: "Work From Home", label: "Work From Home" },
  { value: "Hybrid", label: "Hybrid" },
];

const EMPTY = {
  name: "",
  empCode: "",
  officialGmail: "",
  personalEmail: "",
  personalMobile: "",
  gender: "",
  designation: "",
  department: "",
  subDepartment: "",
  branch: "",
  organisation: "",
  mode: "",
  shiftTimings: "",
  joiningDate: "",
};

const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[13px] font-medium text-foreground">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    {children}
  </div>
);

/**
 * Create a staff profile.
 *
 * Kept separate from the view/edit drawer, which is built around an existing
 * record it loads by id — it has no form to fill when there is nothing to
 * load. This collects the fields HR sets at creation; everything else is
 * edited afterwards from the record itself.
 */
const CreateProfileModal = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // A fresh form every time it opens, so a cancelled entry is not offered
  // back on the next create.
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
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

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
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

    // Send only what was filled in — empty strings would overwrite the
    // server's own defaults with blanks.
    const payload = Object.fromEntries(
      Object.entries(form)
        .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
        .filter(([, v]) => v !== "" && v != null)
    );

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
        <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
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
                  Create a new member in the staff directory.
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
            <div className="grid grid-cols-1 gap-5 overflow-y-auto p-6 sm:grid-cols-2">
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Full name"
                  error={errors.name}
                  disabled={isSaving}
                />
              </Field>

              <Field label="Employee Code">
                <Input
                  value={form.empCode}
                  onChange={(e) => set("empCode", e.target.value)}
                  placeholder="e.g. ACL-104"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Official Email">
                <Input
                  type="email"
                  value={form.officialGmail}
                  onChange={(e) => set("officialGmail", e.target.value)}
                  placeholder="name@aajneeti.social"
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

              <Field label="Gender">
                <Select
                  options={GENDER_OPTIONS}
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                  placeholder="Select gender"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Designation">
                <Input
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                  placeholder="e.g. Account Manager"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Department">
                <Input
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                  placeholder="e.g. Sales"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Sub Department">
                <Input
                  value={form.subDepartment}
                  onChange={(e) => set("subDepartment", e.target.value)}
                  placeholder="e.g. Inside Sales"
                  disabled={isSaving}
                />
              </Field>

              <Field label="Branch">
                <Input
                  value={form.branch}
                  onChange={(e) => set("branch", e.target.value)}
                  placeholder="e.g. Noida"
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

              <Field label="Work Mode">
                <Select
                  options={WORK_MODE_OPTIONS}
                  value={form.mode}
                  onChange={(v) => set("mode", v)}
                  placeholder="Select work mode"
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
