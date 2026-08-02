import { CompanyReport, Month, MONTHS } from "./types";
import { sumRowValues } from "./report-utils";

/**
 * Mevcut raporu (görünen tüm satırlarıyla) bir .xlsx dosyası olarak indirir.
 * "xlsx" (SheetJS) tarayıcıda çalışır; buton tıklanınca lazy-load edilir ki
 * ilk sayfa yükünü şişirmesin.
 *
 * `months` verilirse (ör. bir çeyreğin 3 ayı) sadece o aylar dışa aktarılır;
 * verilmezse yılın tamamı aktarılır.
 */
export async function exportReportToXlsx(report: CompanyReport, months: readonly Month[] = MONTHS) {
  const XLSX = await import("xlsx");

  const totalLabel = months.length === MONTHS.length ? `Toplam ${report.period}` : "Toplam";
  const header = ["Gelir Kalemi", "Faaliyet", ...months, totalLabel];
  const rows = report.rows.map((r) => [
    r.label,
    r.faaliyet ?? "",
    ...months.map((m) => r.values[m as Month] ?? ""),
    sumRowValues(r, months),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = [{ wch: 36 }, { wch: 14 }, ...months.map(() => ({ wch: 13 })), { wch: 16 }];

  const wb = XLSX.utils.book_new();
  const sheetName = (report.companyName || "Rapor").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const suffix = months.length === MONTHS.length ? report.period : months.join("-");
  XLSX.writeFile(wb, `${report.companyId}-gelir-raporu-${suffix}.xlsx`);
}
