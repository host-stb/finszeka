import Link from "next/link";
import { Suspense } from "react";
import { fetchRevenueChannelReport } from "@/lib/revenue-channel-report";
import { ReportNotes, RevenueSummary } from "./report-view";
export const dynamic="force-dynamic";
export const maxDuration=300;
async function Report(){
 let report;try{report=await fetchRevenueChannelReport();}catch{return <p role="alert" className="rounded-xl border border-[var(--line)] p-6">Ciro raporu tamamlanamadı. Havuz bağlantısını ve yılbaşından itibaren veri kapsamını kontrol edin. <Link href="/ciro-kanallari" className="underline">Yeniden dene</Link></p>;}
 return <><ReportNotes report={report}/><RevenueSummary report={report}/></>;
}
export default function RevenueChannelsPage(){return <main className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6"><header><Link href="/" className="text-sm text-[var(--muted)] hover:underline">← Ana sayfaya dön</Link><h1 className="mt-3 text-3xl font-medium">Ciro Kanalları</h1><p className="mt-2 text-sm text-[var(--muted)]">Excel hesap listesine göre Web, Bayi ve Cihazlar.</p></header><Suspense fallback={<p role="status">Yılın tüm faturaları kontrol ediliyor; ilk yükleme biraz sürebilir…</p>}><Report/></Suspense></main>;}
