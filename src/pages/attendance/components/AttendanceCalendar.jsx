import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useMemo, useState, useRef } from "react";
const TYPE_CONFIG = {
  Leave: {
    bg: "#EDE9FE",
    border: "#7C3AED",
    text: "#5B21B6",
    dot: "#7C3AED",
    label: "Leave",
    icon: "🏖️",
  },
  "Short Leave": {
    bg: "#FEF3C7",
    border: "#D97706",
    text: "#92400E",
    dot: "#D97706",
    label: "Short Leave",
    icon: "⏱️",
  },
  SLC: {
    bg: "#DBEAFE",
    border: "#2563EB",
    text: "#1E40AF",
    dot: "#2563EB",
    label: "Overtime",
    icon: "💼",
  },
  "Half Day": {
    bg: "#FCE7F3",
    border: "#DB2777",
    text: "#9D174D",
    dot: "#DB2777",
    label: "Half Leave",
    icon: "🕐",
  },
};
const PopoverCard = ({ event, position, onClose }) => {
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
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
        padding: "16px 18px",
        minWidth: 240,
        border: `1.5px solid ${cfg.border}22`,
        animation: "popIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`@keyframes popIn { from { opacity:0; transform: scale(0.9) translateY(-4px); } to { opacity:1; transform: scale(1) translateY(0); } }`}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            background: cfg.bg,
            color: cfg.text,
            border: `1px solid ${cfg.border}44`,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          {cfg.icon} {cfg.label}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            fontSize: 16,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      <p
        style={{
          fontWeight: 600,
          fontSize: 13,
          color: "#111827",
          margin: "0 0 10px",
          lineHeight: 1.4,
        }}
      >
        {item.name}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span
              style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}
            >
              {k}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
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

const AttendanceCalendar = ({ attendanceData, onDateChange, }) => {
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
    const x = Math.min(rect.left, window.innerWidth - 270);
    const y =
      rect.bottom + 8 > window.innerHeight - 200
        ? rect.top - 210
        : rect.bottom + 8;
    setPopover({ event: info.event, position: { x, y } });
  };

  const handleDateClick = () => setPopover(null);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#F9FAFB",
        minHeight: "100vh",
        padding: "24px",
      }}
      onClick={(e) => {
        if (popover && !e.target.closest(".fc-event")) setPopover(null);
      }}
    >
      {/* Header */}


      {/* Calendar Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          padding: "0 0 4px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

          .fc {
            font-family: 'DM Sans', 'Segoe UI', sans-serif !important;
          }

          /* Toolbar */
          .fc .fc-toolbar {
            padding: 16px 20px 12px;
            border-bottom: 1px solid #F3F4F6;
            align-items: center;
          }
          .fc .fc-toolbar-title {
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #111827 !important;
            letter-spacing: -0.01em;
          }
          .fc .fc-button {
            background: none !important;
            border: 1px solid #E5E7EB !important;
            color: #374151 !important;
            border-radius: 8px !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            padding: 5px 12px !important;
            box-shadow: none !important;
            transition: all 0.15s !important;
          }
          .fc .fc-button:hover {
            background: #F9FAFB !important;
            border-color: #D1D5DB !important;
          }
          .fc .fc-button:focus { box-shadow: none !important; }
          .fc .fc-today-button {
            background: #7C3AED !important;
            border-color: #7C3AED !important;
            color: #fff !important;
            font-weight: 600 !important;
          }
          .fc .fc-today-button:hover {
            background: #6D28D9 !important;
            border-color: #6D28D9 !important;
          }
          .fc .fc-prev-button, .fc .fc-next-button {
            padding: 5px 8px !important;
          }
          .fc .fc-button-group { gap: 4px; display: flex; }

          /* Column headers (Sun Mon...) */
          .fc .fc-col-header-cell {
            padding: 10px 0 !important;
            background: #FAFAFA;
            border-color: #F3F4F6 !important;
          }
          .fc .fc-col-header-cell-cushion {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #9CA3AF !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
            text-decoration: none !important;
          }

          /* Day cells */
          .fc .fc-daygrid-day {
            border-color: #F3F4F6 !important;
          }
          .fc .fc-daygrid-day:hover {
            background: #FAFAFA;
          }
          .fc .fc-daygrid-day-number {
            font-size: 13px !important;
            font-weight: 500 !important;
            color: #374151 !important;
            padding: 8px 10px !important;
            text-decoration: none !important;
          }
          .fc .fc-day-other .fc-daygrid-day-number {
            color: #D1D5DB !important;
          }
          .fc .fc-day-today {
            background: #F5F3FF !important;
          }
          .fc .fc-day-today .fc-daygrid-day-number {
            color: #7C3AED !important;
            font-weight: 700 !important;
          }

          /* Events */
          .fc .fc-daygrid-event {
            border-radius: 6px !important;
            font-size: 11.5px !important;
            font-weight: 600 !important;
            padding: 2px 7px !important;
            margin: 1px 4px !important;
            cursor: pointer !important;
            transition: opacity 0.15s, transform 0.1s !important;
            border-width: 1px !important;
          }
          .fc .fc-daygrid-event:hover {
            opacity: 0.85 !important;
            transform: translateY(-1px) !important;
          }
          .fc .fc-event-title {
            font-weight: 600 !important;
            font-size: 11px !important;
          }

          /* "more" link */
          .fc .fc-daygrid-more-link {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #7C3AED !important;
            margin: 1px 4px !important;
          }
          .fc .fc-daygrid-more-link:hover { color: #6D28D9 !important; }

          /* Popover for overflow */
          .fc .fc-popover {
            border-radius: 12px !important;
            border: 1px solid #E5E7EB !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
            font-family: 'DM Sans', 'Segoe UI', sans-serif !important;
          }
          .fc .fc-popover-header {
            background: #F9FAFB !important;
            border-radius: 12px 12px 0 0 !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #374151 !important;
            padding: 8px 12px !important;
          }
          .fc .fc-popover-body { padding: 6px 8px !important; }
          .fc .fc-popover-close {
            color: #9CA3AF !important;
            font-size: 14px !important;
          }

          /* Scrollbar */
          .fc-scroller::-webkit-scrollbar { width: 4px; height: 4px; }
          .fc-scroller::-webkit-scrollbar-track { background: transparent; }
          .fc-scroller::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
        `}</style>

        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
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
                  gap: 4,
                  padding: "1px 0",
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: 10 }}>{cfg?.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
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
