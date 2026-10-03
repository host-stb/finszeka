"use client";

import { CompanySummary, RevenueBasis } from "@/lib/types";

export default function CompanyTabs({
  companies,
  activeId,
  onSelect,
  basis = "gross-after",
  onBasisSelect,
}: {
  companies: CompanySummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  basis?: RevenueBasis;
  onBasisSelect?: (basis: RevenueBasis) => void;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {(onBasisSelect ? ["gross-after", "gross-before", "net-after"] as RevenueBasis[] : ["gross-after"] as RevenueBasis[]).flatMap(value => companies.map((c) => {
        const active = c.id === activeId && (!onBasisSelect || basis === value);
        const companyName = c.id === "Fw İlaç" ? "FW" : c.name;
        const label = value === "gross-before" ? `${companyName} (KDV Dahil-İade Öncesi)` : value === "net-after" ? `${companyName} (KDV Hariç-İadeler Sonrası)` : companyName;
        return (
          <button
            key={`${c.id}-${value}`}
            onClick={() => { onBasisSelect?.(value); onSelect(c.id); }}
            aria-pressed={active}
            title={value === "gross-after" ? "KDV dahil, iadeler sonrası" : label}
            className={`group relative shrink-0 px-3.5 py-2 font-[family-name:var(--font-display)] text-[12px] transition-colors ${
              active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {label}
            <span
              className={`pointer-events-none absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[var(--brass)] transition-transform duration-300 ${
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
              }`}
            />
          </button>
        );
      }))}
    </nav>
  );
}
