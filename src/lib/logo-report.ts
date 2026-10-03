import { fetchLogoDurum } from "./logo-api";
import { fetchRevenueChannelReport } from "./revenue-channel-report";
import { revenueReportTotals } from "./revenue-report-totals";
import { classifyCari } from "./logo-category";
import type { RevenueEntry } from "./revenue-channels";
import { type CompanyReport, type CompanySummary, type Month, MONTHS, type ReportRow } from "./types";

const CATEGORY_ORDER = ["Pazaryeri", "E-Ticaret", "Cari Satış", "Grup Firmalar"];
export async function fetchCompaniesFromLogo(base: string): Promise<CompanySummary[]> {
 const status = await fetchLogoDurum(base);
 return status.sirketler.map(company => ({id:company.sirket,name:company.sirket}));
}

/** All customer lines and totals share one complete mirror read; no separate monthly summary calls. */
export function companyReportRows(entries: RevenueEntry[], company: string, endDate: string, basis: "sales" | "net"): ReportRow[] {
 const groups = new Map<string, Map<string, Partial<Record<Month, number>>>>();
 for (const entry of entries.filter(value => value.company === company)) {
  const category = classifyCari(entry.name || "İsimsiz hesap");
  if (!groups.has(category)) groups.set(category,new Map());
  const items = groups.get(category)!;
  const label = `${entry.name || "İsimsiz hesap"} · ${entry.code}`;
  const values = items.get(label) ?? {};
  for (let i=0; i<Number(endDate.slice(5,7)); i++) {
   const amount = entry.periods[`${endDate.slice(0,4)}-${String(i+1).padStart(2,"0")}`];
   if (!amount) continue;
   const revenue = basis === "net" ? amount.revenue : Math.round((amount.gross - amount.returnsGross) * 100) / 100;
   values[MONTHS[i]] = Math.round(((values[MONTHS[i]] ?? 0) + revenue) * 100) / 100;
  }
  items.set(label,values);
 }
 const rows: ReportRow[] = [];
 for (const category of CATEGORY_ORDER) {
  const items = groups.get(category);
  if (!items) continue;
  const values: Partial<Record<Month,number>> = {};
  const children: ReportRow[] = [];
  for (const [label, amounts] of items) {
   children.push({id:`${basis}-${category}-${children.length}`,label,kind:"item",values:amounts});
   for (const month of MONTHS) if (amounts[month]!=null) values[month]=Math.round(((values[month]??0)+amounts[month]!) * 100)/100;
  }
  rows.push({id:`${basis}-cat-${category}`,label:category.toLocaleUpperCase("tr"),kind:"category",values},...children);
 }
 const totals = revenueReportTotals(entries,company,endDate);
 rows.push({id:basis==="net"?"net-ciro":"total",label:basis==="net"?"NET CİRO · KDV HARİÇ · İADELER SONRASI":"SATIŞ TOPLAMI · KDV DAHİL · İADE ÖNCESİ",kind:"total",values:basis==="net"?totals.net:totals.sales});
 return rows;
}
export async function fetchCompanyReportFromLogo(base: string, company: string): Promise<CompanyReport> {
 const report = await fetchRevenueChannelReport(base);
 const totals = revenueReportTotals(report.entries,company,report.endDate);
 return {
  companyId:company, companyName:company, period:report.endDate.slice(0,4),
  columnTitle:`${company.toLocaleUpperCase("tr")} GELİRLER`,generatedAt:new Date().toISOString(),
  totalBasis:"vat-included-after-returns",endDate:report.endDate,
  rows:companyReportRows(report.entries,company,report.endDate,"sales"),
  netRevenueRows:companyReportRows(report.entries,company,report.endDate,"net"),
  netRows:[
   {id:"iade",label:"İADELER · KDV DAHİL",kind:"item",values:totals.returns},
   {id:"net",label:"TOPLAM SATIŞ · KDV DAHİL · İADELER DÜŞÜLMÜŞ",kind:"total",values:totals.gross},
   {id:"net-ciro",label:"NET CİRO · KDV HARİÇ · İADELER DÜŞÜLMÜŞ",kind:"total",values:totals.net},
  ],
 };
}
