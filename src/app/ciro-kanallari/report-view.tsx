import { formatRevenueShare } from "@/lib/sales-shares";
import Link from "next/link";
import { DEALER_SEGMENTS, REVENUE_ACCOUNT_SOURCE, REVENUE_CATEGORIES, REVENUE_WINDOWS, emptyRevenue, segmentSlug, sumRevenue, type RevenueEntry } from "@/lib/revenue-channels";
import type { fetchRevenueChannelReport } from "@/lib/revenue-channel-report";
export type ChannelReport = Awaited<ReturnType<typeof fetchRevenueChannelReport>>;
export const categoryPath:Record<string,string>={Web:"web",Bayi:"bayi",Cihazlar:"cihazlar","Eşleme bekleyen / Diğer":"esleme-bekleyen"};
const money=new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"});
export const currency=(value:number)=>money.format(value);
export const dateLabel=(value:string)=>value.split("-").reverse().join(".");
const companies = ["Holimer", "Fw İlaç"];
function channelSegments(entries: RevenueEntry[], category: string): string[] {
 const required = category === "Bayi" ? [...DEALER_SEGMENTS] : category === "Web" ? ["holistikmarket.com", "destekurunleri.com"] : category === "Cihazlar" ? ["Tıbbi cihaz ve ekipman", "Bakım, onarım ve kalibrasyon"] : [];
 return [...new Set([...required, ...entries.map(entry => entry.segment)])].sort((a,b) => a.localeCompare(b,"tr"));
}
export function RevenueCards({entries,allEntries,period="year",category,segment}:{entries:RevenueEntry[];allEntries:RevenueEntry[];period?:string;category?:string;segment?:string}) {
 const grandTotal=sumRevenue(allEntries,period).revenue;
 return <div className="space-y-5">
 <p className="text-sm text-[var(--muted)]">{period==="year"?"Yılbaşından rapor bitişine":`Son ${period} gün`} · Yüzdeler aynı dönemin tüm gelirlerini kapsayan şirket toplamına göredir; web, pazaryeri, bayi, cihazlar ve diğer gelirler dahildir. Sıfır net toplamda — gösterilir; iadeler nedeniyle negatif veya %100 üzerinde pay oluşabilir.</p>
 {companies.map(company=>{
  const companyTotal=sumRevenue(allEntries.filter(entry=>entry.company===company),period).revenue;
  const selected=entries.filter(entry=>entry.company===company);
  return <section key={company} className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-medium">{company==="Fw İlaç"?"FW":company}</h2><div className="text-right text-sm"><p>Net şirket cirosu: <strong>{currency(companyTotal)}</strong></p><p className="text-[var(--muted)]">İki şirket toplamındaki payı: {formatRevenueShare(companyTotal,grandTotal)}</p></div></div>
   <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{REVENUE_CATEGORIES.filter(value=>!category||value===category).map(value=>{
    const scoped=selected.filter(entry=>entry.category===value);
    const amount=sumRevenue(scoped,period).revenue;
    const segments=segment?[segment]:channelSegments(scoped,value);
    return <div key={value} className="rounded-xl border border-[var(--line)] p-3">
     <Link href={`/ciro-kanallari/${categoryPath[value]}${segment?`/${segmentSlug(segment)}`:""}?donem=${period}`} className="font-medium hover:underline">{segment||value}</Link>
     <p className="mt-2 text-lg font-medium">{currency(amount)}</p><p className="text-sm text-[var(--muted)]">Şirket toplamının {formatRevenueShare(amount,companyTotal)}</p>
     {!segment&&<ul className="mt-3 space-y-3 border-t border-[var(--line)] pt-3">{segments.map(name=>{
      const revenue=sumRevenue(scoped.filter(entry=>entry.segment===name),period).revenue;
      return <li key={name} className="text-xs"><Link href={`/ciro-kanallari/${categoryPath[value]}/${segmentSlug(name)}?donem=${period}`} className="break-words hover:underline">{name}</Link><p className="mt-1 flex flex-wrap justify-between gap-1 tabular-nums"><strong>{currency(revenue)}</strong><span>{formatRevenueShare(revenue,companyTotal)} · şirket payı</span></p></li>;
     })}</ul>}
    </div>;
   })}</div>
  </section>;
 })}
 </div>;
}
export function ReportNotes({report}:{report:ChannelReport}){
 const missing=new Set(report.entries.filter(entry=>!entry.matched).map(entry=>`${entry.company}|${entry.code}`));
 const fwDealer=report.entries.filter(entry=>entry.company==="Fw İlaç"&&entry.category==="Bayi");
 const holimerDevices=report.entries.filter(entry=>entry.company==="Holimer"&&entry.category==="Cihazlar");
 return <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-5 text-sm text-[var(--muted)]">
  <p>Kaynak: {REVENUE_ACCOUNT_SOURCE.sourceFile} · {REVENUE_ACCOUNT_SOURCE.sourceRows} cari kart · {dateLabel(report.startDate)} – {dateLabel(report.endDate)}.</p>
  <p>Son aktarım: {new Intl.DateTimeFormat("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"short",timeStyle:"short"}).format(new Date(report.lastTransfer))}. {report.stale&&"Dünün verisi henüz yok; son mevcut fatura tarihi esas alındı."}</p>
  <p>Net ciro KDV hariçtir ve iadeler düşülmüştür; satış iadeleri düşülür, iptaller ve satınalma/gider faturaları çıkarılır. Bu rapor tüm gelir kalemlerini tarar; ilk 50 ürün veya envanter filtresi kullanılmaz.</p>
  <p>Excel cari kart listesidir; parasal toplam içermez. Eşleşme şirket + cari koduyla yapılır. Aynı kodun iki şirkette bulunması iki ayrı hesap kabul edilir.</p>
  <p>Bugünkü dağılım: Holimer → holistikmarket.com ve bayi; FW → destekurunleri.com ve cihazlar. Tarihsel faturalar kesildikleri şirkette kalır; şirket değişimi tarihi dosyada yoktur.</p>
  {sumRevenue(fwDealer,"year").revenue!==0&&<p className="text-[var(--brass-strong)]">Dağılım çelişkisi: FW&apos;de yıl içinde bayi cirosu var ({currency(sumRevenue(fwDealer,"year").revenue)}).</p>}
  {sumRevenue(holimerDevices,"year").revenue!==0&&<p className="text-[var(--brass-strong)]">Dağılım çelişkisi: Holimer&apos;de yıl içinde cihaz / teknik servis cirosu var ({currency(sumRevenue(holimerDevices,"year").revenue)}).</p>}
  {sumRevenue(report.entries.filter(entry=>entry.company==="Fw İlaç"&&entry.category==="Cihazlar"),"year").revenue===0&&<p className="text-[var(--brass-strong)]">FW&apos;de bu yıl cihaz / bakım / onarım gelir kaydı bulunamadı. Bugünkü şirket dağılımıyla havuz arasındaki farkın teyidi gerekiyor.</p>}
  {!!missing.size&&<p className="text-[var(--brass-strong)]">Excel&apos;de bulunmayan {missing.size} satış hesabı var. Tutarları kaybolmaz; eşleme kontrolünde ve ilgili detaylarda işaretlenir.</p>}
  <p>Meslek kodu veya açık unvanı olmayan 120.02, 120.04 ve 120.05 hesapları “Meslek teyidi bekleyen bayi” altında ayrı tutulur; eczacı, doktor veya diyetisyen olarak tahmin edilmez. 120.14 ve tıbbi sarf kayıtları kesin eşleme olmadan bayi/cihaz cirosuna aktarılmaz.</p>
  <p>Fizyoterapist için bağımsız bir meslek kodu yoktur; açık fizyoterapi unvanları esas alınır. Gelir kaydı olmayan alt gruplar sıfır gösterilir, müşteri türü belirsiz kayıtlar eşleme bekleyen listesinde kalır.</p>
  <p>Pazaryerleri Web altında ayrı alt kalemlerdir. Holimer&apos;deki 9.DESTEK.COM hesabı destekurunleri.com (Holimer kaydı) olarak ayrı tutulur.</p>
 </div>;
}
export function RevenueSummary({report}:{report:ChannelReport}){
 const groups=REVENUE_CATEGORIES.flatMap(category=>["Holimer","Fw İlaç"].flatMap(company=>{
  const entries=report.entries.filter(entry=>entry.category===category&&entry.company===company);
  const segments=channelSegments(entries,category);
  return [{category,company,segment:"Toplam",entries,subtotal:true},...segments.map(segment=>({category,company,segment,entries:entries.filter(entry=>entry.segment===segment),subtotal:false}))];
 }));
 const periods=["year",...REVENUE_WINDOWS.map(String)];
 return <>
 <RevenueCards entries={report.entries} allEntries={report.entries}/>
 <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)]"><h2 className="p-5 text-xl font-medium">Kanal ve şirket kırılımı</h2><div className="overflow-x-auto"><table className="w-full table-fixed text-[clamp(9px,0.82vw,12px)] leading-snug"><thead className="bg-[var(--paper)] text-left"><tr><th className="w-[24%] p-2">Kanal / Alt kalem</th><th className="w-[8%] p-2">Şirket</th>{periods.map(period=><th key={period} className="p-3 text-right">{period==="year"?"Yılbaşından bugüne":`Son ${period} gün`}</th>)}</tr></thead><tbody>
 {groups.map(group=><tr key={`${group.category}|${group.company}|${group.segment}`} className={`border-t border-[var(--line)] ${group.subtotal?"bg-[var(--paper)] font-medium":""}`}><th scope="row" className="p-3 text-left"><Link href={`/ciro-kanallari/${categoryPath[group.category]}${group.subtotal?"":`/${segmentSlug(group.segment)}`}`} className="hover:underline">{group.subtotal?group.category:group.segment}</Link></th><td className="p-3">{group.company}</td>{periods.map(period=><td key={period} className="p-2 text-right tabular-nums"><span className="block">{currency(sumRevenue(group.entries,period).revenue)}</span><span className="block text-[var(--muted)]">{formatRevenueShare(sumRevenue(group.entries,period).revenue,sumRevenue(report.entries.filter(entry=>entry.company===group.company),period).revenue)} · şirket payı</span></td>)}</tr>)}
 <tr className="border-t border-[var(--line)] font-medium"><th className="p-3 text-left">Tüm gelirler · Kontrol toplamı</th><td className="p-3">İki şirket</td>{periods.map(period=><td key={period} className="p-2 text-right">{currency(sumRevenue(report.entries,period).revenue)}</td>)}</tr>
 </tbody></table></div></section>
 <details className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-5"><summary className="cursor-pointer font-medium">Aylık ciro kırılımı</summary><div className="mt-4 overflow-x-auto"><table className="w-full table-fixed text-[clamp(9px,0.82vw,12px)] leading-snug"><thead><tr><th className="p-3 text-left">Kanal / Şirket</th>{Array.from({length:Number(report.endDate.slice(5,7))},(_,i)=><th key={i} className="p-3 text-right">{new Intl.DateTimeFormat("tr-TR",{month:"short",timeZone:"UTC"}).format(new Date(`${report.endDate.slice(0,4)}-${String(i+1).padStart(2,"0")}-01T00:00:00Z`))}</th>)}</tr></thead><tbody>{groups.filter(group=>group.subtotal).map(group=><tr key={group.category+group.company} className="border-t border-[var(--line)]"><th className="p-3 text-left">{group.category} · {group.company}</th>{Array.from({length:Number(report.endDate.slice(5,7))},(_,i)=><td key={i} className="p-2 text-right"><span className="block">{currency(sumRevenue(group.entries,`${report.endDate.slice(0,4)}-${String(i+1).padStart(2,"0")}`).revenue)}</span><span className="block text-xs text-[var(--muted)]">{formatRevenueShare(sumRevenue(group.entries,`${report.endDate.slice(0,4)}-${String(i+1).padStart(2,"0")}`).revenue,sumRevenue(report.entries.filter(entry=>entry.company===group.company),`${report.endDate.slice(0,4)}-${String(i+1).padStart(2,"0")}`).revenue)} · şirket payı</span></td>)}</tr>)}</tbody></table></div></details>
 </>;
}
export function AccountDetails({entries,allEntries,period}:{entries:RevenueEntry[];allEntries:RevenueEntry[];period:string}){
 const total=sumRevenue(entries,period);
 const sorted=entries.filter(entry=>entry.periods[period]).sort((a,b)=>(b.periods[period]?.revenue??0)-(a.periods[period]?.revenue??0));
 return <><div className="rounded-xl border border-[var(--line)] p-4 text-sm">Net ciro: <b>{currency(total.revenue)}</b> · KDV: {currency(total.vat)} · KDV dahil: {currency(total.gross)}<p className="mt-2 text-[var(--muted)]">İki şirketin tüm cirosundaki payı: {formatRevenueShare(total.revenue,sumRevenue(allEntries,period).revenue)} · Satış/hizmet matrahı: {currency(total.sales)} · İade matrahı: {currency(total.returns)}</p></div><div className="overflow-x-auto rounded-xl border border-[var(--line)]"><table className="w-full table-fixed text-[clamp(9px,0.82vw,12px)] leading-snug"><thead className="bg-[var(--paper)] text-left"><tr>{["Şirket","Cari / Excel satırı","Müşteri","Alt kalem / Eşleme gerekçesi","Net ciro","Şirket toplamındaki pay","KDV","KDV dahil"].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{sorted.map(entry=>{const amount=entry.periods[period]??emptyRevenue();return <tr key={[entry.company,entry.code,entry.segment,entry.basis].join("|")} className="border-t border-[var(--line)]"><td className="p-3">{entry.company}</td><td className="p-3">{entry.code}<span className="block text-xs text-[var(--muted)]">{entry.matched?`Excel satırı ${entry.sourceRow}`:"Excel'de bulunamadı"}</span></td><th scope="row" className="p-3 text-left font-normal">{entry.name}</th><td className="p-3">{entry.segment}<span className="block text-xs text-[var(--muted)]">{entry.basis}</span></td><td className="p-2 text-right tabular-nums">{currency(amount.revenue)}</td><td className="p-2 text-right tabular-nums">{formatRevenueShare(amount.revenue,sumRevenue(allEntries.filter(item=>item.company===entry.company),period).revenue)}</td>{[amount.vat,amount.gross].map((value,i)=><td key={i} className="p-2 text-right tabular-nums">{currency(value)}</td>)}</tr>;})}{!sorted.length&&<tr><td colSpan={8} className="p-6">Bu dönemde satış kaydı yok.</td></tr>}</tbody></table></div></>;
}
