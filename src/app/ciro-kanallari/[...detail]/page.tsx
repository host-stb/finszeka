import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchRevenueChannelReport } from "@/lib/revenue-channel-report";
import { DEALER_SEGMENTS, REVENUE_WINDOWS, segmentSlug } from "@/lib/revenue-channels";
import { AccountDetails, RevenueCards, categoryPath, ReportNotes } from "../report-view";
export const dynamic="force-dynamic";
export const maxDuration=300;
export default async function DetailPage({params,searchParams}:{params:Promise<{detail:string[]}>;searchParams:Promise<{donem?:string}>}){
 const {detail}=await params,{donem}=await searchParams;
 const category=Object.keys(categoryPath).find(key=>categoryPath[key]===detail[0]);if(!category||detail.length>2)notFound();
 let report;try{report=await fetchRevenueChannelReport();}catch{return <main className="p-8"><Link href="/ciro-kanallari" className="underline">← Ciro Kanalları</Link><p role="alert" className="mt-4">Ciro verileri alınamadı. Yeniden deneyin.</p></main>;}
 let entries=report.entries.filter(entry=>entry.category===category);
 const segments=[...new Set([...entries.map(entry=>entry.segment),...(category==="Bayi"?DEALER_SEGMENTS:category==="Web"?["holistikmarket.com","destekurunleri.com"]:category==="Cihazlar"?["Tıbbi cihaz ve ekipman","Bakım, onarım ve kalibrasyon"]:[])])].sort((a,b)=>a.localeCompare(b,"tr"));
 const segment=detail[1]?segments.find(value=>segmentSlug(value)===detail[1]):undefined;
 if(detail[1]&&!segment)notFound();if(segment)entries=entries.filter(entry=>entry.segment===segment);
 const allowed=["year",...REVENUE_WINDOWS.map(String)];const period=donem&&allowed.includes(donem)?donem:"year";
 const base=`/ciro-kanallari/${detail.join("/")}`;
 return <main className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6"><header><Link href="/ciro-kanallari" className="text-sm text-[var(--muted)] hover:underline">← Ciro Kanalları</Link><h1 className="mt-3 text-3xl font-medium">{category}{segment?` · ${segment}`:""}</h1></header>
 <nav className="flex flex-wrap gap-2" aria-label="Ciro dönemi">{allowed.map(value=><Link key={value} href={`${base}?donem=${value}`} aria-current={period===value?"page":undefined} className={`rounded-lg border border-[var(--line)] px-4 py-2 text-sm ${period===value?"bg-[var(--ink)] text-[var(--paper)]":""}`}>{value==="year"?"Yılbaşından bugüne":`Son ${value} gün`}</Link>)}</nav>
 {!segment&&<nav className="flex flex-wrap gap-3" aria-label="Alt kalemler">{segments.map(value=><Link key={value} className="text-sm underline" href={`/ciro-kanallari/${detail[0]}/${segmentSlug(value)}?donem=${period}`}>{value}</Link>)}</nav>}
 <RevenueCards entries={entries} allEntries={report.entries} period={period} category={category} segment={segment}/><AccountDetails entries={entries} allEntries={report.entries} period={period}/><ReportNotes report={report}/></main>;
}
