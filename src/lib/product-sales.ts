import type { LogoSatisSatiri } from "./logo-api";

export const SALES_WINDOWS = [4, 14, 30, 44] as const;
export type SalesWindow = (typeof SALES_WINDOWS)[number];
export interface ProductSales {
  code: string;
  name: string;
  periods: Record<SalesWindow, { quantity: number; revenue: number }>;
}
export interface CompanyProductSales {
  company: string;
  products: ProductSales[];
}

export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const INVOICE_TYPES = new Set([
  "Perakende Satış Faturası", "Toptan Satış Faturası",
  "Perakende Satış İade Faturası", "Toptan Satış İade Faturası",
]);

/** Mirror returns signed returns; preserve their sign and sum invoice line net amounts. */
export function aggregateProductSales(
  rows: LogoSatisSatiri[], company: string, endDate: string,
): CompanyProductSales {
  const products = new Map<string, ProductSales>();
  const starts = Object.fromEntries(SALES_WINDOWS.map(days => [days, shiftDate(endDate, 1 - days)])) as Record<SalesWindow, string>;
  for (const row of rows) {
    if (row.sirket !== company || !INVOICE_TYPES.has(row.fatura_turu)
      || row.fatura_iptal_durumu === "İptal Edilmiş"
      || row.hizmet_kodu?.startsWith("600.")
      || row.birim?.trim().toLocaleUpperCase("tr-TR") !== "ADET") continue;
    const date = row.tarihi.slice(0, 10);
    if (date < starts[44] || date > endDate) continue;
    if (!row.hizmet_kodu || row.miktar == null || row.satir_matrahi == null) {
      throw new Error("Ürün kodu, miktarı veya matrahı eksik satış satırı var.");
    }
    const quantity = Number(row.miktar);
    const cents = Math.round(Number(row.satir_matrahi) * 100);
    if (!Number.isFinite(quantity) || !Number.isFinite(cents)) throw new Error("Geçersiz satış tutarı veya miktarı.");
    let product = products.get(row.hizmet_kodu);
    if (!product) {
      product = {
        code: row.hizmet_kodu, name: row.hizmet_aciklamasi,
        periods: Object.fromEntries(SALES_WINDOWS.map(days => [days, { quantity: 0, revenue: 0 }])) as ProductSales["periods"],
      };
      products.set(product.code, product);
    }
    for (const days of SALES_WINDOWS) {
      if (date >= starts[days]) {
        product.periods[days].quantity += quantity;
        product.periods[days].revenue += cents;
      }
    }
  }
  const ranked = [...products.values()]
    .filter(product => product.periods[44].revenue > 0)
    .sort((a, b) => b.periods[44].revenue - a.periods[44].revenue || a.code.localeCompare(b.code))
    .slice(0, 50);
  for (const product of ranked) {
    for (const days of SALES_WINDOWS) product.periods[days].revenue /= 100;
  }
  return { company, products: ranked };
}
