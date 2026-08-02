const numberFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Ekran görüntüsündeki gibi: "3.699.219,43". Değer yoksa "-" döner. */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return numberFormatter.format(value);
}

const compactFormatter = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

/** KPI kartları için kısaltılmış gösterim: "3,7 Mn". Değer yoksa "-" döner. */
export function formatCompactCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return compactFormatter.format(value);
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
