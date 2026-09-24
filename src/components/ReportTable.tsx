"use client";

import { useMemo, useState } from "react";
import { CompanyReport, Month, MONTHS, ReportRow } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { exportReportToXlsx } from "@/lib/export";
import { MONTH_SHORT, sumRowValues } from "@/lib/report-utils";
import {
  ArrowUpDownIcon,
  BriefcaseIcon,
  BuildingIcon,
  CartIcon,
  ChevronIcon,
  DownloadIcon,
  FlaskIcon,
  HeartIcon,
  LeafIcon,
  MonitorIcon,
  UsersIcon,
} from "./icons";

const PAGE_SIZE = 8;

type Section = { header: ReportRow; items: ReportRow[] };
type SortKey = "label" | "total";
type SortDir = "asc" | "desc";

function groupRows(rows: ReportRow[]): { sections: Section[]; total: ReportRow | null } {
  const sections: Section[] = [];
  let total: ReportRow | null = null;
  let current: Section | null = null;

  for (const row of rows) {
    if (row.kind === "total") {
      total = row;
      continue;
    }
    if (row.kind === "category") {
      current = { header: row, items: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { header: { ...row, kind: "category" }, items: [] };
      sections.push(current);
      continue;
    }
    current.items.push(row);
  }

  return { sections, total };
}

function faaliyetShort(f?: string): string | null {
  if (!f) return null;
  return f.replace(/^Faaliyet\s*/i, "");
}

function categoryIcon(label: string) {
  const l = label.toLocaleLowerCase("tr");
  if (l.includes("pazar")) return CartIcon;
  if (l.includes("e-ticaret") || l.includes("eticaret")) return MonitorIcon;
  if (l.includes("cari")) return UsersIcon;
  if (l.includes("grup firma")) return BuildingIcon;
  if (l.includes("sağlık") || l.includes("vital") || l.includes("anfora")) return HeartIcon;
  if (l.includes("ilaç") || l.includes("ilac")) return BriefcaseIcon;
  if (l.includes("gıda") || l.includes("tüketim") || l.includes("takviye")) return FlaskIcon;
  return LeafIcon;
}

function AmountCell({ value, className }: { value: number | null | undefined; className: string }) {
  const text = formatCurrency(value ?? null);
  return (
    <div
      title={text}
      className={`overflow-hidden text-ellipsis whitespace-nowrap px-1.5 py-2 text-right tabular-nums sm:px-2 ${className}`}
    >
      {text}
    </div>
  );
}

function SortButton({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-center gap-1 truncate text-left text-[10.5px] font-medium uppercase tracking-wider text-[var(--paper)]/70 hover:text-[var(--paper)] sm:text-[11px]"
    >
      <span className="truncate">{children}</span>
      <ArrowUpDownIcon
        className={`h-3 w-3 shrink-0 transition-opacity ${
          active ? "opacity-100 text-[var(--brass-soft)]" : "opacity-40"
        } ${active && dir === "desc" ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export default function ReportTable({
  report,
  months = MONTHS,
  totalLabel,
}: {
  report: CompanyReport;
  /** Bu tabloda gösterilecek aylar. Verilmezse yılın tamamı gösterilir. */
  months?: readonly Month[];
  /** "Toplam" sütununun başlığı. Verilmezse dönemden türetilir. */
  totalLabel?: string;
}) {
  const { sections: rawSections, total } = useMemo(() => groupRows(report.rows), [report.rows]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);
  const [page, setPage] = useState(0);

  const gridTemplate = `minmax(180px, 1.7fr) 106px repeat(${months.length}, minmax(0, 1fr)) 28px`;
  const resolvedTotalLabel =
    totalLabel ??
    (months.length === MONTHS.length ? `Toplam ${report.period}` : "Toplam");

  const sections = useMemo(() => {
    if (!sort) return rawSections;
    const copy = [...rawSections];
    copy.sort((a, b) => {
      const cmp =
        sort.key === "label"
          ? a.header.label.localeCompare(b.header.label, "tr")
          : sumRowValues(a.header, months) - sumRowValues(b.header, months);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rawSections, sort, months]);

  const pageCount = Math.max(1, Math.ceil(sections.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedSections = sections.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  const toggleRow = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-rise-in overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <div className="ledger-scroll max-h-[70vh] overflow-y-auto overflow-x-hidden">
        <div
          className="sticky top-0 z-20 grid items-center border-b border-[var(--line-strong)] bg-[var(--ink)] text-[var(--paper)]"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="flex items-center px-3 py-2.5 sm:px-4">
            <SortButton
              active={sort?.key === "label"}
              dir={sort?.dir ?? "asc"}
              onClick={() => toggleSort("label")}
            >
              Gelir Kalemi
            </SortButton>
          </div>
          <div className="flex items-center justify-end px-1.5 py-2.5 sm:px-2">
            <SortButton
              active={sort?.key === "total"}
              dir={sort?.dir ?? "asc"}
              onClick={() => toggleSort("total")}
            >
              {resolvedTotalLabel}
            </SortButton>
          </div>
          {months.map((m) => (
            <div
              key={m}
              title={m}
              className="px-1.5 py-2.5 text-right text-[10.5px] font-medium uppercase tracking-wider text-[var(--paper)]/70 sm:px-2 sm:text-[11px]"
            >
              {MONTH_SHORT[m]}
            </div>
          ))}
          <div />
        </div>

        {/* Kategori bölümleri */}
        {pagedSections.map((section, sIndex) => {
          const isCollapsed = collapsed.has(section.header.id);
          const Icon = categoryIcon(section.header.label);
          return (
            <div key={section.header.id}>
              <button
                type="button"
                onClick={() => toggleRow(section.header.id)}
                className="grid w-full items-center border-b border-[var(--line)] bg-[var(--brass-soft)]/40 text-left transition-colors hover:bg-[var(--brass-soft)]/70"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="flex min-w-0 items-center gap-2 px-2 py-2.5 sm:px-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--brass)]/15 text-[var(--brass-strong)]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span
                    title={section.header.label}
                    className="truncate font-[family-name:var(--font-display)] text-[13px] font-medium text-[var(--ink)] sm:text-[15px]"
                  >
                    {section.header.label}
                  </span>
                </div>
                <AmountCell
                  value={sumRowValues(section.header, months)}
                  className="font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--ink)] sm:text-[12.5px]"
                />
                {months.map((m) => (
                  <AmountCell
                    key={m}
                    value={section.header.values[m as Month]}
                    className="font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--ink-soft)] sm:text-[12.5px]"
                  />
                ))}
                <div className="flex items-center justify-center">
                  <ChevronIcon
                    className={`h-3.5 w-3.5 text-[var(--brass-strong)] transition-transform duration-300 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isCollapsed ? "0fr" : "1fr",
                  transition: "grid-template-rows 280ms cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <div className="overflow-hidden">
                  {section.items.map((item, iIndex) => {
                    const badge = faaliyetShort(item.faaliyet);
                    const zebra = iIndex % 2 === 1;
                    return (
                      <div
                        key={item.id}
                        className={`grid items-center border-b border-[var(--line)]/70 ${
                          zebra ? "bg-[var(--paper)]/40" : "bg-[var(--paper-card)]"
                        } hover:bg-[var(--brass-soft)]/25`}
                        style={{ gridTemplateColumns: gridTemplate }}
                      >
                        <div className="flex min-w-0 items-center gap-1.5 px-2 py-2 pl-9 sm:gap-2 sm:px-3 sm:pl-12">
                          <span
                            title={item.label}
                            className="truncate text-[12px] text-[var(--ink-soft)] sm:text-[13px]"
                          >
                            {item.label}
                          </span>
                          {badge && (
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px] ${
                                badge === "İçi"
                                  ? "bg-[var(--positive)]/10 text-[var(--positive)]"
                                  : "bg-[var(--muted)]/15 text-[var(--muted)]"
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </div>
                        <AmountCell
                          value={sumRowValues(item, months)}
                          className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--ink-soft)] sm:text-[12.5px]"
                        />
                        {months.map((m) => (
                          <AmountCell
                            key={m}
                            value={item.values[m as Month]}
                            className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--ink-soft)] sm:text-[12.5px]"
                          />
                        ))}
                        <div />
                      </div>
                    );
                  })}
                </div>
              </div>
              {sIndex === pagedSections.length - 1 && <div className="h-1" />}
            </div>
          );
        })}

        {/* Toplam satırı (+ varsa iade ve net gelir) */}
        {total && (
          <div className="sticky bottom-0 z-20 border-t border-[var(--brass)]/40 bg-[var(--ink)] text-[var(--paper)]">
            {[total, ...(report.netRows ?? [])].map((row) => {
              const isIade = row.kind !== "total";
              const amountClass = `font-[family-name:var(--font-mono)] text-[11px] sm:text-[12.5px] ${
                isIade ? "font-medium text-[var(--paper)]/70" : "font-bold text-[var(--brass-soft)]"
              }`;
              return (
                <div
                  key={row.id}
                  className={`grid items-center ${row.id === "net" ? "border-t border-[var(--brass)]/40" : ""}`}
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  <div
                    className={`truncate px-2 font-[family-name:var(--font-display)] tracking-tight sm:px-3 ${
                      isIade
                        ? "py-2 text-[12px] text-[var(--paper)]/70 sm:text-[13px]"
                        : "py-3 text-[13px] font-semibold sm:text-[15px]"
                    }`}
                  >
                    {row.label}
                  </div>
                  <AmountCell value={sumRowValues(row, months)} className={amountClass} />
                  {months.map((m) => (
                    <AmountCell key={m} value={row.values[m as Month]} className={amountClass} />
                  ))}
                  <div />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alt bilgi çubuğu: sayım, sayfalama, dışa aktarma */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
        <p className="text-xs text-[var(--muted)]">{sections.length} gelir kalemi</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Önceki sayfa"
          >
            <ChevronIcon className="h-4 w-4 rotate-90" />
          </button>
          <span className="min-w-[1.5rem] text-center text-xs font-medium text-[var(--ink-soft)]">
            {currentPage + 1}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Sonraki sayfa"
          >
            <ChevronIcon className="h-4 w-4 -rotate-90" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => exportReportToXlsx(report, months)}
          className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          Excel&apos;e Aktar
        </button>
      </div>
    </div>
  );
}
