"use client";

import { useState } from "react";
import WebstoreDailyBreakdown from "./WebstoreDailyBreakdown";
import WebstoreSeriChart from "./WebstoreSeriChart";
import { WebstoreGranularite } from "@/lib/webstore-types";

type Sekme = "gunluk" | WebstoreGranularite;

const SEKMELER: { key: Sekme; label: string }[] = [
  { key: "gunluk", label: "Günlük" },
  { key: "haftalik", label: "Haftalık" },
  { key: "aylik", label: "Aylık" },
  { key: "yillik", label: "Yıllık" },
];

export default function WebstoreTrendSection() {
  const [sekme, setSekme] = useState<Sekme>("gunluk");

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

      {sekme === "gunluk" ? (
        <WebstoreDailyBreakdown />
      ) : (
        <WebstoreSeriChart granularite={sekme} />
      )}
    </div>
  );
}
