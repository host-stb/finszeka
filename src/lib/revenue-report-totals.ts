import { MONTHS, type Month } from "./types";
import { sumRevenue, type RevenueEntry } from "./revenue-channels";

/** Use the same full invoice population and cutoff as the channel report. */
export function revenueReportTotals(entries: RevenueEntry[], company: string, endDate: string) {
 const selected = entries.filter(entry => entry.company === company);
 const sales: Partial<Record<Month, number>> = {};
 const returns: Partial<Record<Month, number>> = {};
 const gross: Partial<Record<Month, number>> = {};
 const net: Partial<Record<Month, number>> = {};
 for (let i=0; i<Number(endDate.slice(5,7)); i++) {
  const period = `${endDate.slice(0,4)}-${String(i+1).padStart(2,"0")}`;
  const amount = sumRevenue(selected,period);
  const month = MONTHS[i];
  sales[month] = Math.round((amount.gross - amount.returnsGross) * 100) / 100;
  returns[month] = amount.returnsGross;
  gross[month] = amount.gross;
  net[month] = amount.revenue;
 }
 return { sales, returns, gross, net };
}
