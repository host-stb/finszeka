"use client";

import { CompanySummary } from "@/lib/types";

export default function CompanyTabs({
  companies,
  activeId,
  onSelect,
}: {
  companies: CompanySummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {companies.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group relative shrink-0 px-3.5 py-2 font-[family-name:var(--font-display)] text-[15px] transition-colors ${
              active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {c.name}
            <span
              className={`pointer-events-none absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[var(--brass)] transition-transform duration-300 ${
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
