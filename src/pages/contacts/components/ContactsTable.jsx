import React from "react";
import Icon from "components/AppIcon";
import { getInitials } from "utils/followUpUrgency";
import { canReadField } from "utils/permissions";

// A stable colour per contact, derived from their id, so the same person
// keeps the same tint as the table sorts or pages. Literal class strings —
// Tailwind cannot see a class assembled from an index.
const TINTS = [
  { ring: "ring-rose-200", chip: "bg-rose-100 text-rose-700", name: "text-rose-700", row: "hover:bg-rose-50" },
  { ring: "ring-amber-200", chip: "bg-amber-100 text-amber-800", name: "text-amber-800", row: "hover:bg-amber-50" },
  { ring: "ring-emerald-200", chip: "bg-emerald-100 text-emerald-700", name: "text-emerald-700", row: "hover:bg-emerald-50" },
  { ring: "ring-violet-200", chip: "bg-violet-100 text-violet-700", name: "text-violet-700", row: "hover:bg-violet-50" },
  { ring: "ring-cyan-200", chip: "bg-cyan-100 text-cyan-700", name: "text-cyan-700", row: "hover:bg-cyan-50" },
  { ring: "ring-indigo-200", chip: "bg-indigo-100 text-indigo-700", name: "text-indigo-700", row: "hover:bg-indigo-50" },
  { ring: "ring-teal-200", chip: "bg-teal-100 text-teal-700", name: "text-teal-700", row: "hover:bg-teal-50" },
  { ring: "ring-fuchsia-200", chip: "bg-fuchsia-100 text-fuchsia-700", name: "text-fuchsia-700", row: "hover:bg-fuchsia-50" },
];

const tintFor = (key) => {
  const str = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
};

const digitsOf = (v) => String(v ?? "").replace(/\D/g, "");

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T") + (/[zZ]$/.test(value) ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const SortHeader = ({ id, label, sort, onSort, className = "" }) => {
  const active = sort?.key === id;
  return (
    <th className={`px-4 py-3 text-left ${className}`}>
      <button
        type="button"
        onClick={() => onSort(id)}
        className={`inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors ${
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <Icon
          name={active && sort.direction === "asc" ? "ArrowUp" : "ArrowDown"}
          size={12}
          className={active ? "opacity-100" : "opacity-30"}
        />
      </button>
    </th>
  );
};

const SkeletonRow = () => (
  <tr className="border-t border-border">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </td>
    ))}
  </tr>
);

/**
 * One contact as a card, for narrow screens.
 *
 * A six-column table cannot shrink to a phone — hiding columns until it fits
 * leaves a name and a chevron, which tells you nothing. The card keeps every
 * field that matters and stacks it: identity on the top line, the supporting
 * detail as labelled rows, and the actions pinned to the right where a thumb
 * reaches them.
 */
const ContactCard = ({
  contact: c,
  checked,
  onToggle,
  onOpen,
  canSeePhone,
}) => {
  const tint = tintFor(c.id || c.name);
  const phone = digitsOf(c.phoneNumber);
  const callable = canSeePhone && phone && !c.doNotCall;

  const rows = [
    c.assignedUserName && { icon: "User", text: c.assignedUserName },
    c.accountName && { icon: "Building2", text: c.accountName },
    { icon: "Calendar", text: formatDate(c.createdAt) },
  ].filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(c)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(c);
        }
      }}
      className={`rounded-2xl border border-border bg-card p-4 shadow-elevation-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tint.row}`}
    >
      {/* Top line: select, name, and the one status worth seeing at a glance */}
      <div className="flex items-start gap-3">
        <span onClick={(e) => e.stopPropagation()} className="pt-0.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggle(c.id)}
            aria-label={`Select ${c.name}`}
            className="h-4 w-4 cursor-pointer rounded border-border accent-[color:var(--color-primary)]"
          />
        </span>

        <p className="min-w-0 flex-1 truncate text-[16px] font-bold text-foreground">
          {c.name || "Unnamed"}
        </p>

        {c.doNotCall ? (
          <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
            Do not call
          </span>
        ) : (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tint.chip} border-transparent`}
          >
            {c.accountType || "Contact"}
          </span>
        )}
      </div>

      {/* Detail rows on the left, actions on the right */}
      <div className="mt-3 flex items-center gap-3 pl-7">
        <div className="min-w-0 flex-1 space-y-1.5">
          {rows.map((r) => (
            <p
              key={r.icon}
              className="flex items-center gap-2 text-[13px] text-muted-foreground"
            >
              <Icon name={r.icon} size={13} className="shrink-0 opacity-70" />
              <span className="truncate text-foreground">{r.text}</span>
            </p>
          ))}
        </div>

        <span
          onClick={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center gap-2"
        >
          {callable ? (
            <>
              <a
                href={`tel:${phone}`}
                aria-label={`Call ${c.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-50"
              >
                <Icon name="PhoneCall" size={18} />
              </a>
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Message ${c.name} on WhatsApp`}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#25D366]/15 active:scale-95"
              >
                <img
                  src="/assets/whatsapp-logo.png"
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              </a>
            </>
          ) : (
            <span
              aria-label="Calling is restricted"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground/60"
            >
              <Icon name="PhoneOff" size={18} />
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

const ContactsTable = ({
  contacts = [],
  isLoading,
  sort,
  onSort,
  onOpen,
  selectedIds = [],
  onToggleSelect,
  onToggleAll,
}) => {
  // Masked roles must not get a number through a tel: link or a wa.me URL.
  const canSeePhone = canReadField("Contact", "phoneNumber");
  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  return (
    <>
    {/* Cards below md, the table above it. */}
    <div className="space-y-3 md:hidden">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[150px] animate-pulse rounded-2xl bg-muted" />
        ))
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <Icon name="Users" size={22} className="mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">No contacts yet</p>
          <p className="text-xs text-muted-foreground">
            Add your first contact, or widen the filters above.
          </p>
        </div>
      ) : (
        contacts.map((c) => (
          <ContactCard
            key={c.id}
            contact={c}
            checked={selectedIds.includes(c.id)}
            onToggle={onToggleSelect}
            onOpen={onOpen}
            canSeePhone={canSeePhone}
          />
        ))
      )}
    </div>

    <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-elevation-1 md:block">
      <table className="w-full">
        <thead className="festive-thead">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Select all contacts"
                className="h-4 w-4 cursor-pointer rounded border-border accent-[color:var(--color-primary)]"
              />
            </th>
            <SortHeader id="name" label="Name" sort={sort} onSort={onSort} />
            <SortHeader id="accountName" label="Account" sort={sort} onSort={onSort} className="hidden md:table-cell" />
            <SortHeader id="phoneNumber" label="Phone" sort={sort} onSort={onSort} className="hidden lg:table-cell" />
            <SortHeader id="createdAt" label="Created At" sort={sort} onSort={onSort} className="hidden lg:table-cell" />
            <SortHeader id="createdByName" label="Created By" sort={sort} onSort={onSort} className="hidden xl:table-cell" />
            <SortHeader id="modifiedAt" label="Modified At" sort={sort} onSort={onSort} className="hidden 2xl:table-cell" />
            <th className="px-4 py-3 text-right text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : contacts.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Icon name="Users" size={22} />
                  </span>
                  <p className="text-sm font-semibold text-foreground">No contacts yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add your first contact, or widen the filters above.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            contacts.map((c) => {
              const tint = tintFor(c.id || c.name);
              const phone = digitsOf(c.phoneNumber);
              const checked = selectedIds.includes(c.id);

              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c)}
                  className={`group cursor-pointer border-t border-border transition-colors ${tint.row}`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSelect(c.id)}
                      aria-label={`Select ${c.name}`}
                      className="h-4 w-4 cursor-pointer rounded border-border accent-[color:var(--color-primary)]"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ${tint.chip} ${tint.ring}`}
                      >
                        {getInitials(c.name)}
                      </span>
                      <div className="min-w-0">
                        <p className={`truncate text-[15px] font-bold ${tint.name}`}>
                          {c.name || "Unnamed"}
                        </p>
                        <p className="truncate text-[12.5px] text-muted-foreground">
                          {c.emailAddress || "No email on file"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="hidden px-4 py-3 md:table-cell">
                    {c.accountName ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12.5px] font-medium text-foreground">
                        <Icon name="Building2" size={12} className="text-muted-foreground" />
                        {c.accountName}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="hidden px-4 py-3 lg:table-cell">
                    {c.phoneNumber ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-[15px] tabular-nums text-foreground">
                          {c.phoneNumber}
                        </span>
                        {c.doNotCall && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            Do not call
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="hidden px-4 py-3 text-[13px] tabular-nums text-muted-foreground lg:table-cell">
                    {formatDate(c.createdAt)}
                  </td>

                  <td className="hidden px-4 py-3 xl:table-cell">
                    {c.createdByName ? (
                      // Tinted per author, same hashing the avatars use, so a
                      // name is recognisable by colour as you scan the column.
                      <span
                        className={`inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[12.5px] font-semibold ${tintFor(c.createdByName).chip}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-[9px] font-bold">
                          {getInitials(c.createdByName)}
                        </span>
                        <span className="truncate">{c.createdByName}</span>
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="hidden px-4 py-3 text-[13px] tabular-nums text-muted-foreground 2xl:table-cell">
                    {formatDate(c.modifiedAt)}
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {canSeePhone && phone && !c.doNotCall ? (
                        <>
                          <a
                            href={`tel:${phone}`}
                            aria-label={`Call ${c.name}`}
                            title={c.phoneNumber}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                          >
                            <Icon name="PhoneCall" size={16} />
                          </a>
                          <a
                            href={`https://wa.me/${phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Message ${c.name} on WhatsApp`}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
                          >
                            <Icon name="MessageCircle" size={16} />
                          </a>
                        </>
                      ) : (
                        <span
                          aria-label="Contact details are restricted"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground/60"
                        >
                          <Icon name="PhoneOff" size={16} />
                        </span>
                      )}

                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default ContactsTable;
