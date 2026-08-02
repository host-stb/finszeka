"use client";

import { CompanyReport } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/format";
import { QUARTERS, quarterHasData, sumRowValues } from "@/lib/report-utils";

export default function QuarterCompareCards({ report }: { report: CompanyReport }) {
  const totalRow = report.rows.find((r) => r.kind === "total");

  const quarters = QUARTERS.map((q) => ({
    ...q,
    total: totalRow ? sumRowValues(totalRow, q.months) : 0,
    hasData: quarterHasData(totalRow, q.months),
  }));

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        Çeyrekler Arası Karşılaştırma
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quarters.map((q, i) => {
          const prev = i > 0 ? quarters[i - 1] : null;
          const canCompare = q.hasData && prev?.hasData && prev.total !== 0;
          const delta = canCompare ? ((q.total - prev!.total) / prev!.total) * 100 : null;

          return (
            <div
              key={q.label}
              className="animate-rise-in relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brass-strong)]">
                  {q.label}
                </p>
                {delta !== null && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                      delta >= 0
                        ? "bg-[var(--positive)]/10 text-[var(--positive)]"
                        : "bg-[var(--negative)]/10 text-[var(--negative)]"
                    }`}
                    title="Bir önceki çeyreğe göre değişim"
                  >
                    {delta >= 0 ? "▲" : "▼"} %{Math.abs(delta).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-xl font-semibold text-[var(--ink)] tabular-nums sm:text-2xl">
                {q.hasData ? `${formatCompactCurrency(q.total)} ₺` : "-"}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {q.months[0]} – {q.months[2]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
