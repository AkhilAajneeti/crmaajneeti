import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../components/ui/Header";
import { FestiveRule } from "../../components/FestiveOrnament";
import Sidebar from "../../components/ui/Sidebar";
import KPICard from "./components/KPICard";
import PipelineChart from "./components/PipelineChart";
import Icon from "../../components/AppIcon";
import RightRail from "./components/RightRail";
import FollowUpPanel from "./components/FollowUpPanel";
import FestiveDecor from "components/FestiveDecor";
import DiwaliWordmark from "components/DiwaliWordmark";
import RisingCrackers from "components/RisingCrackers";
import { fetchLeads } from "services/leads.service";
import MultiLineChart from "./components/MultiLineChart";
import { fetchMeeting } from "services/meeting.service";
import Button from "../../components/ui/Button";
import { useLeadsCount } from "hooks/useLeads";
import { useQuery } from "@tanstack/react-query";
import { UNWORKABLE_STATUS_VALUES } from "utils/leadStatus";

// What counts as won. "Converted" is the only one of these in
// LEAD_STATUS_OPTIONS; the other two are carried because ProgressChart already
// treats them as won, and including them costs nothing — it is the same single
// `in` filter either way.
//
// Module scope, not inside the component: this feeds a React Query key, and a
// stable reference keeps that key stable.
const CONVERTED_STATUSES = ["Converted", "Deal Closed", "Purchased"];

// One shared empty array for the "not loaded yet" case. A fresh [] literal
// each render is a new reference, which would invalidate the insightLists
// memo below on every render and quietly undo it.
const EMPTY = [];

// Per-card styling for the insight popup, matched to each KPI card's colour.
const insightThemes = {
  meetings: {
    title: "Today's Held Meetings",
    icon: "Calendar",
    text: "text-blue-700",
    border: "border-blue-200",
    headerBg: "bg-blue-50",
    iconBg: "bg-blue-100",
    shadow:
      "0 0 0 1px rgba(59,130,246,0.25), 0 25px 50px -12px rgba(59,130,246,0.45)",
  },
  proposals: {
    title: "Proposal Shared Leads",
    icon: "FileText",
    text: "text-purple-700",
    border: "border-purple-200",
    headerBg: "bg-purple-50",
    iconBg: "bg-purple-100",
    shadow:
      "0 0 0 1px rgba(168,85,247,0.25), 0 25px 50px -12px rgba(168,85,247,0.45)",
  },
  visits: {
    title: "Site Visits",
    icon: "MapPin",
    text: "text-amber-700",
    border: "border-amber-200",
    headerBg: "bg-amber-50",
    iconBg: "bg-amber-100",
    shadow:
      "0 0 0 1px rgba(245,158,11,0.3), 0 25px 50px -12px rgba(245,158,11,0.45)",
  },
  deals: {
    title: "Closed Deals",
    icon: "CheckCircle",
    text: "text-green-700",
    border: "border-green-200",
    headerBg: "bg-green-50",
    iconBg: "bg-green-100",
    shadow:
      "0 0 0 1px rgba(34,197,94,0.25), 0 25px 50px -12px rgba(34,197,94,0.45)",
  },
};

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState(null);

  // Close the insight popup on Escape and lock background scroll while open.
  useEffect(() => {
    if (!activeInsight) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setActiveInsight(null);
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeInsight]);

  // update by filter

  const getTodayRange = () => {
    const now = new Date();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  };
  const { start, end } = getTodayRange();
  // ✅ 1. HOOKS FIRST
  const thisMonthQuery = useLeadsCount([
    { type: "currentMonth", attribute: "createdAt" }
  ]);

  const todayQuery = useLeadsCount([
    {
      type: "today",
      attribute: "createdAt",
    },
  ]);

  const interestedQuery = useLeadsCount([
    {
      type: "in",
      attribute: "status",
      value: ["Interested"],
    },
    {
      type: "currentMonth",
      attribute: "createdAt",
    },
  ]);

  const lastMonthQuery = useLeadsCount([
    { type: "lastMonth", attribute: "createdAt" }
  ]);

  const yesterdayQuery = useLeadsCount([
    { type: "yesterday", attribute: "createdAt" }
  ]);

  const interestedLastMonthQuery = useLeadsCount([
    { type: "lastMonth", attribute: "createdAt" },
    { type: "equals", attribute: "status", value: "Interested" }
  ]);

  // Conversion rate — the won half of the funnel. Costs two extra count calls
  // and nothing more: the denominators reuse the This Month / Last Month
  // totals the cards above already fetched, and fetchLeadsCount is a
  // maxSize=1 request sitting behind a 10-minute memory + localStorage cache
  // (plus React Query's 5-minute staleTime), so a revisit inside that window
  // costs no network at all.
  //
  // Deliberately NOT derived from the `leads` list further down: that request
  // returns a single page, so a rate computed from it would quietly be a rate
  // over a sample rather than over the month.
  const convertedThisMonthQuery = useLeadsCount([
    { type: "currentMonth", attribute: "createdAt" },
    { type: "in", attribute: "status", value: CONVERTED_STATUSES },
  ]);

  const convertedLastMonthQuery = useLeadsCount([
    { type: "lastMonth", attribute: "createdAt" },
    { type: "in", attribute: "status", value: CONVERTED_STATUSES },
  ]);

  // Invalid / Duplicate / archived imports, subtracted from the denominator so
  // the rate matches how the Sales Team board scores a rep. A rep handed ten
  // junk IVR records should not have their conversion divided by them —
  // teamAggregate.service.js drops them for exactly this reason, and a
  // dashboard quoting a different number than the board it feeds is worse
  // than no number.
  const unworkableThisMonthQuery = useLeadsCount([
    { type: "currentMonth", attribute: "createdAt" },
    { type: "in", attribute: "status", value: UNWORKABLE_STATUS_VALUES },
  ]);

  const unworkableLastMonthQuery = useLeadsCount([
    { type: "lastMonth", attribute: "createdAt" },
    { type: "in", attribute: "status", value: UNWORKABLE_STATUS_VALUES },
  ]);

  // ✅ 2. EXTRACT DATA
  const thisMonth = thisMonthQuery.data || 0;
  const today = todayQuery.data || 0;
  const interested = interestedQuery.data || 0;

  const lastMonth = lastMonthQuery.data || 0;
  const yesterday = yesterdayQuery.data || 0;
  const interestedLastMonth = interestedLastMonthQuery.data || 0;

  // ✅ 3. CALCULATIONS
  const monthGrowth =
    lastMonth === 0
      ? 0
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const todayDiff = today - yesterday;

  const interestedGrowth =
    interestedLastMonth === 0
      ? 0
      : Math.round(
        ((interested - interestedLastMonth) / interestedLastMonth) * 100
      );

  const convertedThisMonth = convertedThisMonthQuery.data || 0;
  const convertedLastMonth = convertedLastMonthQuery.data || 0;

  // Math.max guards the case where the two counts disagree because a lead
  // changed status between the two cached requests — a negative denominator
  // would flip the rate's sign rather than just being slightly stale.
  const workableThisMonth = Math.max(
    0,
    thisMonth - (unworkableThisMonthQuery.data || 0),
  );
  const workableLastMonth = Math.max(
    0,
    lastMonth - (unworkableLastMonthQuery.data || 0),
  );

  // A month with no workable leads reads as 0%, matching the other cards on
  // the row — they show 0 rather than a placeholder when there is nothing to
  // count. The `total > 0` guard stays regardless: it is what stops a
  // zero-lead month producing NaN%.
  const rateOf = (won, total) => (total > 0 ? (won / total) * 100 : 0);

  const conversionRate = rateOf(convertedThisMonth, workableThisMonth);
  const conversionRateLastMonth = rateOf(convertedLastMonth, workableLastMonth);

  // Two rates are compared in percentage POINTS, not percent. Going from 12%
  // to 18% is +6pp; calling it "+50%" is the classic way this metric gets
  // misread in a review.
  const conversionDiff =
    Math.round((conversionRate - conversionRateLastMonth) * 10) / 10;


  // leads
  const { data, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads
  });
  const leads = data?.list || EMPTY;

  const { data: meetingData = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeeting
  });

  const meetingsList = meetingData?.list || EMPTY;
  const isSameMonth = (date1, date2) => {
    const d1 = new Date(date1);
    return (
      d1.getMonth() === date2.getMonth() &&
      d1.getFullYear() === date2.getFullYear()
    );
  };
  const formatDate = (date) => {
    if (!date) return "—"; // null / undefined / empty

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "—"; // invalid date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })?.format(new Date(date));
  };
  const formatTime = (value) => {
    if (!value) return "—";

    const safe = value.replace(" ", "T"); // EspoCRM fix
    const date = new Date(safe);

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const isToday = (date) => {
    const d = new Date(date);
    const now = new Date();
    return (
      d.toDateString() === now.toDateString() &&
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isYesterday = (date) => {
    const d = new Date(date);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };
  // calculate
  const now = new Date();

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // Each of these lists is built ONCE and used for both the number on the
  // card and the rows in its popup.
  //
  // They used to be two separate filters — one here for the count, another
  // inside the card's onClick — and the pair had already drifted: the
  // Client Onboarded card counted "Deal Closed" but its popup asked for
  // "Lead Closed", so the number and the rows behind it could never agree.
  // One list per card makes that class of bug impossible, and filters the
  // leads array four times per render instead of four plus a repeat on
  // every click.
  const insightLists = useMemo(() => {
    const closedToday = (status) =>
      leads.filter((l) => l.status === status && isToday(l.modifiedAt));

    return {
      proposals: closedToday("Proposal Shared"),
      visits: closedToday("Site Visit Done"),
      // Matched against the same won-status list the conversion rate uses,
      // so "Client Onboarded" and the Conversion Rate card can never count
      // different things.
      deals: leads.filter(
        (l) => CONVERTED_STATUSES.includes(l.status) && isToday(l.modifiedAt),
      ),
      meetings: meetingsList.filter(
        (m) =>
          m.status === "Held" &&
          m.dateStart &&
          isToday(m.dateStart.replace(" ", "T")),
      ),
    };
  }, [leads, meetingsList]);

  // Derived, not stored in state. While the popup is open a background
  // refetch of `leads` now flows straight through to the rows on screen;
  // a useState copy taken at click time would sit there stale.
  const insightData = activeInsight
    ? insightLists[activeInsight] || []
    : [];

  const meetings = insightLists.meetings.length;
  const proposals = insightLists.proposals.length;
  const siteVisits = insightLists.visits.length;
  const closedDeals = insightLists.deals.length;
  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const kpiData = [
    {
      title: "This Month Leads",
      value: thisMonth,
      change: `${monthGrowth}%`,
      changeType: monthGrowth >= 0 ? "positive" : "negative",
      icon: "Users",
      iconBg: "bg-blue-100",
      iconColor: "#3B82F6",
      comparisonLabel: "last month",
      isLoading: thisMonthQuery.isLoading || lastMonthQuery.isLoading,
    },
    {
      title: "Today Leads",
      value: today,
      change: todayDiff >= 0 ? `+${todayDiff}` : `${todayDiff}`,
      changeType: todayDiff >= 0 ? "positive" : "negative",
      icon: "Calendar",
      iconBg: "bg-green-100",
      iconColor: "#10B981",
      comparisonLabel: "yesterday",
      isLoading: todayQuery.isLoading || yesterdayQuery.isLoading,
    },
    {
      title: "Interested Leads (This Month)",
      value: interested,
      change: `${interestedGrowth}%`,
      changeType: interestedGrowth >= 0 ? "positive" : "negative",
      icon: "Star",
      iconBg: "bg-yellow-100",
      iconColor: "#F59E0B",
      comparisonLabel: "last month",
      isLoading:
        interestedQuery.isLoading || interestedLastMonthQuery.isLoading,
    },
    {
      // Closes the funnel the first three cards open: leads in, leads warm,
      // leads won. The only ratio on the row, and the only number here that
      // measures the selling rather than the supply.
      title: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
      change: `${conversionDiff > 0 ? "+" : ""}${conversionDiff}pp`,
      // Flat is its own state. An unchanged rate rendered green with an
      // up-arrow claims an improvement that did not happen.
      changeType:
        conversionDiff > 0
          ? "positive"
          : conversionDiff < 0
            ? "negative"
            : "neutral",
      icon: "Target",
      iconBg: "bg-teal-100",
      iconColor: "#14B8A6",
      comparisonLabel: "last month",
      isLoading:
        convertedThisMonthQuery.isLoading ||
        convertedLastMonthQuery.isLoading ||
        unworkableThisMonthQuery.isLoading ||
        unworkableLastMonthQuery.isLoading ||
        thisMonthQuery.isLoading ||
        lastMonthQuery.isLoading,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RisingCrackers />
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="relative lg:ml-64 pt-16">
        {/* Festival layer. First child so every real element paints over it,
            and pointer-events-none so it can never swallow a click. */}
        <FestiveDecor className="h-[260px]" />

        <div className="relative m-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 flex items-center gap-3 text-2xl lg:text-3xl font-bold text-foreground">
              Dashboard
              <FestiveRule />
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your sales today.
            </p>
          </div>

          {/* Greeting sits level with the heading, on the right, as in the
              reference — set as type so it stays sharp and needs no white
              background knocked out. */}
          <DiwaliWordmark className="hidden shrink-0 lg:block xl:mr-[16%]" />
        </div>
        {/* Follow-ups that need acting on now. Sits above the KPI cards:
            the numbers below describe what happened, this says what to do. */}
        <div className="relative m-3 sm:m-5">
          <FollowUpPanel />
        </div>

        {/* KPI Cards */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 m-3 sm:m-5">
          {kpiData?.map((kpi, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Each card shimmers on its own query, not on the slowest of
                  all four. Previously one slow count held every card in the
                  skeleton state, which made the row feel slower than it was. */}
              <KPICard {...kpi} />
            </motion.div>
          ))}
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-0 xl:pr-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >


              {/* Pipeline Chart */}
              <div className="sm:m-5 py-3">
                <PipelineChart leads={leads} />
              </div>
              <div className="sm:m-5 py-3">
                <MultiLineChart leads={leads} />
              </div>


              {/* Recent Activities */}
              <div className="sm:m-5 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Meetings Held */}
                  <div
                    onClick={() => setActiveInsight("meetings")}
                    className="cursor-pointer bg-blue-50 border border-blue-100 rounded-2xl p-6 
  hover:shadow-lg transition-all duration-300 
  flex items-center justify-between min-h-[110px]"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium tracking-wide text-blue-700 uppercase">
                        Meetings Scheduling
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {meetings}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Icon
                        name="Calendar"
                        size={22}
                        className="text-blue-600"
                      />
                    </div>
                  </div>

                  {/* Proposals Shared */}
                  <div
                    onClick={() => setActiveInsight("proposals")}
                    className="cursor-pointer bg-purple-50 border border-purple-100 rounded-2xl p-6 
hover:shadow-lg transition-all duration-300 flex items-center justify-between min-h-[110px]"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium tracking-wide text-purple-700 uppercase">
                        Total Proposals
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {proposals}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Icon
                        name="FileText"
                        size={22}
                        className="text-purple-600"
                      />
                    </div>
                  </div>

                  {/* Site Visits */}
                  <div
                    onClick={() => setActiveInsight("visits")}
                    className="cursor-pointer bg-amber-50 border border-amber-100 rounded-2xl p-6 
hover:shadow-lg transition-all duration-300 flex items-center justify-between min-h-[110px]"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium tracking-wide text-amber-700 uppercase">
                        Site Visits
                      </p>
                      <p className="text-3xl font-bold text-amber-600">
                        {siteVisits}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Icon
                        name="MapPin"
                        size={22}
                        className="text-amber-600"
                      />
                    </div>
                  </div>

                  {/* Deals Closed */}
                  <div
                    onClick={() => setActiveInsight("deals")}
                    className="cursor-pointer bg-green-50 border border-green-100 rounded-2xl p-6 
hover:shadow-lg transition-all duration-300 flex items-center justify-between min-h-[110px]"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium tracking-wide text-green-700 uppercase">
                        Client Onboarded
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {closedDeals}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Icon
                        name="CheckCircle"
                        size={22}
                        className="text-green-600"
                      />
                    </div>
                  </div>
                </div>
                {/* <RecentActivities activities={activities} /> */}
              </div>
              <AnimatePresence>
                {activeInsight && (
                  <motion.div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={insightThemes[activeInsight].title}
                    onClick={() => setActiveInsight(null)}
                  >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

                    {/* Panel */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 12 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ boxShadow: insightThemes[activeInsight].shadow }}
                      className={`relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-card rounded-2xl border overflow-hidden ${insightThemes[activeInsight].border}`}
                    >
                      {/* Header */}
                      <div
                        className={`flex justify-between items-center gap-4 px-6 py-4 border-b ${insightThemes[activeInsight].border} ${insightThemes[activeInsight].headerBg}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${insightThemes[activeInsight].iconBg}`}
                          >
                            <Icon
                              name={insightThemes[activeInsight].icon}
                              size={20}
                              className={insightThemes[activeInsight].text}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3
                              className={`text-base font-semibold truncate ${insightThemes[activeInsight].text}`}
                            >
                              {insightThemes[activeInsight].title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {insightData.length}{" "}
                              {insightData.length === 1 ? "record" : "records"}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveInsight(null)}
                        >
                          Close
                        </Button>
                      </div>

                      {/* Body */}
                      <div className="flex-1 overflow-auto">
                        {insightData.length === 0 ? (
                          <div className="p-10 text-center text-muted-foreground text-sm">
                            No records found.
                          </div>
                        ) : (
                          <table className="w-full">
                            <thead
                              className={`sticky top-0 z-10 border-b ${insightThemes[activeInsight].border} ${insightThemes[activeInsight].headerBg}`}
                            >
                              <tr>
                                <th className="text-left px-6 py-3 text-sm font-medium">
                                  Name
                                </th>

                                {activeInsight === "meetings" ? (
                                  <>
                                    <th className="text-left px-6 py-3 text-sm font-medium">
                                      Join URL
                                    </th>
                                    <th className="text-left px-6 py-3 text-sm font-medium">
                                      Start
                                    </th>
                                    <th className="text-left px-6 py-3 text-sm font-medium">
                                      End
                                    </th>
                                  </>
                                ) : (
                                  <>
                                    <th className="text-left px-6 py-3 text-sm font-medium">
                                      Assigned User
                                    </th>
                                    <th className="text-left px-6 py-3 text-sm font-medium">
                                      Created By
                                    </th>
                                    <th className="text-left px-6 py-3 text-sm font-medium">
                                      Created
                                    </th>
                                  </>
                                )}
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                              {insightData.map((item) => (
                                <tr
                                  key={item.id}
                                  className="hover:bg-muted/30 transition"
                                >
                                  {/* Name */}
                                  <td className="px-6 py-4">
                                    <div className="font-medium text-foreground">
                                      {item.name}
                                    </div>
                                  </td>

                                  {/* Dynamic Column */}
                                  {activeInsight === "meetings" ? (
                                    <>
                                      <td className="px-6 py-4">
                                        {item.joinUrl ? (
                                          <div className="flex items-center gap-2 max-w-xs">
                                            <a
                                              href={item.joinUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary text-sm truncate hover:underline"
                                            >
                                              {item.joinUrl}
                                            </a>

                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(
                                                  item.joinUrl,
                                                );
                                              }}
                                              className="p-1 rounded hover:bg-muted transition"
                                            >
                                              <Icon name="Copy" size={16} />
                                            </button>
                                          </div>
                                        ) : (
                                          "—"
                                        )}
                                      </td>

                                      <td className="px-6 py-4 text-sm">
                                        {formatTime(item.dateStart)}
                                      </td>

                                      <td className="px-6 py-4 text-sm">
                                        {formatTime(item.dateEnd)}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-6 py-4 text-sm">
                                        {item.assignedUserName || "—"}
                                      </td>

                                      <td className="px-6 py-4 text-sm">
                                        {item.createdByName || "—"}
                                      </td>

                                      <td className="px-6 py-4 text-sm">
                                        {formatDate(item.createdAt)}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Rail */}
          <div className="hidden xl:block max-w-96 p-6 border-l border-border bg-background">
            <RightRail leads={leads} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
