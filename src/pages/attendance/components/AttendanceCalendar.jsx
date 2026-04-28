import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useMemo, useState, useRef, useEffect } from "react";

const TYPE_CONFIG = {
  Leave: {
    bg: "#F3E8FF",
    border: "#7C3AED",
    text: "#6D28D9",
    dot: "#7C3AED",
    label: "Leave",
    icon: "🏖️",
    light: "#FAF5FF",
  },
  "Short Leave": {
    bg: "#FEF3C7",
    border: "#F59E0B",
    text: "#B45309",
    dot: "#F59E0B",
    label: "Short Leave",
    icon: "⏱️",
    light: "#FFFBEB",
  },
  SLC: {
    bg: "#DBEAFE",
    border: "#0EA5E9",
    text: "#0369A1",
    dot: "#0EA5E9",
    label: "Overtime",
    icon: "💼",
    light: "#F0F9FF",
  },
  "Half Day": {
    bg: "#FBCFE8",
    border: "#EC4899",
    text: "#9D174D",
    dot: "#EC4899",
    label: "Half Leave",
    icon: "🕐",
    light: "#FDF2F8",
  },
};

const PopoverCard = ({ event, position, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!event) return null;
  const item = event.extendedProps;
  const cfg = TYPE_CONFIG[item.requestType] || TYPE_CONFIG["Leave"];

  return (
    <div
      style={{
        position: "fixed",
        top: position.y,
        left: position.x,
        zIndex: 9999,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 16,
        border: `1.5px solid ${cfg.border}20`,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.08), 
                    0 0 1px rgba(0, 0, 0, 0.04)`,
        padding: "20px 24px",
        minWidth: 300,
        animation: isVisible
          ? "popInSmooth 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "none",
      }}
    >
      <style>{`
        @keyframes popInSmooth {
          0% {
            opacity: 0;
            transform: scale(0.88) translateY(-12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {/* Header with type badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: cfg.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              border: `2px solid ${cfg.border}40`,
            }}
          >
            {cfg.icon}
          </div>
          <span
            style={{
              background: cfg.light,
              color: cfg.text,
              border: `1.5px solid ${cfg.border}50`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {cfg.label}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            fontSize: 20,
            padding: "2px 6px",
            lineHeight: 1,
            borderRadius: 6,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.target.style.color = cfg.border;
            e.target.style.background = cfg.light;
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "#9CA3AF";
            e.target.style.background = "transparent";
          }}
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <p
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: "#111827",
          margin: "0 0 14px",
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
        }}
      >
        {item.name}
      </p>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${cfg.border}30, transparent)`,
          marginBottom: 14,
        }}
      />

      {/* Details Grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[
          [
            "Date",
            new Date(item.startDate + "T00:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          ],
          ["Status", item.status],
          ["Requested by", item.createdByName],
          ["Assigned to", item.assignedUserName],
        ].map(([k, v], idx) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              animation: isVisible
                ? `fadeInRight 0.35s ease ${0.05 + idx * 0.05}s both`
                : "none",
              gap: 12,
            }}
          >
            <style>{`
              @keyframes fadeInRight {
                from {
                  opacity: 0;
                  transform: translateX(-8px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}</style>
            <span
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {k}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: k === "Status" ? "#059669" : "#374151",
                textAlign: "right",
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AttendanceCalendar = ({
  attendanceData,
  onDateChange,
  onCloseCalendar,
}) => {
  const [popover, setPopover] = useState(null);
  const calRef = useRef(null);

  const events = useMemo(() => {
    if (!attendanceData) return [];
    return attendanceData.map((item) => {
      const cfg = TYPE_CONFIG[item.requestType] || {};
      return {
        id: item.id,
        title: item.requestType,
        date: item.startDate,
        backgroundColor: cfg.bg || "#E5E7EB",
        borderColor: cfg.border || "#9CA3AF",
        textColor: cfg.text || "#374151",
        extendedProps: item,
      };
    });
  }, [attendanceData]);

  const handleEventClick = (info) => {
    const rect = info.el.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 330);
    const y =
      rect.bottom + 12 > window.innerHeight - 250
        ? rect.top - 320
        : rect.bottom + 12;
    setPopover({ event: info.event, position: { x, y } });
  };

  const handleDateClick = () => setPopover(null);

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
        background: "#FFFFFF",
        minHeight: "100vh",
        padding: "28px 24px",
        position: "relative",
      }}
      onClick={(e) => {
        if (popover && !e.target.closest(".fc-event")) setPopover(null);
      }}
    >
      {/* Subtle background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "300px",
          background: "linear-gradient(135deg, #F0F9FF 0%, #FDF2F8 100%)",
          opacity: 0.4,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;500;600;700&display=swap');

        .fc {
          font-family: 'Segoe UI', 'Helvetica Neue', sans-serif !important;
        }

        /* Toolbar */
        .fc .fc-toolbar {
          padding: 20px 24px 16px;
          margin-bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid #E5E7EB;
          gap: 12px;
        }

        .fc .fc-toolbar-title {
          font-size: 22px !important;
          font-weight: 700 !important;
          color: #111827 !important;
          letter-spacing: -0.01em;
          margin: 0 !important;
        }

        .fc .fc-button {
          background: #FFFFFF !important;
          border: 1px solid #E5E7EB !important;
          color: #374151 !important;
          border-radius: 10px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          padding: 8px 14px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
          transition: all 0.2s ease !important;
          cursor: pointer;
        }

        .fc .fc-button:hover {
          border-color: #D1D5DB !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
          transform: translateY(-1px);
        }

        .fc .fc-button:active {
          transform: translateY(0);
        }

        .fc .fc-button:focus {
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
          border-color: #7C3AED !important;
        }

        .fc .fc-today-button {
            text-transform: capitalize;
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%) !important;
          border-color: transparent !important;
          color: #fff !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3) !important;
        }

        .fc .fc-today-button:hover {
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4) !important;
          transform: translateY(-2px);
        }

        .fc .fc-button-group {
          gap: 6px;
          display: flex;
        }

        /* Column headers */
        .fc .fc-col-header-cell {
          padding: 12px 0 !important;
          background: #F9FAFB;
          border-color: #E5E7EB !important;
        }

        .fc .fc-col-header-cell-cushion {
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #6B7280 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          text-decoration: none !important;
        }

        /* Day cells */
        .fc .fc-daygrid-day {
          transition: all 0.25s ease;
          border-radius: 12px;
          border: 1px solid #E5E7EB !important;
          background: #FFFFFF;
          position: relative;
        }

        .fc .fc-daygrid-day:hover {
          background: #F9FAFB;
          border-color: #D1D5DB !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(124, 58, 237, 0.12);
        }

        .fc .fc-daygrid-day-number {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #374151 !important;
          padding: 8px 10px !important;
          text-decoration: none !important;
        }

        .fc .fc-day-other .fc-daygrid-day-number {
          color: #D1D5DB !important;
        }

        .fc .fc-day-today {

          background: linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%) !important;
          border: 2px solid #7C3AED !important;
          box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.2),
                      0 4px 12px rgba(124, 58, 237, 0.15);
          border-radius: 12px;
        }

        .fc .fc-day-today .fc-daygrid-day-number {
          color: #7C3AED !important;
          font-weight: 800 !important;
        }

        /* Events */
        .fc .fc-daygrid-event {
          border-radius: 8px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease !important;
          cursor: pointer;
          margin: 2px 2px 0 2px !important;
          background-clip: padding-box;
        }

        .fc .fc-daygrid-event:hover {
          transform: scale(1.06) translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
          border-color: rgba(0, 0, 0, 0.12) !important;
        }

        .fc .fc-event-title {
          font-weight: 700 !important;
          font-size: 11px !important;
        }

        /* More link */
        .fc .fc-daygrid-more-link {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #7C3AED !important;
          margin: 2px 4px !important;
          transition: all 0.2s ease;
        }

        .fc .fc-daygrid-more-link:hover {
          color: #6D28D9 !important;
        }

        /* Popover */
        .fc .fc-popover {
          border-radius: 14px !important;
          border: 1px solid #E5E7EB !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1) !important;
          font-family: 'Segoe UI', 'Helvetica Neue', sans-serif !important;
          background: #FFFFFF !important;
        }

        .fc .fc-popover-header {
          background: #F9FAFB !important;
          border-radius: 14px 14px 0 0 !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #374151 !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid #E5E7EB !important;
        }

        .fc .fc-popover-body {
          padding: 8px 0 !important;
        }

        .fc .fc-popover-close {
          color: #9CA3AF !important;
          font-size: 16px !important;
        }

        /* Scrollbar */
        .fc-scroller::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .fc-scroller::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 10px;
        }

        .fc-scroller::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }

        .calendar-wrapper {
          position: relative;
        }

        .fc-toolbar-chunk {
          display: flex;
          align-items: center;
        }

        .calendar-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          padding: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05),
                      0 10px 30px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .header-section {
          padding: 28px 24px 0;
          position: relative;
          z-index: 1;
          animation: slideDown 0.5s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .calendar-card {
          animation: fadeInUp 0.5s ease 0.1s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>


      {/* Calendar Card */}
      <div className="calendar-card">
        <div className="calendar-wrapper">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "closeBtn",
            }}
            customButtons={{
              closeBtn: {
                text: "✕",
                click: () => {
                  if (onCloseCalendar) onCloseCalendar();
                },
              },
            }}
            height="auto"
            dayMaxEvents={2}
            moreLinkClick="popover"
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            datesSet={(arg) => {
              const start = arg.startStr.split("T")[0];
              const end = arg.endStr.split("T")[0];
              onDateChange({
                start,
                end,
              });
            }}
            eventContent={(arg) => {
              const cfg = TYPE_CONFIG[arg.event.extendedProps.requestType];
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "1px 0",
                    overflow: "hidden",
                  }}
                >
                  <span style={{ fontSize: 10 }}>{cfg?.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: cfg?.text,
                    }}
                  >
                    {cfg?.label || arg.event.title}
                  </span>
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Popover */}
      {popover && (
        <PopoverCard
          event={popover.event}
          position={popover.position}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
};

export default AttendanceCalendar;