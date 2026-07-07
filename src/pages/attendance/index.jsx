import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import MetricsCard from "./components/MetricsCard";
import FilterControls from "./components/FilterControls";
import TablePagination from "./components/TablePagination";
import Button from "components/ui/Button";
import Icon from "../../components/AppIcon";
import DealsTable from "./components/DealsTable";
import AttendanceCalendar from "./components/AttendanceCalendar";
import { useCalender } from "hooks/useCalender";
import AttendanceDrawer from "./components/AttendanceDrawer";
import {
  canCreate,
  canDeleteRecord,
  canEdit,
  canEditField,
  canEditRecord,
} from "utils/permissions";
import { deleteAttendance } from "services/calender.service";

// Persist list view-state (filters/page/limit/sort) per browser-tab session so it
// survives the remount that happens when the detail/drawer route opens & closes.
const ATTENDANCE_VIEW_KEY = "attendance_view_state";
const loadAttendanceView = () => {
  try {
    return JSON.parse(sessionStorage.getItem(ATTENDANCE_VIEW_KEY)) || {};
  } catch {
    return {};
  }
};

const Attendance = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params: /CAttendanceRequest/<action>/<id?>
  const { action: urlAction, id: urlId } = useParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedDeals, setSelectedDeals] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create"); // create | edit | view
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [limit, setLimit] = useState(() => loadAttendanceView().limit ?? 20);
  const [page, setPage] = useState(() => loadAttendanceView().page ?? 1);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [sortConfig, setSortConfig] = useState(
    () =>
      loadAttendanceView().sortConfig || { key: "createdAt", direction: "desc" }
  );
  const [filters, setFilters] = useState(
    () =>
      loadAttendanceView().filters || {
        search: "",
        status: "",
        // Default view: the current month is pre-selected.
        dateType: "month",
        requestType: "",
        createdById: "",
        closeDateFrom: "",
        closeDateTo: "",
        month: new Date().getMonth(),
      }
  );
  const canCreateAttendance = canCreate("CAttendanceRequest");
  const canEditAttendance = canEdit("CAttendanceRequest");
  const canEditAttendanceStatus =
    canEditAttendance &&
    canEditRecord("CAttendanceRequest", selectedDeal) &&
    canEditField("CAttendanceRequest", "status");
  const canEditDepartment =
    canEditRecord("CAttendanceRequest", selectedDeal) &&
    canEditField("CAttendanceRequest", "department");

  const canEditEmployeeCode =
    canEditRecord("CAttendanceRequest", selectedDeal) &&
    canEditField("CAttendanceRequest", "employeeCode");

  const { data, isLoading, refetch } = useCalender({
    limit,
    page,
    filters
  });

  const mockcalender = data?.list || [];
  const total = data?.total || 0;

  // Persist the list view-state so it survives the drawer-route remount.
  useEffect(() => {
    sessionStorage.setItem(
      ATTENDANCE_VIEW_KEY,
      JSON.stringify({ filters, page, limit, sortConfig })
    );
  }, [filters, page, limit, sortConfig]);

  // Drawer state derived from URL — single source of truth.
  // /attendance                          → drawer closed
  // /CAttendanceRequest/view/:id         → drawer open, view mode, record :id
  // /CAttendanceRequest/edit/:id         → drawer open, edit mode, record :id
  // /CAttendanceRequest/create           → drawer open, create mode
  // /CAttendanceRequest/mass-update      → drawer open, mass-update mode
  useEffect(() => {
    if (urlAction === "create") {
      setSelectedDeal(null);
      setDrawerMode("create");
      setIsDrawerOpen(true);
    } else if (urlAction === "mass-update") {
      setSelectedDeal(null);
      setDrawerMode("mass-update");
      setIsDrawerOpen(true);
    } else if (urlId) {
      // If we don't already have the full record (deep-link cold start),
      // start with a minimal placeholder; the promote effect below will
      // upgrade it once the list query resolves with the matching record.
      setSelectedDeal((current) =>
        current?.id === urlId ? current : { id: urlId }
      );
      setDrawerMode(urlAction === "edit" ? "edit" : "view");
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
      setSelectedDeal(null);
    }
  }, [urlAction, urlId]);

  // Promote the {id} placeholder into the full record once the list resolves —
  // so parent-level permission props (canEditStatus, canEditDep, etc.) evaluate
  // against the real assignedUserId / createdById instead of just the id.
  useEffect(() => {
    if (!urlId || !mockcalender.length) return;
    const fullDeal = mockcalender.find((d) => d.id === urlId);
    if (!fullDeal) return;
    setSelectedDeal((current) => {
      if (current?.id === urlId && !current.assignedUserId) return fullDeal;
      return current;
    });
  }, [mockcalender, urlId]);

  const STATUS = ["Approved", "Pending", "Rejected", "LWP"];


  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      dateType: "",
      requestType: "",
      createdById: "",
      closeDateFrom: "",
      closeDateTo: "",
      month: "",
    });
    setPage(1);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };
  const handleSelectDeal = (dealId, isSelected) => {
    if (isSelected) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals?.filter((id) => id !== dealId));
    }
  };
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Close sidebar on route change or outside click
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(total / limit);
  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig?.key === key && prevConfig?.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const metricsData = useMemo(() => {
    const countByType = (data, type) =>
      mockcalender?.filter((deal) => deal?.requestType === type)?.length || 0;

    const currentData = mockcalender;

    return [
      {
        title: "Total Leaves",
        value:
          mockcalender?.filter(
            (deal) => deal?.requestType !== "SLC"
          )?.length || 0,
        icon: "TrendingUp",
        iconColor: "bg-success",
        description: "All leave requests",
      },
      {
        title: "Short Leave",
        value: countByType(currentData, "Short Leave"),
        icon: "Clock",
        iconColor: "bg-purple-400",
        description: "Short duration leaves",
      },
      {
        title: "Half Day",
        value: countByType(currentData, "Half Day"),
        icon: "XCircle",
        iconColor: "bg-red-400",
        description: "Half day leaves",
      },
      {
        title: "Full Day",
        value: countByType(currentData, "Leave"),
        icon: "Calendar",
        iconColor: "bg-blue-400",
        description: "Full day leaves",
      },
    ];
  }, [mockcalender, total]);
  // ✅ CREATE
  const handleCreate = () => {
    if (!canCreateAttendance) return;
    navigate("/CAttendanceRequest/create");
  };

  // ✅ VIEW (row click) — set full deal first so permission props are correct
  // immediately; the URL effect sees the matching id and won't overwrite.
  const handleView = (deal) => {
    setSelectedDeal(deal);
    navigate(`/CAttendanceRequest/view/${deal.id}`);
  };

  // ✅ EDIT — same pattern: keep the full deal in state for permissions.
  const handleEdit = (deal) => {
    if (!canEditRecord("CAttendanceRequest", deal)) return;
    setSelectedDeal(deal);
    navigate(`/CAttendanceRequest/edit/${deal.id}`);
  };
  const handleDelete = async (deal) => {
    try {
      const ok = window.confirm(`Delete request "${deal?.name}"?`);
      if (!ok) return;

      await deleteAttendance(deal.id);

      await refetch();

    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ✅ CLOSE — replace so browser-back doesn't re-open the drawer.
  const handleDrawerClose = () => {
    navigate("/attendance", { replace: true });
  };
  return (
    <>
      <Helmet>
        <title>Attendance Request</title>
        <meta
          name="description"
          content="Comprehensive sales analytics with interactive visualizations and export capabilities for data-driven decision making"
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header
          onMenuToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Attendance Request
                  </h1>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span>Live data</span>
                  </div>
                  {canCreateAttendance && (
                    <Button
                      onClick={handleCreate}
                      className="linearbg-1 text-white hover:text-white"
                    >
                      Create Attendance Request
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Key Metrics Cards */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
            >
              {metricsData?.map((metric, index) => (
                <MetricsCard
                  key={metric?.title}
                  title={metric?.title}
                  value={metric?.value}
                  change={metric?.change}
                  changeType={metric?.changeType}
                  icon={metric?.icon}
                  iconColor={metric?.iconColor}
                  description={metric?.description}
                />
              ))}
            </motion.div>

            {/* Filter Controls */}
            <FilterControls
              filters={filters}
              status={STATUS}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              dealCount={total}
              selectedCount={selectedDeals?.length}
              toggleAnalytics={() => setShowAnalytics((prev) => !prev)}
            />

            {/* Charts Grid */}
            <AnimatePresence mode="wait">
              {showAnalytics && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1], // smooth cubic
                  }}
                  className="mb-8"
                >

                  {/* Calendar */}
                  <AttendanceCalendar
                    attendanceData={mockcalender}
                    onDateChange={setDateRange}
                    onCloseCalendar={() => setShowAnalytics(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {/* table */}
            <DealsTable
              deals={mockcalender}
              selectedDeals={selectedDeals}
              sortConfig={sortConfig}
              onSelectDeal={handleSelectDeal}
              onSort={handleSort}
              onDealClick={handleView}   // ✅ ADD
              onEdit={handleEdit}        // ✅ ADD
              onDelete={handleDelete} // optional
              canEdit={(deal) => canEditRecord("CAttendanceRequest", deal)}
              canDelete={(deal) => canDeleteRecord("CAttendanceRequest", deal)}
              currentPage={page}
              itemsPerPage={limit}
              isLoading={isLoading}
              setPage={setPage}
              total={total}
              limit={limit}
              setLimit={setLimit}
            />
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
        </main>
        <AttendanceDrawer
          isOpen={isDrawerOpen}          // ✅ REQUIRED
          onClose={handleDrawerClose}
          onDealClick={handleView}
          onEdit={handleEdit}
          mode={drawerMode}
          data={selectedDeal}   // ✅ single record
          onSuccess={() => {
            navigate("/attendance", { replace: true });
            refetch();
          }}
          isLoading={isLoading}
          canCreate={canCreateAttendance}
          canEdit={canEditRecord("CAttendanceRequest", selectedDeal)}
          canEditStatus={canEditAttendanceStatus}
          canEditDep={canEditDepartment}
          canEditEmpCode={canEditEmployeeCode}
        />
      </div>
    </>
  );
};

export default Attendance;
