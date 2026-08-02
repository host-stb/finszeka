"use client";

import { CompanyReport, Month, MONTHS } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/format";
import { CalendarIcon, CoinsIcon, LayersIcon, TrendingUpIcon } from "./icons";

function computeStats(report: CompanyReport, months: readonly Month[]) {
  const totalRow = report.rows.find((r) => r.kind === "total");
  const categoryCount = report.rows.filter(
    (r) => r.kind === "category" && months.some((m) => r.values[m] !== null && r.values[m] !== undefined)
  ).length;

  let grandTotal = 0;
  let monthsWithData = 0;
  let bestMonth: { month: string; value: number } | null = null;

  if (totalRow) {
    for (const m of months) {
      const v = totalRow.values[m];
      if (v !== null && v !== undefined) {
        grandTotal += v;
        monthsWithData += 1;
        if (!bestMonth || v > bestMonth.value) bestMonth = { month: m, value: v };
      }
    }
  }

  const avgMonthly = monthsWithData > 0 ? grandTotal / monthsWithData : 0;

  return { grandTotal, monthsWithData, bestMonth, avgMonthly, categoryCount };
}

export default function SummaryCards({
  report,
  months = MONTHS,
  periodLabel,
  compact = false,
}: {
  report: CompanyReport;
  /** Sadece bu aylar üzerinden hesapla (ör. bir çeyreğin 3 ayı). Verilmezse yılın tamamı. */
  months?: readonly Month[];
  /** "Toplam Gelir" kartındaki alt yazı. Verilmezse report.period kullanılır. */
  periodLabel?: string;
  /** Çeyrek bölümlerinde daha küçük/sade kartlar için. */
  compact?: boolean;
}) {
  const { grandTotal, bestMonth, avgMonthly, categoryCount, monthsWithData } = computeStats(
    report,
    months
  );

  const cards = [
    {
      label: "Toplam Gelir",
      value: `${formatCompactCurrency(grandTotal)} ₺`,
      sub: periodLabel ?? `${report.period} dönemi`,
      icon: CoinsIcon,
    },
    {
      label: "En Güçlü Ay",
      value: bestMonth ? bestMonth.month : "-",
      sub: bestMonth ? `${formatCompactCurrency(bestMonth.value)} ₺` : "veri yok",
      icon: TrendingUpIcon,
    },
    {
      label: "Aylık Ortalama",
      value: `${formatCompactCurrency(avgMonthly)} ₺`,
      sub: `${monthsWithData} ay üzerinden`,
      icon: CalendarIcon,
    },
    {
      label: "Kategori",
      value: String(categoryCount),
      sub: "gelir kırılımı",
      icon: LayersIcon,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`animate-rise-in relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${
            compact ? "p-3" : "p-4"
          }`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="absolute right-3 top-3 text-[var(--brass)]/30">
            <card.icon className={compact ? "h-6 w-6" : "h-8 w-8"} />
          </div>
          <p
            className={`font-medium uppercase tracking-wider text-[var(--muted)] ${
              compact ? "text-[10px]" : "text-xs"
            }`}
          >
            {card.label}
          </p>
          <p
            className={`mt-1.5 font-[family-name:var(--font-mono)] font-semibold text-[var(--ink)] tabular-nums ${
              compact ? "text-lg" : "mt-2 text-2xl"
            }`}
          >
            {card.value}
          </p>
          <p className={`mt-1 text-[var(--muted)] ${compact ? "text-[10.5px]" : "text-xs"}`}>
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
