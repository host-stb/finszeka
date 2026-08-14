"use client";

import { useState } from "react";
import KutuSeriChart from "./KutuSeriChart";
import { KutuGranularite } from "@/lib/kutu-types";

const SEKMELER: { key: KutuGranularite; label: string }[] = [
  { key: "gunluk", label: "Günlük" },
  { key: "haftalik", label: "Haftalık" },
  { key: "aylik", label: "Aylık" },
  { key: "yillik", label: "Yıllık" },
];

export default function KutuTrendSection() {
  const [sekme, setSekme] = useState<KutuGranularite>("gunluk");

  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1">
        {SEKMELER.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSekme(s.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              sekme === s.key
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "text-[var(--muted)] hover:bg-[var(--paper-card)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <KutuSeriChart granularite={sekme} />
    </div>
  );
}
