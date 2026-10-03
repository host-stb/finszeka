import source from "../data/revenue-accounts.json";
import type { LogoSatisSatiri } from "./logo-api";
import { shiftDate } from "./product-sales";
export const REVENUE_ACCOUNT_SOURCE = source;
export const REVENUE_WINDOWS = [4,14,30,44] as const;
export const DEALER_SEGMENTS = ["Eczacı","Doktor","Fizyoterapist","Diyetisyen","Aktar","Klinik","Farmazon","Diğer bayi"] as const;
export const REVENUE_CATEGORIES = ["Web","Bayi","Cihazlar","Eşleme bekleyen / Diğer"] as const;
export type RevenueCategory = typeof REVENUE_CATEGORIES[number];
const accounts = new Map(source.accounts.map(account => [`${account.company}|${account.code}`,account]));
const normalize = (value:string) => value.toLocaleUpperCase("tr-TR").replace(/İ/g,"I").replace(/Ş/g,"S").replace(/Ğ/g,"G").replace(/Ü/g,"U").replace(/Ö/g,"O").replace(/Ç/g,"C");
const ownSites: Record<string,string> = {
  "Holimer|9.HOLISTIK.COM":"holistikmarket.com", "Holimer|9.TICIMAX":"holistikmarket.com",
  "Holimer|9.DESTEK.COM":"destekurunleri.com (Holimer kaydı)",
  "Fw İlaç|9.FW.DESTEK":"destekurunleri.com", "Fw İlaç|9.TICIMAX":"destekurunleri.com",
};
const serviceCodes = new Set(["600.02.003","600.02.006","600.02.007"]);
export function classifyRevenue(company:string, code:string, itemCode:string) {
  const account = accounts.get(`${company}|${code.trim()}`);
  const base = { matched:!!account, sourceRow:account?.sourceRow ?? null, accountName:account?.name ?? "Excel'de hesap yok" };
  if (serviceCodes.has(itemCode.trim())) return {...base, category:"Cihazlar" as RevenueCategory, segment:"Bakım, onarım ve kalibrasyon", basis:"Hizmet kodu"};
  if (itemCode.startsWith("153TM.03.")) return {...base, category:"Cihazlar" as RevenueCategory, segment:"Tıbbi cihaz ve ekipman", basis:"Ürün kodu 153TM.03"};
  if (!account) return {...base, category:"Eşleme bekleyen / Diğer" as RevenueCategory, segment:"Excel'de bulunmayan hesaplar", basis:"Eşleşme yok"};
  const own = ownSites[`${company}|${code}`];
  if (own) return {...base, category:"Web" as RevenueCategory, segment:own, basis:"Torba cari kodu"};
  if (/^9\.(H|FW)\./.test(code)) return {...base, category:"Web" as RevenueCategory, segment:`Pazaryerleri · ${code.split(".").at(-1)}`, basis:"Pazaryeri cari kodu"};
  const website = account.website.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0];
  if (["holistikmarket.com","destekurunleri.com"].includes(website)) return {...base, category:"Web" as RevenueCategory, segment:website, basis:"Excel WEBADDR"};
  if (["trendyol.com","hepsiburada.com","amazon.com.tr","amazon.com","n11.com","pazarama.com","pttavm.com","idefix.com"].includes(website)) return {...base, category:"Web" as RevenueCategory, segment:`Pazaryerleri · ${website}`, basis:"Excel WEBADDR"};
  // Medical consumables are not silently treated as device or dealer revenue.
  if (itemCode.startsWith("153TM.01.") || itemCode.startsWith("153TM.02.")) return {...base, category:"Eşleme bekleyen / Diğer" as RevenueCategory, segment:"Tıbbi sarf · kapsam teyidi bekleniyor", basis:"Tıbbi sarf ürün kodu"};
  const name=normalize(account.name), profession=normalize(account.professionCode), special=normalize(account.specialCode);
  let segment:string|undefined;
  let basis="Excel özel kodu / açık unvan";
  if (profession==="ECZ" || /ECZANE|\bECZ[. ]/.test(name)) segment="Eczacı";
  else if (profession==="DR" || /\bDR[. ]|DOKTOR/.test(name)) segment="Doktor";
  else if (profession==="DYT" || /DIYETISYEN|\bDYT[. ]/.test(name)) segment="Diyetisyen";
  else if (/FIZYOTERAPIST|FIZYOTERAPI|\bFZT[. ]/.test(name)) segment="Fizyoterapist";
  else if (profession==="KLNK") segment="Klinik";
  else if (/AKTAR/.test(name)) segment="Aktar";
  else if (code.startsWith("120.02.")) {segment="Meslek teyidi bekleyen bayi";basis="120.02 kod grubu; Excel’de meslek belirtilmemiş";}
  else if (code.startsWith("120.04.")) {segment="Meslek teyidi bekleyen bayi";basis="120.04 kod grubu; Excel’de meslek belirtilmemiş";}
  else if (code.startsWith("120.05.")) {segment="Meslek teyidi bekleyen bayi";basis="120.05 kod grubu; Excel’de meslek belirtilmemiş";}
  if (code.startsWith("120.06.") || special==="FARMAZON") segment="Farmazon";
  if (!segment && (special.includes("BAYI") || special.startsWith("OMT") || code.startsWith("120.03."))) segment="Diğer bayi";
  if (segment) return {...base, category:"Bayi" as RevenueCategory, segment, basis};
  return {...base, category:"Eşleme bekleyen / Diğer" as RevenueCategory,
    segment: code.startsWith("120.14.") ? "120.14 · müşteri türü teyidi bekleniyor" : "Diğer hesaplar / gelirler", basis:"Kesin kanal bilgisi yok"};
}
export interface RevenueAmount { revenue:number; vat:number; gross:number; sales:number; returns:number; returnsGross:number }
export interface RevenueEntry {
  company:string;code:string;name:string;category:RevenueCategory;segment:string;basis:string;sourceRow:number|null;
  matched:boolean; periods:Record<string,RevenueAmount>; lines:number;
}
export const emptyRevenue = ():RevenueAmount => ({revenue:0,vat:0,gross:0,sales:0,returns:0,returnsGross:0});
const invoiceTypes = new Set(["Perakende Satış Faturası","Toptan Satış Faturası","Perakende Satış İade Faturası","Toptan Satış İade Faturası","Verilen Hizmet Faturası"]);
export function aggregateRevenueRows(rows:LogoSatisSatiri[], endDate:string):RevenueEntry[] {
 const entries=new Map<string,RevenueEntry>();
 for(const row of rows) {
  if(!["Holimer","Fw İlaç"].includes(row.sirket) || !invoiceTypes.has(row.fatura_turu) || row.fatura_iptal_durumu==="İptal Edilmiş") continue;
  const date=row.tarihi.slice(0,10);
  if(date<`${endDate.slice(0,4)}-01-01` || date>endDate)continue;
  const classification=classifyRevenue(row.sirket,row.cari_hesap_kodu?.trim() ?? "",row.hizmet_kodu?.trim() ?? "");
  const key=[row.sirket,row.cari_hesap_kodu,classification.category,classification.segment,classification.basis].join("|");
  let entry=entries.get(key);
  if(!entry){ entry={company:row.sirket,code:row.cari_hesap_kodu,name:classification.matched?classification.accountName:row.cari_hesap_unvani,...classification,periods:{},lines:0};entries.set(key,entry); }
  const cents=(value:number) => { if(value==null || !Number.isFinite(Number(value)))throw new Error("Eksik veya geçersiz ciro tutarı");return Math.round(Number(value)*100); };
  const revenue=cents(row.satir_matrahi),vat=cents(row.kdv),gross=cents(row.toplami);
  const periods=["year",date.slice(0,7),...REVENUE_WINDOWS.filter(days=>date>=shiftDate(endDate,1-days)).map(String)];
  for(const period of periods){const amount=entry.periods[period]??=emptyRevenue();amount.revenue+=revenue;amount.vat+=vat;amount.gross+=gross;amount[row.fatura_turu.includes("İade")?"returns":"sales"]+=revenue;if(row.fatura_turu.includes("İade"))amount.returnsGross+=gross;}
  entry.lines++;
 }
 for(const entry of entries.values())for(const amount of Object.values(entry.periods))for(const key of Object.keys(amount) as (keyof RevenueAmount)[])amount[key]/=100;
 return [...entries.values()];
}
export function mergeRevenueEntries(parts:RevenueEntry[][]):RevenueEntry[] {
 const combined=new Map<string,RevenueEntry>();
 for(const entries of parts)for(const entry of entries){
  const key=[entry.company,entry.code,entry.category,entry.segment,entry.basis].join("|");
  let total=combined.get(key);if(!total){total={...entry,periods:{},lines:0};combined.set(key,total);}
  total.lines+=entry.lines;
  for(const [period,amount] of Object.entries(entry.periods)){const target=total.periods[period]??=emptyRevenue();for(const field of Object.keys(amount) as (keyof RevenueAmount)[])target[field]=Math.round((target[field]+amount[field])*100)/100;}
 }
 return [...combined.values()];
}
export function sumRevenue(entries:RevenueEntry[], period:string):RevenueAmount {
 const total=emptyRevenue();for(const entry of entries)for(const field of Object.keys(total) as (keyof RevenueAmount)[])total[field]=Math.round((total[field]+(entry.periods[period]?.[field]??0))*100)/100;return total;
}
export const segmentSlug = (value:string) => normalize(value).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
