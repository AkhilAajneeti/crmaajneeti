import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { createLeadActivity, updateLead } from "services/leads.service";
import { LEAD_STATUS_OPTIONS, getStatusTheme } from "utils/leadStatus";

// Quick follow-up presets. `days` is added to today.
const FOLLOW_UP_PRESETS = [
  { key: "tomorrow", label: "Tomorrow", days: 1 },
  { key: "in3", label: "In 3 days", days: 3 },
  { key: "week", label: "Next week", days: 7 },
];

// EspoCRM wants "YYYY-MM-DD HH:MM:SS" in local time, matching what the drawer
// sends. Default the hour to 10:00 so the follow-up lands in working hours.
const toEspoDateTime = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);

  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  );
};

/**
 * Bottom sheet for updating a lead without opening the full drawer.
 *
 * Saves through the same calls the drawer uses — `updateLead` for the record
 * and `createLeadActivity` for the note — so a Quick Note lands in the lead
 * Feedback tab exactly like a note posted from the drawer.
 */
const QuickEditSheet = ({ deal, isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset to the current values each time the sheet opens.
  useEffect(() => {
    if (!isOpen) return;
    setStatus(deal?.status || "");
    setNote("");
    setFollowUp(null);
    setIsSaving(false);
  }, [isOpen, deal?.id, deal?.status]);

  // Close on Escape, and stop the page scrolling behind the sheet.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!deal) return null;

  const theme = getStatusTheme(status || deal?.status);
  const statusChanged = status && status !== deal?.status;
  const hasChanges = statusChanged || !!note.trim() || followUp !== null;

  const handleSave = async () => {
    if (!hasChanges) {
      toast.error("Nothing to update");
      return;
    }

    try {
      setIsSaving(true);

      // One partial PUT for whatever actually changed.
      const payload = {};
      if (statusChanged) payload.status = status;
      if (followUp !== null) {
        payload.cNextContact =
          followUp === "clear" ? null : toEspoDateTime(followUp);
      }

      if (Object.keys(payload).length) {
        await updateLead(deal.id, payload);
      }

      // Same payload shape the drawer Feedback tab posts.
      if (note.trim()) {
        await createLeadActivity({
          post: note.trim(),
          parentId: deal.id,
          parentType: "Lead",
          type: "Post",
          isInternal: false,
          attachmentsIds: [],
        });
        queryClient.invalidateQueries({ queryKey: ["lead-stream", deal.id] });
      }

      queryClient.invalidateQueries({ queryKey: ["leads"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["leadDetails", deal.id] });

      toast.success("Lead updated");
      onClose?.();
    } catch (error) {
      console.error("Quick update failed", error);
      toast.error("Failed to update lead");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sheet — slides up from the bottom */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick update lead"
        className={`fixed inset-x-0 bottom-0 z-[61] flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Status-coloured burst rising from the top edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
        >
          <div
            className={`absolute -top-24 left-1/2 h-56 w-[160%] -translate-x-1/2 rounded-[50%] opacity-40 blur-3xl transition-colors duration-500 ${theme.burst}`}
          />
        </div>

        <div className="relative flex min-h-0 flex-col">
          {/* Grab handle */}
          <div className="flex justify-center pt-3">
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-foreground">
                {deal?.name || "Lead"}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="Zap" size={12} />
                Quick update
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close quick update"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-5">
            {/* Status */}
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Status</p>

              <div className="flex flex-wrap gap-2">
                {LEAD_STATUS_OPTIONS.map((option) => {
                  const isSelected = status === option.value;
                  const chip = getStatusTheme(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setStatus(option.value)}
                      className={`rounded-full border px-3.5 py-2 text-sm transition-all duration-150 ${
                        isSelected
                          ? `${chip.active} font-semibold shadow-sm`
                          : `${chip.idle} hover:shadow-sm`
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick note — posts to the lead Feedback tab */}
            <div>
              <label
                htmlFor="quick-note"
                className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <Icon name="MessageSquareText" size={15} />
                Quick Note
              </label>

              <textarea
                id="quick-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add conversation notes..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Saved to the Feedback tab.
              </p>
            </div>

            {/* Next follow-up */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Icon name="CalendarClock" size={15} />
                Next Follow-up
              </p>

              <div className="flex flex-wrap gap-2">
                {FOLLOW_UP_PRESETS.map((preset) => {
                  const isSelected = followUp === preset.days;

                  return (
                    <button
                      key={preset.key}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setFollowUp(isSelected ? null : preset.days)
                      }
                      className={`rounded-full border px-3.5 py-2 text-sm transition-all duration-150 ${
                        isSelected
                          ? "border-primary bg-primary/10 font-semibold text-primary ring-1 ring-primary"
                          : "border-border bg-background text-foreground hover:border-primary/40"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                {deal?.cNextContact && (
                  <button
                    type="button"
                    aria-pressed={followUp === "clear"}
                    onClick={() =>
                      setFollowUp(followUp === "clear" ? null : "clear")
                    }
                    className={`rounded-full border px-3.5 py-2 text-sm transition-all duration-150 ${
                      followUp === "clear"
                        ? "border-destructive bg-destructive/10 font-semibold text-destructive ring-1 ring-destructive"
                        : "border-border bg-background text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                    }`}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-border bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex-1"
            >
              <Icon
                name={isSaving ? "LoaderCircle" : "CheckCheck"}
                size={15}
                className={`mr-1.5 ${isSaving ? "animate-spin" : ""}`}
              />
              {isSaving ? "Saving..." : "Save Update"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickEditSheet;
