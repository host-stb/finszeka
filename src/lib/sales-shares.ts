import { SALES_PERIODS, type ProductSales, type SalesPeriod } from "./product-sales";

/** A zero net total has no defined percentage; signed returns remain signed. */
export function revenueShare(revenue: number, total: number): number | null {
  return total === 0 ? null : revenue / total;
}
export function totalRevenue(products: readonly ProductSales[]): Record<SalesPeriod, number> {
  return Object.fromEntries(SALES_PERIODS.map(period => [period,
    products.reduce((total, product) => total + Math.round(product.periods[period].revenue * 100), 0) / 100,
  ])) as Record<SalesPeriod, number>;
}
const percent = new Intl.NumberFormat("tr-TR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function formatRevenueShare(revenue: number, total: number): string {
  const share = revenueShare(revenue, total);
  return share === null ? "—" : percent.format(share);
}
