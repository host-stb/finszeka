"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { WebstoreDonem } from "@/lib/webstore-types";

interface KanalKarsilastirma {
  ad: string;
  guncel: number;
  onceki: number;
  degisim: number | null;
}

interface TooltipPayload {
  value: number;
  dataKey: string;
  color: string;
  payload: KanalKarsilastirma;
}

function ChartTooltip({
  active,
  payload,
  guncelEtiket,
  oncekiEtiket,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  guncelEtiket: string;
  oncekiEtiket: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const { ad, degisim } = payload[0].payload;
  return (
    <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
      <p className="font-[family-name:var(--font-display)] text-sm">{ad}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums"
          style={{ color: p.color }}
        >
          {p.dataKey === "guncel" ? guncelEtiket : oncekiEtiket}: {formatCompactCurrency(p.value)} ₺
        </p>
      ))}
      {degisim !== null && (
        <p
          className={`mt-1 text-xs font-medium ${degisim >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}
        >
          {formatPercent(degisim)}
        </p>
      )}
    </div>
  );
}

export default function WebstorePazaryeriKarsilastirma({ donemler }: { donemler: WebstoreDonem[] }) {
  const [donemKey, setDonemKey] = useState<string | null>(null);
  const donem = donemler.find((d) => d.key === donemKey) ?? donemler[0];

  const data: KanalKarsilastirma[] = useMemo(() => {
    if (!donem) return [];
    const kanallar = [
      {
        ad: "Kendi Site",
        guncel: donem.kendiSite.toplamTutar,
        onceki: donem.karsilastirma.kendiSiteToplam,
      },
      ...donem.pazaryerleri.map((p) => ({
        ad: p.ad,
        guncel: p.toplamTutar,
        onceki: donem.karsilastirma.pazaryerleriToplam[p.key] ?? 0,
      })),
    ];
    return kanallar
      .map((k) => ({
        ...k,
        degisim: k.onceki > 0 ? ((k.guncel - k.onceki) / k.onceki) * 100 : null,
      }))
      .sort((a, b) => b.guncel - a.guncel);
  }, [donem]);

  if (!donem) return null;

  return (
    <div className="animate-rise-in flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            Kanal Bazlı Karşılaştırma
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Kendi site + her pazaryeri, güncel dönem vs {donem.karsilastirma.label.toLocaleLowerCase("tr")}.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[var(--paper)] p-1">
          {donemler.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDonemKey(d.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                d.key === donem.key
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:text-[var(--ink-soft)]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 32 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="ad"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={{ stroke: "var(--line-strong)" }}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<ChartTooltip guncelEtiket={donem.label} oncekiEtiket={donem.karsilastirma.label} />}
              cursor={{ fill: "var(--line)", opacity: 0.4 }}
            />
            <Legend
              formatter={(value) => (value === "guncel" ? donem.label : donem.karsilastirma.label)}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="guncel" fill="var(--brass)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="onceki" fill="var(--line-strong)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
