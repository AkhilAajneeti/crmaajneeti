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

const Attendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [source, setSource] = useState([]);
  const [status, setStatus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
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
  const { data, isLoading } = useCalender({
    limit,
    page,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  const mockcalender = data?.list || [];
  console.log(mockcalender);
  const total = data?.total || 0;

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    days: "",
    createdByName: "",
    closeDateFrom: "",
    closeDateTo: "",
  });
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
      days: "",
      createdByName: "",
      closeDateFrom: "",
      closeDateTo: "",
    });
    setCurrentPage(1);
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

  const isWithinSelectedDays = (createdAt, selectedDay) => {
    if (!selectedDay) return true;

    const createdDate = new Date(createdAt?.replace(" ", "T"));
    const today = new Date();

    // Reset time for accurate comparison
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(createdDate);
    compareDate.setHours(0, 0, 0, 0);

    const diffInDays = (today - compareDate) / (1000 * 60 * 60 * 24);

    switch (selectedDay) {
      case "Today":
        return diffInDays === 0;

      case "Yesterday":
        return diffInDays === 1;

      case "Last 3 Days":
        return diffInDays >= 0 && diffInDays <= 2;

      case "Last 7 Days":
        return diffInDays >= 0 && diffInDays <= 6;

      case "Current Month":
        return (
          createdDate.getMonth() === today.getMonth() &&
          createdDate.getFullYear() === today.getFullYear()
        );

      default:
        return true;
    }
  };

  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = mockcalender?.filter((deal) => {
      const search = filters?.search?.toLowerCase();

      const matchesSearch =
        !search ||
        deal?.name?.toLowerCase()?.includes(search) ||
        deal?.description?.toLowerCase()?.includes(search) ||
        deal?.requestType?.includes(search) ||
        deal?.department?.toLowerCase()?.includes(search);

      const matchesStatus =
        !filters?.status || deal?.status === filters?.status;

      const matchesDays =
        !filters?.days || isWithinSelectedDays(deal?.createdAt, filters?.days);

      const matchescreatedByName =
        !filters?.createdByName || deal?.createdById === filters?.createdByName;
      // update
      const createdDate = deal?.createdAt
        ? new Date(deal.createdAt.split(" ")[0]) // safe parsing
        : null;

      const fromDate = filters?.closeDateFrom
        ? new Date(filters.closeDateFrom)
        : null;

      const toDate = filters?.closeDateTo
        ? new Date(filters.closeDateTo)
        : null;

      // 👉 IMPORTANT: include full end day
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }

      const matchesCreatedFrom =
        !fromDate || (createdDate && createdDate >= fromDate);

      const matchesCreatedTo =
        !toDate || (createdDate && createdDate <= toDate);
      return (
        matchesSearch &&
        matchesStatus &&
        matchescreatedByName &&
        matchesCreatedFrom &&
        matchesCreatedTo &&
        matchesDays
      );
    });

    // ✅ SAFE SORTING
    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        let aValue = a?.[sortConfig.key];
        let bValue = b?.[sortConfig.key];

        if (sortConfig.key === "opportunityAmount") {
          aValue = Number(aValue ?? 0);
          bValue = Number(bValue ?? 0);
        } else if (sortConfig.key === "createdAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [mockcalender, filters, sortConfig]);
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  const totalPages = Math.ceil(filteredAndSortedDeals?.length / itemsPerPage);
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
      data?.filter((deal) => deal?.requestType === type)?.length || 0;

    const currentData = filteredAndSortedDeals;

    return [
      {
        title: "Total Leaves",
        value: currentData?.length || 0,
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
        value: countByType(currentData, "Full Day"),
        icon: "Calendar",
        iconColor: "bg-blue-400",
        description: "Full day leaves",
      },
    ];
  }, [filteredAndSortedDeals]);

  return (
    <>
      <Helmet>
        <title>CRM Reports</title>
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
              dealCount={filteredAndSortedDeals?.length}
              selectedCount={selectedDeals?.length}
              toggleAnalytics={() => setShowAnalytics((prev) => !prev)}
            />

            {/* Charts Grid */}
            {showAnalytics && (
              <>
                <div className="flex justify-between items-center mb-4">
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
              deals={filteredAndSortedDeals}
              selectedDeals={selectedDeals}
              sortConfig={sortConfig}
              onSelectDeal={handleSelectDeal}
              onSort={handleSort}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              setPage={setPage}
              total={total}
              limit={limit}
              setLimit={setLimit}
            />
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedDeals?.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default Attendance;
