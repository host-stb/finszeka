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

const percentFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "always",
});

/** Karşılaştırma yüzdesi için: "+12,4%" / "-3,1%". Değer yoksa "-" döner. */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return `${percentFormatter.format(value)}%`;
}

// getDay()/getUTCDay() sırasına göre: 0=Pazar, 1=Pazartesi, ... 6=Cumartesi.
const GUN_KISALTMALARI = ["PZ", "PT", "SL", "ÇR", "PR", "CM", "CT"];

/** Bir tarihin gün kısaltmasını döner (PT/SL/ÇR/PR/CM/CT/PZ). */
export function gunKisaltmasi(date: Date, utc = true): string {
  return GUN_KISALTMALARI[utc ? date.getUTCDay() : date.getDay()];
}

/** "09.08.2026 PT" — gün kısaltması tarihin hemen yanında. */
export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const tarih = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return `${tarih} ${gunKisaltmasi(date, true)}`;
}

/** "09.08.2026 PT 14:23:10" — gün kısaltması tarihin hemen yanında, saatten önce. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const tarih = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const saat = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
  return `${tarih} ${gunKisaltmasi(date, false)} ${saat}`;
}
