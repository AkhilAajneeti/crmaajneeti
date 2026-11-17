import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import Header from "components/ui/Header";
import Sidebar from "components/ui/Sidebar";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { FestiveRule } from "components/FestiveOrnament";
import TablePagination from "pages/deals/components/TablePagination";
import KPICard from "pages/dashboard/components/KPICard";
import { useIsMobile } from "hooks/useIsMobile";

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

  // Cards describe the CURRENT page, not the whole table, and say so — a total
  // that silently meant something else would be worse than none. Each card's
  // colour also drives its hover glow (see KPICard), so the maroon card lifts
  // in maroon and the violet one in violet.
  // Half-width cards cannot hold "Total contacts" without truncating, so the
  // labels shorten on a phone. The card itself is unchanged.
  const isMobile = useIsMobile();
  const pageRows = contacts.length;
  const shareOfPage = (count) =>
    pageRows ? `${Math.round((count / pageRows) * 100)}% of page` : "no rows";

  const kpis = [
    {
      title: isMobile ? "Total" : "Total contacts",
      value: total,
      change: `${pageRows} on page`,
      changeType: "neutral",
      icon: "Users",
      iconBg: "bg-primary/10",
      iconColor: "#8C1226",
      comparisonLabel: "across all pages",
    },
    {
      title: isMobile ? "Email" : "With email",
      value: summary.withEmail,
      change: shareOfPage(summary.withEmail),
      changeType: "neutral",
      icon: "AtSign",
      iconBg: "bg-violet-100",
      iconColor: "#8B5CF6",
      comparisonLabel: "this page",
    },
    {
      title: isMobile ? "Phone" : "With phone",
      value: summary.withPhone,
      change: shareOfPage(summary.withPhone),
      changeType: "neutral",
      icon: "Phone",
      iconBg: "bg-blue-100",
      iconColor: "#3B82F6",
      comparisonLabel: "this page",
    },
    {
      title: "Unassigned",
      value: summary.unassigned,
      change: shareOfPage(summary.unassigned),
      changeType: "neutral",
      icon: "UserMinus",
      iconBg: "bg-amber-100",
      iconColor: "#F59E0B",
      comparisonLabel: "this page",
    },
  ];

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

        <main className="pt-16 app-main">
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

              {/* The button was a direct child of a `flex-col` container, so
                  align-items: stretch blew it out to the full page width on a
                  phone. Wrapping it in a row — the same wrapper the Leads page
                  uses — gives it its natural width, aligned right. */}
              <div className="flex items-center justify-end space-x-3">
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
            </div>

            {/* At-a-glance counts for the page in view, using the same card as
                the dashboard / sales-team KPI row: value, one supporting chip
                and the scope it describes. */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {kpis.map((kpi, index) => (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  <KPICard {...kpi} isLoading={isLoading} />
                </motion.div>
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
