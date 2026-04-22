import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import MetricsCard from "./components/MetricsCard";
import FilterControls from "./components/FilterControls";
import TablePagination from "./components/TablePagination";
import { fetchSources, fetchStatus } from "services/others.service";
import Button from "components/ui/Button";
import Icon from "../../components/AppIcon";
import DealsTable from "./components/DealsTable";
import AttendanceCalendar from "./components/AttendanceCalendar";
import { useCalender } from "hooks/useCalender";
import AttendanceDrawer from "./components/AttendanceDrawer";

const Attendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [source, setSource] = useState([]);
  const [status, setStatus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create"); // create | edit | view
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateType: "",
    createdByName: "",
    closeDateFrom: "",
    closeDateTo: "",
  });
  const { data, isLoading } = useCalender({
    limit,
    page,
    filters
  });
  
  const mockcalender = data?.list || [];
  const total = data?.total || 0;


  const STATUS = ["Approved", "Pending"];
  useEffect(() => {
    const loadSource = async () => {
      try {
        const data = await fetchSources();
        setSource(data.options || []);
        // console.log(data.list);
      } catch (error) {
        console.log("failed to fetch data", error);
      } finally {
      }
    };
    loadSource();
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      dateType: "",
      createdByName: "",
      closeDateFrom: "",
      closeDateTo: "",
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

  // fetch status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await fetchStatus();
        setStatus(data.options || []);
        console.log(data.list);
      } catch (error) {
        console.log("failed to fetch data", error);
      } finally {
      }
    };
    loadStatus();
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
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
        value: total || 0,
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
    setDrawerMode("create");
    setSelectedDeal(null);
    setIsDrawerOpen(true);
  };

  // ✅ VIEW (row click)
  const handleView = (deal) => {
    setDrawerMode("view");
    setSelectedDeal(deal);
    setIsDrawerOpen(true);
  };

  // ✅ EDIT
  const handleEdit = (deal) => {
    setDrawerMode("edit");
    setSelectedDeal(deal);
    setIsDrawerOpen(true);
  };

  // ✅ CLOSE
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDeal(null);
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
                  <Button
                    onClick={handleCreate}
                    className="linearbg-1 text-white hover:text-white"
                  >
                    Create Attendance Request
                  </Button>
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
            {showAnalytics && (
              <>
                <div className="flex justify-end items-end mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAnalytics((prev) => !prev)}
                  >
                    <Icon name="X" size={20} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-1 gap-8 mb-8">
                  {/* Conversion Funnel */}
                  <AttendanceCalendar
                    attendanceData={mockcalender}
                    onDateChange={setDateRange}
                  />
                </div>
              </>
            )}
            {/* table */}
            <DealsTable
              deals={mockcalender}
              selectedDeals={selectedDeals}
              sortConfig={sortConfig}
              onSelectDeal={handleSelectDeal}
              onSort={handleSort}
              onDealClick={handleView}   // ✅ ADD
              onEdit={handleEdit}        // ✅ ADD
              onDelete={(deal) => console.log("delete", deal)} // optional
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
            setIsDrawerOpen(false);
          }}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};

export default Attendance;
