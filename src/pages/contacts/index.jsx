import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import Header from "components/ui/Header";
import Sidebar from "components/ui/Sidebar";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { FestiveRule } from "components/FestiveOrnament";
import TablePagination from "pages/deals/components/TablePagination";

import ContactsTable from "./components/ContactsTable";
import ContactsFilters, { EMPTY_FILTERS } from "./components/ContactsFilters";
import ContactDrawer from "./components/ContactDrawer";
import { useContactById, useContactsList } from "hooks/useContacts";
import { bulkDeleteContacts } from "services/contact.service";
import { canCreate, canDelete } from "utils/permissions";

const ContactsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Deep-link params: /Contact/view/:id, /Contact/edit/:id, /Contact/create.
  const { action: urlAction, id: urlId } = useParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawer, setDrawer] = useState({ open: false, mode: "view", contact: null });

  const { data: single } = useContactById(urlId);

  const { data, isLoading, isFetching } = useContactsList({
    limit,
    page,
    filters,
    sort,
  });

  const contacts = data?.list || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // The URL drives the drawer, not the other way round — that is what makes
  // a pasted link open straight onto a contact.
  useEffect(() => {
    if (urlAction === "create") {
      setDrawer({ open: true, mode: "add", contact: null });
    } else if (urlId) {
      // Row data is used first so the drawer paints instantly; the fetched
      // record replaces it once it lands, which also covers a cold load
      // where the list has not been fetched yet.
      const fromList = contacts.find((c) => c.id === urlId);
      setDrawer({
        open: true,
        mode: urlAction === "edit" ? "edit" : "view",
        contact: single || fromList || { id: urlId },
      });
    } else {
      setDrawer({ open: false, mode: "view", contact: null });
    }
  }, [urlAction, urlId, single, contacts]);

  const canAdd = canCreate("Contact");
  const canRemove = canDelete("Contact");

  // Any change to what is being listed invalidates the current page number —
  // page 4 of a differently filtered set is a different set of people.
  const applyFilters = (next) => {
    setFilters(next);
    setPage(1);
    setSelectedIds([]);
  };

  const handleSort = (key) => {
    setSort((s) =>
      s.key === key
        ? { key, direction: s.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
    setPage(1);
  };

  const toggleSelect = (id) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const toggleAll = () =>
    setSelectedIds((ids) =>
      ids.length === contacts.length ? [] : contacts.map((c) => c.id)
    );

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const ok = window.confirm(
      `Delete ${selectedIds.length} contact${selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`
    );
    if (!ok) return;

    try {
      await bulkDeleteContacts(selectedIds);
      toast.success(`${selectedIds.length} deleted`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["contacts"], exact: false });
    } catch (err) {
      toast.error(err?.message || "Could not delete the selected contacts");
    }
  };

  const summary = useMemo(() => {
    const withEmail = contacts.filter((c) => c.emailAddress).length;
    const withPhone = contacts.filter((c) => c.phoneNumber).length;
    const unassigned = contacts.filter((c) => !c.assignedUserName).length;
    return { withEmail, withPhone, unassigned };
  }, [contacts]);

  return (
    <>
      <Helmet>
        <title>Contacts - Aajneeti Connect ltd</title>
        <meta
          name="description"
          content="Browse, search and manage every contact in your CRM."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header
          onMenuToggle={() => setIsSidebarOpen((v) => !v)}
          isSidebarOpen={isSidebarOpen}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="pt-16 lg:ml-64">
          <div className="p-4 lg:p-6">
            {/* Page header */}
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground lg:text-3xl">
                  Contacts
                  <FestiveRule />
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Every person behind your accounts, in one place
                </p>
              </div>

              {canAdd && (
                <Button
                  className="linearbg-1 text-white hover:text-white"
                  onClick={() => navigate("/Contact/create")}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Contact
                </Button>
              )}
            </div>

            {/* At-a-glance counts for the page in view. These describe the
                CURRENT page, not the whole table, and say so — a total that
                silently meant something else would be worse than none. */}
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Total contacts", value: total, hint: "all pages", icon: "Users", tone: "bg-primary/10 text-primary" },
                { label: "With email", value: summary.withEmail, hint: "this page", icon: "AtSign", tone: "bg-violet-100 text-violet-700" },
                { label: "With phone", value: summary.withPhone, hint: "this page", icon: "Phone", tone: "bg-blue-100 text-blue-700" },
                { label: "Unassigned", value: summary.unassigned, hint: "this page", icon: "UserMinus", tone: "bg-amber-100 text-amber-800" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-elevation-1 sm:p-4"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                    <Icon name={s.icon} size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {isLoading ? "—" : s.value}
                      <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">
                        {s.hint}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <ContactsFilters
              filters={filters}
              onChange={applyFilters}
              onClear={() => applyFilters({ ...EMPTY_FILTERS })}
              total={total}
              selectedCount={selectedIds.length}
              onBulkDelete={handleBulkDelete}
              canDelete={canRemove}
            />

            <ContactsTable
              contacts={contacts}
              isLoading={isLoading}
              sort={sort}
              onSort={handleSort}
              onOpen={(c) => navigate(`/Contact/view/${c.id}`)}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAll}
            />

            <div className="mt-4">
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
                onPageChange={setPage}
                onItemsPerPageChange={(val) => {
                  setLimit(val);
                  setPage(1);
                }}
              />
            </div>

            {isFetching && !isLoading && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Updating…
              </p>
            )}
          </div>
        </main>

        <ContactDrawer
          isOpen={drawer.open}
          mode={drawer.mode}
          contact={drawer.contact}
          onClose={() => navigate("/contacts", { replace: true })}
        />
      </div>
    </>
  );
};

export default ContactsPage;
