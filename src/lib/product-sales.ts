import { isOwnWebsiteSale } from "./website-sales";
import type { LogoSatisSatiri } from "./logo-api";
import { EVALUATED_PRODUCT_MAP } from "./product-inventory";

export const SALES_WINDOWS = [4, 14, 30, 44] as const;
export const SALES_PERIODS = [...SALES_WINDOWS, "year"] as const;
export type SalesPeriod = (typeof SALES_PERIODS)[number];
export type SalesWindow = (typeof SALES_WINDOWS)[number];
export interface ProductSales {
  code: string;
  name: string;
  periods: Record<SalesPeriod, { quantity: number; revenue: number }>;
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
  inventory: ReadonlyMap<string, { name: string }> = EVALUATED_PRODUCT_MAP,
  limit: number | null = 50,
  yearEndDate: string = endDate,
): CompanyProductSales {
  const products = new Map<string, ProductSales>();
  const starts = Object.fromEntries(SALES_WINDOWS.map(days => [days, shiftDate(endDate, 1 - days)])) as Record<SalesWindow, string>;
  const yearStart = `${yearEndDate.slice(0,4)}-01-01`;
  const scanStart = starts[44] < yearStart ? starts[44] : yearStart;
  for (const row of rows) {
    if (row.sirket !== company || !INVOICE_TYPES.has(row.fatura_turu)
      || row.fatura_iptal_durumu === "İptal Edilmiş"
      || !isOwnWebsiteSale(row.sirket, row.cari_hesap_kodu)
      || !inventory.has(row.hizmet_kodu?.trim())
      || row.birim?.trim().toLocaleUpperCase("tr-TR") !== "ADET") continue;
    const code = row.hizmet_kodu.trim();
    const date = row.tarihi.slice(0, 10);
    if (date < scanStart || date > yearEndDate) continue;
    if (!row.hizmet_kodu || row.miktar == null || row.satir_matrahi == null) {
      throw new Error("Ürün kodu, miktarı veya matrahı eksik satış satırı var.");
    }
    const quantity = Number(row.miktar);
    const cents = Math.round(Number(row.satir_matrahi) * 100);
    if (!Number.isFinite(quantity) || !Number.isFinite(cents)) throw new Error("Geçersiz satış tutarı veya miktarı.");
    let product = products.get(code);
    if (!product) {
      product = {
        code, name: inventory.get(code)!.name,
        periods: Object.fromEntries(SALES_PERIODS.map(days => [days, { quantity: 0, revenue: 0 }])) as ProductSales["periods"],
      };
      products.set(product.code, product);
    }
    for (const days of SALES_PERIODS) {
      if (days === "year" ? date >= yearStart : date >= starts[days] && date <= endDate) {
        product.periods[days].quantity += quantity;
        product.periods[days].revenue += cents;
      }
    }
  }
  const ranked = [...products.values()]
    .filter(product => limit === null || product.periods[44].revenue > 0)
    .sort((a, b) => b.periods[44].revenue - a.periods[44].revenue || a.code.localeCompare(b.code))
    .slice(0, limit ?? products.size);
  for (const product of ranked) {
    for (const days of SALES_PERIODS) product.periods[days].revenue /= 100;
  }
  return { company, products: ranked };
}

export function combineCompanySales(companies: CompanyProductSales[]) {
  const combined = new Map<string, ProductSales & { companies: CompanyProductSales[] }>();
  for (const company of companies) for (const product of company.products) {
    let total = combined.get(product.code);
    if (!total) {
      total = { code: product.code, name: product.name, periods: Object.fromEntries(
        SALES_PERIODS.map(days => [days, { quantity: 0, revenue: 0 }])
      ) as ProductSales["periods"], companies: [] };
      combined.set(product.code, total);
    }
    total.companies.push({ company: company.company, products: [product] });
    for (const days of SALES_PERIODS) {
      total.periods[days].quantity += product.periods[days].quantity;
      total.periods[days].revenue = Math.round((total.periods[days].revenue + product.periods[days].revenue) * 100) / 100;
    }
  }
  return [...combined.values()].filter(product => product.periods[44].revenue > 0)
    .sort((a,b) => b.periods[44].revenue - a.periods[44].revenue || a.code.localeCompare(b.code)).slice(0,50);
}
export function companySalesLabel(company: string) {
  return company === "Holimer" ? "holistikmarket.com (Holimer)" : "destekurunleri.com (FW)";
}

/** Merge page totals before selecting the top 50; keep signed returns and all periods. */
export function mergeProductSales(parts: CompanyProductSales[], company: string): CompanyProductSales {
  const map = new Map<string,ProductSales>();
  for (const part of parts) for (const product of part.products) {
    let total = map.get(product.code);
    if (!total) { total={code:product.code,name:product.name,periods:Object.fromEntries(SALES_PERIODS.map(period=>[period,{quantity:0,revenue:0}])) as ProductSales["periods"]};map.set(product.code,total); }
    for (const period of SALES_PERIODS) {
      total.periods[period].quantity += product.periods[period].quantity;
      total.periods[period].revenue = Math.round((total.periods[period].revenue+product.periods[period].revenue)*100)/100;
    }
  }
  return {company,products:[...map.values()].sort((a,b)=>b.periods[44].revenue-a.periods[44].revenue||a.code.localeCompare(b.code))};
}
