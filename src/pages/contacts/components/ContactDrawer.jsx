import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import Input from "components/ui/Input";
import Select from "components/ui/Select";
import { useUsers } from "hooks/useUsers";
import { useTeams } from "hooks/useTeams";
import { useAccounts } from "hooks/useAccounts";
import { getInitials } from "utils/followUpUrgency";
import { canEditRecord, canReadField } from "utils/permissions";
import {
  createContact,
  followContact,
  unfollowContact,
  updateContact,
} from "services/contact.service";
import ContactStream from "./ContactStream";

const EMPTY = {
  salutationName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  accountId: "",
  emailAddress: "",
  phoneNumber: "+91",
  phoneType: "Mobile",
  title: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressPostalCode: "",
  addressCountry: "",
  assignedUserId: "",
  teamsIds: [],
  doNotCall: false,
  description: "",
};

const SALUTATIONS = ["Mr.", "Ms.", "Mrs.", "Dr."].map((s) => ({
  value: s,
  label: s,
}));

// EspoCRM's own phone types.
const PHONE_TYPES = ["Mobile", "Office", "Home", "Fax", "Other"].map((t) => ({
  value: t,
  label: t,
}));

/**
 * EspoCRM keeps every number for a record in `phoneNumberData`; the scalar
 * `phoneNumber` is only ever the primary one. Seed the form from whichever
 * the payload actually carries.
 */
const primaryPhone = (record) => {
  const rows = Array.isArray(record?.phoneNumberData) ? record.phoneNumberData : [];
  const primary = rows.find((r) => r?.primary) || rows[0];
  return {
    phoneNumber: primary?.phoneNumber || record?.phoneNumber || "+91",
    phoneType: primary?.type || "Mobile",
  };
};

const primaryEmail = (record) => {
  const rows = Array.isArray(record?.emailAddressData) ? record.emailAddressData : [];
  const primary = rows.find((r) => r?.primary) || rows[0];
  return primary?.emailAddress || record?.emailAddress || "";
};

const digitsOf = (v) => String(v ?? "").replace(/\D/g, "");

/** Read-only row: tinted icon, label, value. */
const Field = ({ icon, tone, label, children }) => (
  <div className="flex min-w-0 items-start gap-3">
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${tone}`}
    >
      <Icon name={icon} size={17} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm text-foreground">{children}</div>
    </div>
  </div>
);

const ContactDrawer = ({ isOpen, contact, mode = "view", onClose }) => {
  const queryClient = useQueryClient();
  const { data: usersData } = useUsers();
  const { data: teamsData } = useTeams();
  // A generous page: this feeds a searchable select, not a list view.
  const { data: accountsData } = useAccounts({ limit: 200, page: 1, filters: {} });
  const [isEditing, setIsEditing] = useState(mode === "add" || mode === "edit");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("overview");
  // Seeded from the record, then owned locally so the button responds
  // immediately instead of waiting for a refetch.
  const [followed, setFollowed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (mode === "add") {
      setForm(EMPTY);
      setIsEditing(true);
      return;
    }
    if (contact) {
      setForm({
        ...EMPTY,
        ...contact,
        // Link fields and the *Data arrays need unpacking — spreading the
        // record alone would leave the selects empty and the phone blank.
        accountId: contact.accountId || "",
        assignedUserId: contact.assignedUserId || "",
        teamsIds: contact.teamsIds || [],
        emailAddress: primaryEmail(contact),
        ...primaryPhone(contact),
      });
      setIsEditing(mode === "edit");
    }
  }, [contact, mode, isOpen]);

  if (!isOpen) return null;

  const canEdit = mode === "add" || canEditRecord("Contact", contact);
  const canSeePhone = canReadField("Contact", "phoneNumber");
  const phone = digitsOf(contact?.phoneNumber);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleFollow = async () => {
    if (!contact?.id || followBusy) return;

    const next = !followed;
    // Optimistic: the button flips at once and rolls back if the call fails.
    setFollowed(next);
    setFollowBusy(true);
    try {
      if (next) await followContact(contact.id);
      else await unfollowContact(contact.id);
      queryClient.invalidateQueries({ queryKey: ["contacts"], exact: false });
    } catch (err) {
      setFollowed(!next);
      toast.error(err?.message || "Could not change follow state");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName && !form.lastName) {
      toast.error("A first or last name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        salutationName: form.salutationName || null,
        firstName: form.firstName,
        middleName: form.middleName || null,
        lastName: form.lastName,
        title: form.title || null,

        // Sent as both the scalar and the row array: the scalar is what the
        // list columns read, the array is what Espo stores. Writing only one
        // of them leaves the other stale on the record.
        emailAddress: form.emailAddress || null,
        emailAddressData: form.emailAddress
          ? [{ emailAddress: form.emailAddress, primary: true }]
          : [],
        phoneNumber: form.phoneNumber || null,
        phoneNumberData: form.phoneNumber
          ? [
              {
                phoneNumber: form.phoneNumber,
                type: form.phoneType || "Mobile",
                primary: true,
              },
            ]
          : [],

        accountId: form.accountId || null,
        addressStreet: form.addressStreet || null,
        addressCity: form.addressCity || null,
        addressState: form.addressState || null,
        addressPostalCode: form.addressPostalCode || null,
        addressCountry: form.addressCountry || null,

        assignedUserId: form.assignedUserId || null,
        teamsIds: form.teamsIds || [],
        doNotCall: !!form.doNotCall,
        description: form.description || null,
      };

      if (mode === "add") {
        await createContact(payload);
        toast.success("Contact created");
      } else {
        await updateContact(contact.id, payload);
        toast.success("Contact updated");
      }

      // Every cached page of the list is now stale, not just this one.
      queryClient.invalidateQueries({ queryKey: ["contacts"], exact: false });
      onClose();
    } catch (err) {
      toast.error(err?.message || "Could not save the contact");
    } finally {
      setSaving(false);
    }
  };

  const userOptions = (usersData?.list || []).map((u) => ({
    value: u.id,
    label: u.name,
  }));
  const teamOptions = (teamsData?.list || []).map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const accountOptions = (accountsData?.list || []).map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const displayName =
    contact?.name ||
    [form.firstName, form.lastName].filter(Boolean).join(" ") ||
    "New contact";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-dvh max-h-dvh w-full max-w-2xl flex-col border-l border-border bg-background">
        {/* Header — identity first, matching the lead drawer. */}
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {getInitials(displayName)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">
                  {mode === "add" ? "Add contact" : displayName}
                </h2>
                {mode !== "add" && (contact?.title || contact?.accountName) && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[contact?.title, contact?.accountName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <div className="order-last flex w-full shrink-0 items-center gap-2 sm:order-none sm:w-auto">
              {mode !== "add" && (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={followBusy}
                  aria-pressed={followed}
                  title={followed ? "Stop following this contact" : "Follow this contact"}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 sm:flex-none sm:py-1.5 ${
                    followed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon name={followed ? "BellRing" : "Bell"} size={14} />
                  {followed ? "Followed" : "Follow"}
                </button>
              )}

              {mode !== "add" && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    if (isEditing) setForm({ ...EMPTY, ...contact });
                    setIsEditing(!isEditing);
                  }}
                >
                  <Icon name="Edit" size={16} className="mr-1" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
              className="order-2 shrink-0 sm:order-none"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        {/* Quick actions — the two things anyone opens a contact to do. */}
        {mode === "view" && !isEditing && contact?.doNotCall && (
          <div className="flex items-center gap-2 border-b border-border bg-red-50 px-5 py-2.5 sm:px-6">
            <Icon name="PhoneOff" size={15} className="shrink-0 text-red-600" />
            <span className="text-sm font-semibold text-red-700">
              Do not call — this contact has opted out
            </span>
          </div>
        )}

        {mode === "view" && !isEditing && canSeePhone && phone && !contact?.doNotCall && (
          <div className="grid grid-cols-2 gap-2 border-b border-border px-5 py-3 sm:flex sm:flex-wrap sm:items-center sm:px-6">
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              <Icon name="Phone" size={15} />
              <span className="truncate">{contact.phoneNumber}</span>
            </a>
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Icon name="MessageCircle" size={15} />
              WhatsApp
            </a>
            {contact?.emailAddress && (
              <a
                href={`mailto:${contact.emailAddress}`}
                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100 sm:col-span-1"
              >
                <Icon name="AtSign" size={15} />
                Email
              </a>
            )}
          </div>
        )}

        {/* Tabs. Add mode has no record yet, so there is no thread to show
            and the bar is hidden rather than rendered disabled. */}
        {mode !== "add" && !isEditing && (
          <div className="overflow-x-auto whitespace-nowrap border-b border-border px-4 py-3 scrollbar-hide sm:px-6">
            <div className="flex w-full items-center gap-1 rounded-xl bg-muted/60 p-1 sm:inline-flex sm:w-auto">
              {[
                { id: "overview", label: "Overview", icon: "LayoutList" },
                { id: "stream", label: "Stream", icon: "MessageSquareText" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-smooth sm:flex-none ${
                    tab === t.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon name={t.icon} size={16} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:p-6">
          {mode !== "add" && !isEditing && tab === "stream" ? (
            <ContactStream contactId={contact?.id} />
          ) : isEditing ? (
            <form onSubmit={handleSave} className="space-y-5">
              {/* ── Identity ─────────────────────────────────────── */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Icon name="Contact" size={17} className="text-primary" />
                  Name &amp; role
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <Select
                    label="Title"
                    options={SALUTATIONS}
                    value={form.salutationName}
                    onChange={(v) => set("salutationName", v)}
                    clearable
                  />
                  <Input
                    label="First name *"
                    placeholder="First"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                  <Input
                    label="Middle name"
                    placeholder="Middle"
                    value={form.middleName}
                    onChange={(e) => set("middleName", e.target.value)}
                  />
                  <Input
                    label="Last name"
                    placeholder="Last"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />

                  <div className="sm:col-span-2">
                    <Select
                      label="Account"
                      placeholder="Link to an account"
                      options={accountOptions}
                      value={form.accountId}
                      onChange={(v) => set("accountId", v)}
                      searchable
                      clearable
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Job title"
                      placeholder="e.g. Procurement Head"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── Reaching them ────────────────────────────────── */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Icon name="PhoneCall" size={17} className="text-primary" />
                  Contact details
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="name@company.com"
                      value={form.emailAddress}
                      onChange={(e) => set("emailAddress", e.target.value)}
                    />
                  </div>

                  <Select
                    label="Phone type"
                    options={PHONE_TYPES}
                    value={form.phoneType}
                    onChange={(v) => set("phoneType", v)}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Phone"
                      placeholder="+91 00000 00000"
                      value={form.phoneNumber}
                      onChange={(e) => set("phoneNumber", e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={!!form.doNotCall}
                        onChange={(e) => set("doNotCall", e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[color:var(--color-primary)]"
                      />
                      Do not call
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Address ──────────────────────────────────────── */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Icon name="MapPin" size={17} className="text-primary" />
                  Address
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <Input
                      label="Street"
                      placeholder="Street"
                      value={form.addressStreet}
                      onChange={(e) => set("addressStreet", e.target.value)}
                    />
                  </div>
                  <Input
                    label="City"
                    placeholder="City"
                    value={form.addressCity}
                    onChange={(e) => set("addressCity", e.target.value)}
                  />
                  <Input
                    label="State"
                    placeholder="State"
                    value={form.addressState}
                    onChange={(e) => set("addressState", e.target.value)}
                  />
                  <Input
                    label="Postal code"
                    placeholder="Postal code"
                    value={form.addressPostalCode}
                    onChange={(e) => set("addressPostalCode", e.target.value)}
                  />
                  <div className="sm:col-span-3">
                    <Input
                      label="Country"
                      placeholder="Country"
                      value={form.addressCountry}
                      onChange={(e) => set("addressCountry", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── Ownership ────────────────────────────────────── */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Icon name="UserCog" size={17} className="text-primary" />
                  Ownership &amp; notes
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Assigned user"
                    options={userOptions}
                    value={form.assignedUserId}
                    onChange={(v) => set("assignedUserId", v)}
                    searchable
                    clearable
                  />
                  <Select
                    label="Teams"
                    options={teamOptions}
                    value={form.teamsIds}
                    onChange={(v) => set("teamsIds", Array.isArray(v) ? v : v ? [v] : [])}
                    multiple
                    searchable
                    clearable
                  />
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Anything worth remembering about this contact…"
                      className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {mode === "add" ? "Create contact" : "Save changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Icon name="Contact" size={17} className="text-primary" />
                  Contact
                </h3>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Field icon="AtSign" tone="bg-violet-50 text-violet-600 ring-violet-100" label="Email">
                    {contact?.emailAddress ? (
                      <a href={`mailto:${contact.emailAddress}`} className="text-primary hover:underline">
                        {contact.emailAddress}
                      </a>
                    ) : (
                      "None"
                    )}
                  </Field>

                  <Field icon="Phone" tone="bg-blue-50 text-blue-600 ring-blue-100" label="Phone">
                    {canSeePhone ? contact?.phoneNumber || "None" : "Restricted"}
                  </Field>

                  <Field icon="Briefcase" tone="bg-amber-50 text-amber-600 ring-amber-100" label="Job title">
                    {contact?.title || "None"}
                  </Field>

                  <Field icon="Building2" tone="bg-cyan-50 text-cyan-600 ring-cyan-100" label="Account">
                    {contact?.accountName || "None"}
                  </Field>

                  <Field icon="MapPin" tone="bg-rose-50 text-rose-600 ring-rose-100" label="Address">
                    {[
                      contact?.addressStreet,
                      contact?.addressCity,
                      contact?.addressState,
                      contact?.addressPostalCode,
                      contact?.addressCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") || "None"}
                  </Field>

                  <Field icon="Users" tone="bg-indigo-50 text-indigo-600 ring-indigo-100" label="Teams">
                    {Object.values(contact?.teamsNames || {}).join(", ") || "None"}
                  </Field>

                  <Field icon="UserCog" tone="bg-emerald-50 text-emerald-600 ring-emerald-100" label="Owner">
                    {contact?.assignedUserName || "Unassigned"}
                  </Field>

                  <div className="sm:col-span-2">
                    <Field icon="FileText" tone="bg-slate-50 text-slate-600 ring-slate-200" label="Notes">
                      {contact?.description || "None"}
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ContactDrawer;
