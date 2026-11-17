import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Papa from "papaparse";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import AccountsTable from "./components/AccountsTable";
import AccountsFilters from "./components/AccountsFilters";
import AccountDrawer from "./components/AccountDrawer";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "services/account.service";
import toast from "react-hot-toast";
import ImportModel from "./components/ImportModel";
import { useAccounts, useAccountTypeCounts } from "hooks/useAccounts";
import { useIsMobile } from "hooks/useIsMobile";
import { motion } from "framer-motion";
import KPICard from "pages/dashboard/components/KPICard";

// The three billing arrangements the Account `type` enum uses. Order here
// drives the order of the KPI row.
const ACCOUNT_TYPES = ["Hybrid", "CPL", "Retainer"];

// "all" is the unfiltered account total, fetched the same cheap way, so the
// percentages below are not measured against a list total that table filters
// can move underneath them.
const COUNT_KEYS = [...ACCOUNT_TYPES, "all"];


import { useMetaData } from "hooks/useMetaData";
import { useQueryClient } from "@tanstack/react-query";
import { canCreate, canDelete, canEdit, canGlobal } from "utils/permissions";
import { FestiveRule } from "../../components/FestiveOrnament";

const AccountsPage = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params: /Account/<action>/<id?>
  const { action: urlAction, id: urlId } = useParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawerMode, setDrawerMode] = useState("view");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);

  // Drawer state is derived from the URL — single source of truth.
  // /accounts                → drawer closed
  // /Account/view/:id        → drawer open, view mode, record :id
  // /Account/edit/:id        → drawer open, edit mode, record :id
  // /Account/create          → drawer open, create mode (no id)
  // /Account/mass-update     → drawer open, mass-update mode (uses selectedAccountIds)
  useEffect(() => {
    if (urlAction === "create") {
      setSelectedAccount(null);
      setDrawerMode("create");
      setIsDrawerOpen(true);
    } else if (urlAction === "mass-update") {
      setSelectedAccount(null);
      setDrawerMode("mass-update");
      setIsDrawerOpen(true);
    } else if (urlId) {
      setSelectedAccount(urlId);
      setDrawerMode(urlAction === "edit" ? "edit" : "view");
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
      setSelectedAccount(null);
      setDrawerMode("view");
    }
  }, [urlAction, urlId]);

  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const canCreateAccount = canCreate("Account");
  const canEditAccount = canEdit("Account");
  const canDeleteAccount = canDelete("Account");
  const canExportAccount = canGlobal("exportPermission");
  const canMassUpdateAccount = canGlobal("massUpdatePermission") && canEditAccount;

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    dateType: "",
    startDate: "",
    endDate: "",
  });
  console.log("Selectde account", selectedAccount);
  const { data, isLoading } = useAccounts({ limit, page, filters });
  const { data: meta } = useMetaData();
  const queryClient = useQueryClient();
  const mockAccounts = data?.list || [];
  const industry = meta?.type || [];
  const accType = meta?.type || [];
  const total = data?.total || 0;

  // Server-side counts, one maxSize=1 request each, so these describe EVERY
  // account of that type — not just the rows on the current page the way a
  // client-side filter over `mockAccounts` would.
  const { counts: typeCounts, isLoading: countsLoading } =
    useAccountTypeCounts(COUNT_KEYS);

  const isMobile = useIsMobile();
  const allAccounts = typeCounts.all ?? 0;

  // The card itself is never altered — it is the same KPICard, with the same
  // props, that the dashboard and contacts rows use. Only the TITLE shortens
  // on a phone, because "Hybrid clients" truncates to "HYBRID CLIE..." at
  // half width while "Hybrid" fits.
  const detail = (change, comparisonLabel, description) => ({
    change,
    comparisonLabel,
    description,
  });

  // Math.round() turns a real but small share into a flat "0% of all" — the
  // 2 Hybrid accounts out of ~520 rounded to 0%, which reads as "none".
  // Anything above zero that rounds down shows "<1%" instead.
  const shareOfTotal = (count) => {
    if (!allAccounts) return "no accounts";
    const pct = (count / allAccounts) * 100;
    if (count > 0 && pct < 1) return "<1% of all";
    return `${Math.round(pct)}% of all`;
  };

  // Same card as the dashboard / contacts / sales-team rows: one colour per
  // card drives the icon badge, the surface wash and the hover glow.
  const typeKpis = [
    {
      title: isMobile ? "Hybrid" : "Hybrid clients",
      value: typeCounts.Hybrid ?? 0,
      changeType: "neutral",
      icon: "Layers",
      iconBg: "bg-primary/10",
      iconColor: "#8C1226",
      ...detail(
        shareOfTotal(typeCounts.Hybrid ?? 0),
        "across all accounts",
        "Retainer plus per-lead billing",
      ),
    },
    {
      title: isMobile ? "CPL" : "CPL clients",
      value: typeCounts.CPL ?? 0,
      changeType: "neutral",
      icon: "Target",
      iconBg: "bg-blue-100",
      iconColor: "#3B82F6",
      ...detail(
        shareOfTotal(typeCounts.CPL ?? 0),
        "across all accounts",
        "Billed per qualified lead",
      ),
    },
    {
      title: isMobile ? "Retainer" : "Retainer clients",
      value: typeCounts.Retainer ?? 0,
      changeType: "neutral",
      icon: "RefreshCw",
      iconBg: "bg-emerald-100",
      iconColor: "#2F7D53",
      ...detail(
        shareOfTotal(typeCounts.Retainer ?? 0),
        "across all accounts",
        "Fixed recurring fee",
      ),
    },
  ];
  const handleAccountSuccess = async () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });

  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleRowClick = (id, mode = "view") => {
    // Drive the drawer via the URL so the link is shareable.
    navigate(`/Account/${mode}/${id}`);
  };

  const handleDrawerClose = () => {
    // Replace so browser-back doesn't re-open the drawer.
    navigate("/accounts", { replace: true });
  };

  const handleBulkAction = async (action, ids) => {
    if (action === "delete") {
      if (!ids?.length) {
        toast.error("Select at least one account");
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete ${ids.length} account(s)?`
      );

      if (!confirmed) return;

      try {
        toast.loading("Deleting account(s)...", {
          id: "delete-accounts",
        });

        // bulk delete safely
        await Promise.all(ids.map((id) => deleteAccount(id)));

        toast.success(`${ids.length} account(s) deleted`, {
          id: "delete-accounts",
        });

        // refresh table
        queryClient.invalidateQueries(["accounts"]);

        // clear selected
        setSelectedAccountIds([]);
      } catch (error) {
        console.error("Delete failed:", error);

        toast.error(
          error?.message || "Failed to delete account(s)",
          {
            id: "delete-accounts",
          }
        );
      }

      return;
    }

    if (action === "mass-update") {
      if (!ids.length) {
        alert("Select at least one account");
        return;
      }

      setSelectedAccountIds(ids);
      navigate("/Account/mass-update");
      return;
    }

    if (action === "export") {
      const accountsToExport =
        ids && ids.length > 0
          ? filteredAccounts.filter((acc) => ids.includes(acc.id))
          : filteredAccounts;

      if (!accountsToExport.length) {
        toast.error("No accounts to export");
        return;
      }

      handleExportAccount(accountsToExport);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleAccountButton = () => {
    if (!canCreateAccount) return;
    navigate("/Account/create");
  };
  // handle exports (bulk and indivisual)
  const handleExportAccount = (account) => {
    if (!canExportAccount) return;
    try {
      const exportData = account.map((account) => ({
        Name: account?.name || "",
        Industry: account?.industry || "",
        Website: account?.website || "",
        Phone: account?.phoneNumber || "",

        "Billing Street": account?.billingAddressStreet || "",
        "Billing City": account?.billingAddressCity || "",
        "Billing State": account?.billingAddressState || "",
        "Billing Country": account?.billingAddressCountry || "",
        "Billing Postal Code": account?.billingAddressPostalCode || "",

        Type: account?.type || "",
        Description: account?.description || "",
        "Created By": account?.createdByName || "",
        "Created At": account?.createdAt || "",
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `accounts_export_${new Date().toISOString().split("T")[0]
        }.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      alert(`Successfully exported ${exportData.length} accounts`);
    } catch (error) {
      console.error("Error exporting accounts:", error);
      alert("Failed to export accounts. Please try again.");
    }
  };
  const handleImportAccounts = async (rows) => {
    if (!canCreateAccount) return;
    try {
      toast.loading("Importing accounts...", { id: "import" });

      let success = 0;
      let failed = 0;
      const failedRows = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          const payload = {
            name: row.Name?.trim(),
            industry: row.Industry || "",
            website: row.Website || "",
            phoneNumber: row.Phone?.toString() || "",
            type: row.Type?.toLowerCase() || "",
            description: row.Description || "",

            // 🔥 usually required
            status: "active",
            source: "import",
          };

          // 🔒 frontend validation
          if (!payload.name) {
            failed++;
            failedRows.push({
              row: i + 1,
              reason: "Name is missing",
            });
            continue;
          }

          await createAccount(payload);
          queryClient.invalidateQueries(["accounts"]);
          success++;
        } catch (err) {
          console.error("❌ Import API error (full):", err);

          console.error("❌ response:", err?.response);
          console.error("❌ response data:", err?.response?.data);
          console.error("❌ status:", err?.response?.status);

          failedRows.push({
            row: i + 1,
            name: row.Name,
            error:
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              `HTTP ${err?.response?.status || "Unknown"}`,
          });
        }
      }
      if (failedRows.length) {
        console.group("❌ Account Import Failed Rows");
        console.table(failedRows);
        console.groupEnd();
      }

      toast.success(`Imported ${success} accounts (${failed} failed)`, {
        id: "import",
      });

      handleAccountSuccess();
    } catch (err) {
      toast.error("Import failed", { id: "import" });
    }
  };

  const handleBulkUpdateAccounts = async (ids, payload) => {
    if (!canMassUpdateAccount) return;
    try {
      toast.loading("Updating accounts...", { id: "bulk-update" });

      await Promise.all(ids.map((id) => updateAccount(id, payload)));

      toast.success(`${ids.length} accounts updated`, {
        id: "bulk-update",
      });

      handleAccountSuccess();
      setSelectedAccountIds([]);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };
  const handleAddActivity = (newActivity) => {
    setActivities((prev) => [newActivity, ...prev]);
  };
  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="app-main pt-16">
        <div className="p-4 lg:p-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
                Accounts
                <FestiveRule />
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your customer companies and relationships
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3 sm:mt-0 sm:space-x-3">
              <Button
                className="hidden"
                variant="outline"
                onClick={handleExportAccount}
              >
                <Icon name="Upload" size={16} className="mr-2" />
                Export
              </Button>
              {canCreateAccount && (
                <Button
                className="hidden"
                  variant="outline"
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
                >
                  <Icon name="Upload" size={16} className="mr-2" />
                  Import
                </Button>
              )}
              {canCreateAccount && (
                <Button onClick={handleAccountButton} className="linearbg-1">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Add Account
                </Button>
              )}
            </div>
          </div>

          {/* At-a-glance counts by account type, using the same KPICard the
              dashboard and contacts pages use so the row reads identically. */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {typeKpis.map((kpi, index) => (
              <motion.div
                key={kpi.title}
                // Two side by side, the third full width beneath them, until
                // the row has space for all three at xl.
                className={index === 2 ? "col-span-2 xl:col-span-1" : ""}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <KPICard {...kpi} isLoading={countsLoading} />
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <AccountsFilters
            onFiltersChange={handleFiltersChange}
            activeFilters={filters}
            resultCount={mockAccounts?.length}
            total={total}
            limit={limit}
            page={page}
          />

          {/* Accounts Table */}
          <AccountsTable
            accounts={mockAccounts}
            onRowClick={handleRowClick}
            onBulkAction={handleBulkAction}
            onSelectionChange={setSelectedAccountIds}
            isLoading={isLoading}
            page={page}
            setPage={setPage}
            total={total}
            limit={limit}
            setLimit={setLimit}
            canEdit={canEditAccount}
            canDelete={canDeleteAccount}
            canExport={canExportAccount}
            canMassUpdate={canMassUpdateAccount}
          />
        </div>
      </main>
      {/* Account Details Drawer */}
      <AccountDrawer
        accType={accType}
        industry={industry}
        accounts={selectedAccount}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleAccountSuccess}
        mode={drawerMode}
        onBulkUpdate={handleBulkUpdateAccounts}
        selectedIds={selectedAccountIds}
      />

      {/* Quick Add Activity Modal */}
      <ImportModel
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onImport={handleImportAccounts}
      />
    </div>
  );
};

export default AccountsPage;
