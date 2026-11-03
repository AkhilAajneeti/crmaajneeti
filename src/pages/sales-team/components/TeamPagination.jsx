import React from "react";
import Icon from "components/AppIcon";

/**
 * Page numbers with ellipses, always showing first and last so the size of the
 * team is visible from any page. Returns a compact window around the current
 * page rather than every number, which stops the control wrapping on mobile.
 */
const pageWindow = (current, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push(`gap-${p}`);
    out.push(p);
    prev = p;
  }
  return out;
};

const TeamPagination = ({ page, pageSize, totalItems, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs tabular-nums text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{from}–{to}</span>{" "}
        of <span className="font-semibold text-foreground">{totalItems}</span> reps
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`${btn} border border-border text-foreground hover:bg-muted`}
        >
          <Icon name="ChevronLeft" size={15} />
        </button>

        {pageWindow(page, totalPages).map((p) =>
          typeof p === "string" ? (
            <span key={p} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${btn} ${
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border text-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={`${btn} border border-border text-foreground hover:bg-muted`}
        >
          <Icon name="ChevronRight" size={15} />
        </button>
      </div>
    </div>
  );
};

export default TeamPagination;
