import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchreportLeads } from "services/report.service";

const funnelColors = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#6366f1",
];

const emptyFunnelData = [
  { stage: "New", count: 0 },
  { stage: "Contacted", count: 0 },
  { stage: "Qualified", count: 0 },
  { stage: "Interested", count: 0 },
  { stage: "Proposal", count: 0 },
  { stage: "Meeting", count: 0 },
  { stage: "Closed", count: 0 },
];

const funnelStageStatusMap = {
  New: ["New"],

  Contacted: [
    "Call Later",
    "Call Not Connecting",
    "Call Not Picked",
    "Follow Up",
    "Follow up",
  ],

  Qualified: ["Qualified", "Future Prospect"],

  Interested: ["Interested", "In Process"],

  Proposal: ["Proposal Shared"],

  Meeting: ["Webinar"],

  Closed: ["Converted"],
};

const funnelStages = emptyFunnelData.map((item) => item.stage);

// replace
const fetchFunnelData = async (filters) => {
  const stages = Object.keys(funnelStageStatusMap);

  const results = await Promise.all(
    stages.map(async (stage) => {
      const statuses = funnelStageStatusMap[stage];

      const responses = await Promise.all(
        statuses.map((status) =>
          fetchreportLeads({
            limit: 1, // ⚡ only need total
            page: 1,
            filters: {
              ...filters,
              status, // backend filter
            },
          }),
        ),
      );

      const total = responses.reduce(
        (sum, res) => sum + (res?.total || 0),
        0,
      );

      return {
        stage,
        count: total,
      };
    }),
  );

  return results;
};
export default function ConversionFunnelChart({ filters = {} }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const funnelFilters = useMemo(
    () => ({
      ...filters,
      dateType: filters?.dateType || "today",
    }),
    [filters],
  );
  const { data: rawFunnelData = [], isLoading } = useQuery({
    queryKey: ["report-funnel", JSON.stringify(funnelFilters)],
    queryFn: () => fetchFunnelData(funnelFilters),
    placeholderData: keepPreviousData,
  });

  const stageData = rawFunnelData.length ? rawFunnelData : emptyFunnelData;
  const maxCount = Math.max(...stageData.map((item) => item.count), 1);
  const funnelData = stageData.map((item, index) => ({
    title: item.stage,
    value: Math.max((item.count / maxCount) * 100, item.count ? 8 : 0),
    count: item.count,
    opp: `${item.count} ${item.count === 1 ? "Lead" : "Leads"}`,
    color: funnelColors[index % funnelColors.length],
  }));

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const width = 1200;
  const height = 180;
  const segmentWidth = width / funnelData.length;
  const baseHeight = height * 0.7;

  // Calculate funnel shape with smooth curves
  const getSegmentPath = (index) => {
    const x = index * segmentWidth;
    const nextX = (index + 1) * segmentWidth;
    const percentile = funnelData[index].value / 100;
    const nextPercentile = funnelData[index + 1]?.value / 100 || 0;

    const y = height - baseHeight * percentile;
    const nextY = height - baseHeight * nextPercentile;

    const topHeight = baseHeight * percentile;
    const nextTopHeight = baseHeight * nextPercentile;

    return {
      top: y,
      topHeight,
      nextTop: nextY,
      nextTopHeight,
      x,
      nextX,
    };
  };

  // Build SVG path for smooth funnel
  let pathData = "";
  for (let i = 0; i < funnelData.length; i++) {
    const segment = getSegmentPath(i);

    if (i === 0) {
      pathData += `M ${segment.x},${segment.top} `;
      pathData += `L ${segment.nextX},${segment.nextTop} `;
    } else {
      pathData += `L ${segment.nextX},${segment.nextTop} `;
    }
  }

  pathData += `L ${width},${height} L 0,${height} Z`;

  // Create individual segment paths for gradient effect
  const segmentPaths = funnelData.map((_, i) => {
    if (i === funnelData.length - 1) return null;

    const segment = getSegmentPath(i);
    const path = `
      M ${segment.x},${segment.top}
      L ${segment.nextX},${segment.nextTop}
      L ${segment.nextX},${height}
      L ${segment.x},${height}
      Z
    `;
    return path;
  });

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sales Pipeline
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Stages prospects go through in the sales process.
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10.5 1.5H9.5V3.5H10.5V1.5ZM15.5 9.5H13.5V10.5H15.5V9.5ZM6.5 9.5H4.5V10.5H6.5V9.5Z" />
          </svg>
        </button>
      </div>

      {/* Unified Stats + Funnel Container */}
      <div
        className={`-mx-8 -mb-8 rounded-b-3xl overflow-hidden ${isLoaded ? "opacity-100" : "opacity-0"
          }`}
        style={{
          animation: isLoaded ? "fadeInUp 0.8s ease-out 0.1s both" : "none",
          background: "linear-gradient(to bottom, #f9fafb 0%, #ffffff 50%)",
        }}
      >
        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-0 px-8 pt-6">
          {funnelData.map((item, i) => (
            <div
              key={i}
              className={`text-center pb-6 ${i !== funnelData.length - 1 ? "border-r border-gray-200" : ""
                } ${isLoaded ? "opacity-100" : "opacity-0"}`}
              style={{
                animation: isLoaded ? `fadeInUp 0.6s ease-out ${i * 0.08}s both` : "none",
              }}
            >
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {item.title}
              </p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {isLoading ? "--" : item.count}
              </p>
              <p className="text-xs text-gray-400 mt-1.5">{item.opp}</p>
            </div>
          ))}
        </div>

        {/* Funnel Chart - Seamlessly Connected */}
        <div className="px-8 pb-8">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ height: "180px" }}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Main gradient */}
              <linearGradient
                id="funnelGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                {funnelColors.map((color, index) => (
                  <stop
                    key={color}
                    offset={`${(index / (funnelColors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>

              {/* Subtle inner light effect */}
              <linearGradient
                id="funnelLight"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="50%" stopColor="white" stopOpacity="0.08" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>

              {/* Shadow effect for depth */}
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
            </defs>

            {/* Main funnel shape */}
            <path
              d={pathData}
              fill="url(#funnelGradient)"
              className={isLoaded ? "animate-fillIn" : ""}
              style={{
                animation: isLoaded ? "fillIn 0.9s ease-out 0.3s both" : "none",
                filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.06))",
              }}
            />

            {/* Light overlay for depth */}
            <path
              d={pathData}
              fill="url(#funnelLight)"
              className={isLoaded ? "animate-fillIn" : ""}
              style={{
                animation: isLoaded ? "fillIn 0.9s ease-out 0.35s both" : "none",
              }}
            />

            {/* Divider lines between segments - subtle white lines */}
            {segmentPaths.map((_, i) => {
              if (i === funnelData.length - 1) return null;
              const segment = getSegmentPath(i);
              return (
                <line
                  key={`divider-${i}`}
                  x1={segment.nextX}
                  y1={segment.nextTop}
                  x2={segment.nextX}
                  y2={height}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.35"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fillIn {
          from {
            opacity: 0;
            clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
          }
          to {
            opacity: 1;
            clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
          }
        }

        .animate-fillIn {
          animation: fillIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
