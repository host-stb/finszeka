import { Month, MONTHS, ReportRow } from "./types";

export const MONTH_SHORT: Record<Month, string> = {
  Ocak: "Oca",
  Şubat: "Şub",
  Mart: "Mar",
  Nisan: "Nis",
  Mayıs: "May",
  Haziran: "Haz",
  Temmuz: "Tem",
  Ağustos: "Ağu",
  Eylül: "Eyl",
  Ekim: "Eki",
  Kasım: "Kas",
  Aralık: "Ara",
};

export const QUARTERS: { label: string; months: Month[] }[] = [
  { label: "Ç1", months: ["Ocak", "Şubat", "Mart"] },
  { label: "Ç2", months: ["Nisan", "Mayıs", "Haziran"] },
  { label: "Ç3", months: ["Temmuz", "Ağustos", "Eylül"] },
  { label: "Ç4", months: ["Ekim", "Kasım", "Aralık"] },
];

/**
 * Bir satırın (kategori/kalem/toplam) verilen aylar için toplamı.
 * `months` verilmezse yılın tamamı toplanır; bir çeyreğe özgü tabloda
 * sadece o çeyreğin 3 ayını vermek için kullanılır.
 */
export function sumRowValues(row: ReportRow, months: readonly Month[] = MONTHS): number {
  let sum = 0;
  for (const m of months) {
    const v = row.values[m as Month];
    if (v !== null && v !== undefined) sum += v;
  }
  return sum;
}

/** Bir çeyreğin en az bir ayında veri olup olmadığı. */
export function quarterHasData(row: ReportRow | undefined, months: readonly Month[]): boolean {
  if (!row) return false;
  return months.some((m) => row.values[m as Month] !== null && row.values[m as Month] !== undefined);
}
