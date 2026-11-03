import React, { useState } from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { DEFAULT_TARGETS, METRIC_WEIGHTS } from "../utils/performanceScore";

const FIELDS = [
  {
    key: "conversionRate",
    label: "Target conversion rate",
    suffix: "%",
    help: `What share of assigned leads should reach Interested, Qualified or Converted. Worth ${METRIC_WEIGHTS.conversion} points.`,
  },
  {
    key: "qualificationRate",
    label: "Target qualification rate",
    suffix: "%",
    help: `What share of assigned leads should reach Qualified. Worth ${METRIC_WEIGHTS.qualified} points.`,
  },
  {
    key: "revenueTarget",
    label: "Revenue target per rep",
    suffix: "",
    help: "Left at 0, revenue is excluded from the score and the other weights scale up to fill 100.",
  },
];

/**
 * Targets are stored per browser, not on the server — this deployment has no
 * settings endpoint for them. That is stated in the dialog rather than left
 * for someone to discover when a colleague sees different scores.
 */
const TargetsDialog = ({ targets, onSave, onClose }) => {
  const [draft, setDraft] = useState({ ...DEFAULT_TARGETS, ...targets });

  const set = (key, value) =>
    setDraft((d) => ({ ...d, [key]: value === "" ? "" : Number(value) }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      conversionRate: Number(draft.conversionRate) || DEFAULT_TARGETS.conversionRate,
      qualificationRate:
        Number(draft.qualificationRate) || DEFAULT_TARGETS.qualificationRate,
      revenueTarget: Number(draft.revenueTarget) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Performance targets
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every score on this page is measured against these.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label
                htmlFor={f.key}
                className="text-xs font-semibold text-foreground"
              >
                {f.label}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id={f.key}
                  type="number"
                  min="0"
                  step="any"
                  value={draft[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-32 rounded-lg border border-border bg-input px-3 py-2 text-sm tabular-nums text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {f.suffix && (
                  <span className="text-sm text-muted-foreground">{f.suffix}</span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {f.help}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          Saved in this browser only — there is no server setting for targets
          yet, so a colleague on another machine keeps their own values.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save targets
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TargetsDialog;
