import { FinanceMetric, UpcomingItem } from "./finance-types";

/** DUMMY veriyi .xlsx olarak indirir — gerçek entegrasyon gelince aynı fonksiyon korunabilir. */
export async function exportFinanceToXlsx(metrics: FinanceMetric[], upcoming: UpcomingItem[]) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["Kalem", "Tür", "Değer", "Değişim (%)"],
    ...metrics.map((m) => [m.label, m.kind === "flow" ? "Akış" : "Anlık Durum", m.value, m.delta ?? ""]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Özet");

  for (const m of metrics) {
    if (m.detail.length === 0) continue;
    const rows = [["Kalem", "Tutar"], ...m.detail.map((d) => [d.label, d.value])];
    const sheetName = m.label.replace(/[:\\/?*[\]]/g, "").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
  }

  const upcomingRows = [
    ["Tür", "Kalem", "Tarih", "Tutar"],
    ...upcoming.map((u) => [
      u.type === "odeme" ? "Ödeme" : "Tahsilat",
      u.label,
      u.date.slice(0, 10),
      u.value,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(upcomingRows), "Yaklasanlar");

  XLSX.writeFile(wb, `finans-ozeti-dummy-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
