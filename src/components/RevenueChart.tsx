"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CompanyReport, Month, MONTHS } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/format";
import { MONTH_SHORT } from "@/lib/report-utils";

interface ChartTooltipPayload {
  value: number | null;
  payload: { fullMonth: string };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  if (point.value === null || point.value === undefined) return null;

  return (
    <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
      <p className="font-[family-name:var(--font-display)] text-sm">{point.payload.fullMonth}</p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--brass-soft)]">
        {formatCompactCurrency(point.value)} ₺
      </p>
    </div>
  );
}

export default function RevenueChart({ report }: { report: CompanyReport }) {
  const totalRow = report.rows.find((r) => r.kind === "total");
  const data = MONTHS.map((m) => ({
    month: MONTH_SHORT[m],
    fullMonth: m,
    value: totalRow?.values[m as Month] ?? null,
  }));
  const hasData = data.some((d) => d.value !== null && d.value !== undefined);

  return (
    <div className="animate-rise-in rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        Aylık Toplam Gelir Trendi
      </p>
      {hasData ? (
        <div className="h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brass)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--brass)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={{ stroke: "var(--line-strong)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--brass)"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                dot={{ r: 3, fill: "var(--brass)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--brass-strong)", stroke: "var(--paper-card)", strokeWidth: 2 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center text-sm text-[var(--muted)] sm:h-64">
          Bu dönem için veri yok
        </div>
      )}
    </div>
  );
}
