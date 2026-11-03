// Sales Performance Score, 0–100.
//
// Five weighted metrics. Each contributes (actual ÷ target) × its weight,
// capped at the weight so one spectacular month cannot buy back a bad one
// elsewhere, and the total is capped at 100.
//
// The rule that matters most here is the one about missing data: a metric the
// backend cannot answer is DROPPED, not scored as zero, and the remaining
// weights are renormalised to still total 100. Scoring an unmeasurable metric
// as zero would punish reps for a gap in the CRM rather than in their work.
// A score computed that way is flagged provisional, and the UI says so.

export const DEFAULT_TARGETS = {
  // Percentage of assigned leads that reach Interested / Qualified / Converted.
  conversionRate: 10,
  // Percentage of assigned leads that reach Qualified.
  qualificationRate: 20,
  // Per-rep revenue target for the period. 0 means "not set", which drops the
  // metric rather than scoring everyone zero.
  revenueTarget: 0,
};

const TARGETS_KEY = "sales_team_targets";

export const loadTargets = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(TARGETS_KEY));
    return { ...DEFAULT_TARGETS, ...(stored || {}) };
  } catch {
    return { ...DEFAULT_TARGETS };
  }
};

export const saveTargets = (targets) => {
  try {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
  } catch {}
};

export const METRIC_WEIGHTS = {
  conversion: 35,
  followUp: 20,
  qualified: 15,
  siteVisits: 15,
  revenue: 15,
};

export const METRIC_LABELS = {
  conversion: "Conversion rate",
  followUp: "Follow-up discipline",
  qualified: "Qualified leads",
  siteVisits: "Site visits",
  revenue: "Revenue",
};

const ratio = (actual, target) => {
  if (!target || target <= 0) return null;
  if (actual == null) return null;
  return actual / target;
};

/**
 * @param {object} m   raw counts for one rep over the selected period
 * @param {object} targets
 * @returns {{ total:number, provisional:boolean, breakdown:Array, missing:string[] }}
 */
export const calculateScore = (m = {}, targets = DEFAULT_TARGETS) => {
  const parts = [];

  // 1. Conversion — actual rate against the target rate.
  // `assigned` of 0 is not a failure, it is no data: a rep handed nothing
  // cannot convert anything.
  const conversionRate =
    m.assigned > 0 && m.won != null ? (m.won / m.assigned) * 100 : null;
  parts.push({
    key: "conversion",
    ratio: ratio(conversionRate, targets.conversionRate),
    detail:
      conversionRate == null
        ? "No leads assigned in this period"
        : `${conversionRate.toFixed(1)}% of ${m.assigned} leads vs ${targets.conversionRate}% target`,
  });

  // 2. Follow-up discipline — of the follow-ups that came due in the period,
  // how many were dealt with before their date passed. "Missed" is the count
  // still sitting past its date, so on-time is the remainder.
  const due = m.followUpsDue;
  const missed = m.followUpsMissed;
  const onTime = due != null && missed != null ? Math.max(0, due - missed) : null;
  parts.push({
    key: "followUp",
    ratio: due > 0 && onTime != null ? onTime / due : null,
    detail:
      due > 0 && onTime != null
        ? `${onTime} of ${due} follow-ups handled before their date`
        : "No follow-ups fell due in this period",
  });

  // 3. Qualified leads — qualification rate against its own target.
  const qualRate =
    m.assigned > 0 && m.qualified != null ? (m.qualified / m.assigned) * 100 : null;
  parts.push({
    key: "qualified",
    ratio: ratio(qualRate, targets.qualificationRate),
    detail:
      qualRate == null
        ? "No leads assigned in this period"
        : `${qualRate.toFixed(1)}% qualified vs ${targets.qualificationRate}% target`,
  });

  // 4. Site visits — completed against booked. Statuses are mutually
  // exclusive, so "scheduled" here means booked-and-not-yet-done; the
  // denominator adds the two rather than double counting either.
  const booked =
    m.siteVisitScheduled != null && m.siteVisitDone != null
      ? m.siteVisitScheduled + m.siteVisitDone
      : null;
  parts.push({
    key: "siteVisits",
    ratio: booked > 0 && m.siteVisitDone != null ? m.siteVisitDone / booked : null,
    detail:
      booked > 0
        ? `${m.siteVisitDone} of ${booked} booked visits completed`
        : "No site visits booked in this period",
  });

  // 5. Revenue — only scored when a target is set AND the backend reports an
  // amount. Neither is true in this deployment today, so it drops out and the
  // other four renormalise to 100.
  parts.push({
    key: "revenue",
    ratio: ratio(m.revenue, targets.revenueTarget),
    detail:
      !targets.revenueTarget || targets.revenueTarget <= 0
        ? "No revenue target set"
        : m.revenue == null
          ? "Revenue not reported by the backend"
          : `${m.revenue} of ${targets.revenueTarget} target`,
  });

  const available = parts.filter((p) => p.ratio != null);
  const missing = parts.filter((p) => p.ratio == null).map((p) => p.key);

  if (available.length === 0) {
    return {
      total: null,
      provisional: true,
      breakdown: parts.map((p) => ({
        ...p,
        label: METRIC_LABELS[p.key],
        weight: METRIC_WEIGHTS[p.key],
        points: null,
        available: false,
      })),
      missing,
    };
  }

  // Renormalise: the available weights are scaled up to fill 100 so a rep is
  // never capped below 100 just because a metric could not be measured.
  const availableWeight = available.reduce(
    (sum, p) => sum + METRIC_WEIGHTS[p.key],
    0
  );
  const scale = 100 / availableWeight;

  const breakdown = parts.map((p) => {
    const isAvailable = p.ratio != null;
    const weight = METRIC_WEIGHTS[p.key] * (isAvailable ? scale : 1);
    // Each metric is capped at its own weight before anything is summed.
    const points = isAvailable ? Math.min(weight, p.ratio * weight) : null;

    return {
      key: p.key,
      label: METRIC_LABELS[p.key],
      weight: Math.round(weight),
      points: points == null ? null : Math.round(points),
      available: isAvailable,
      detail: p.detail,
    };
  });

  const total = Math.min(
    100,
    Math.round(breakdown.reduce((sum, b) => sum + (b.points || 0), 0))
  );

  return {
    total,
    // Anything short of all five metrics is an incomplete picture, and the
    // badge says so rather than presenting a renormalised number as final.
    provisional: missing.length > 0,
    breakdown,
    missing,
  };
};

/** Colour band for a score badge. */
export const scoreTone = (score) => {
  if (score == null) return "bg-slate-100 text-slate-600 border-slate-200";
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};
