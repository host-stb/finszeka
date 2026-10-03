import Link from "next/link";
import SalesTabs from "../sales-tabs";
import { Suspense } from "react";
import { fetchProductSalesReport } from "@/lib/product-sales-report";
import { SALES_PERIODS, shiftDate, companySalesLabel } from "@/lib/product-sales";
import { groupProductsByBrand, EVALUATED_PRODUCTS } from "@/lib/product-inventory";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const date = (value: string) => value.split("-").reverse().join(".");

async function SalesTables() {
  let report;
  try {
    report = await fetchProductSalesReport();
  } catch {
    return <div role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-6">
      <p>Ürün satışları alınamadı. Havuz bağlantısını ve 44 günlük veri kapsamını kontrol edip yeniden deneyin.</p>
      <Link href="/urun-satislari/sirkete-gore" className="mt-3 inline-block underline">Yeniden dene</Link>
    </div>;
  }
  return <>
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 text-sm text-[var(--muted)]">
      <p>Yılbaşından bugüne sütunu: {date(report.yearStartDate)} – {date(report.yearEndDate)}; son aktarımda mevcut güncel tarihe kadar hesaplanır.</p>
      <p>Rapor bitişi: <b className="text-[var(--ink)]">{date(report.endDate)}</b> · Son tamamlanmış gün esas alınır.</p>
      <p>Son veri aktarımı: {new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" }).format(new Date(report.lastTransfer))}</p>
      {report.stale && <p className="mt-2 text-[var(--brass-strong)]">Havuzda dünün faturaları henüz yok. Dönemler son mevcut fatura tarihine göre hesaplandı.</p>}
      <p className="mt-2">Her şirket için son 44 günlük net ciroya göre ilk 50 ürün. Ciro KDV hariçtir; iptaller hariç, satış iadeleri düşülmüştür. Değerlendirmeye alınan {EVALUATED_PRODUCTS.length} fiziki ürünün ADET birimli satışları gösterilir. İlk 50 seçildikten sonra More Than, Smart Caps, Raw Material ve Diğer Ürünler tablolarına ayrılır. Diğer Ürünler grubundan yalnızca Tuzy Tuz 250 g, Tuzy Tuz 500 g ve ZEOPAK değerlendirilir; diğer kalemler hesaplara ve ilk 50 seçimine dahil edilmez.</p>
      <Link href="/envanter" className="mt-2 inline-block text-[var(--ink)] underline">Ürün envanteri ve Logo eşleşmeleri</Link>
    </div>
    {report.companies.map(company => <section key={company.company} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
        <h2 className="text-xl font-medium">{companySalesLabel(company.company)}</h2>
        <span className="text-sm text-[var(--muted)]">{company.products.length} ürün · 44 günlük ciro sırası</span>
      </div>
      {groupProductsByBrand(company.products).map(group => <div key={group.key}>
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><h3 className="text-lg font-medium">{group.label}</h3><span className="text-sm text-[var(--muted)]">{group.products.length} ürün</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1450px] text-sm">
          <caption className="sr-only">{company.company} · {group.label} ürünlerinin 4, 14, 30, 44 günlük ve yılbaşından bugüne net satışları</caption>
          <thead className="bg-[var(--paper)] text-[var(--muted)]">
            <tr>
              <th rowSpan={2} scope="col" className="px-3 py-4 text-left">Sıra</th>
              <th rowSpan={2} scope="col" className="min-w-[280px] px-3 py-4 text-left">Ürün</th>
              {SALES_PERIODS.map(days => <th key={days} scope="colgroup" colSpan={2} className="border-l border-[var(--line)] px-3 py-3 text-center">
                {days === "year" ? "Yılbaşından bugüne" : `Son ${days} gün`}<span className="mt-1 block text-xs font-normal">{date(days === "year" ? report.yearStartDate : shiftDate(report.endDate,1-days))} – {date(days === "year" ? report.yearEndDate : report.endDate)}</span>
              </th>)}
            </tr>
            <tr>{SALES_PERIODS.map(days => <ReactColumns key={days} />)}</tr>
          </thead>
          <tbody>
            {group.products.map((product, index) => <tr key={product.code} className="border-t border-[var(--line)] hover:bg-[var(--paper)]">
              <td className="px-3 py-3 text-[var(--muted)]">{index+1}</td>
              <th scope="row" className="px-3 py-3 text-left font-medium">{product.name}<span className="block text-xs font-normal text-[var(--muted)]">{product.code}</span></th>
              {SALES_PERIODS.map(days => <SalesCells key={days} quantity={product.periods[days].quantity} revenue={product.periods[days].revenue} />)}
            </tr>)}
            {group.products.length === 0 && <tr><td colSpan={12} className="p-6">Şirketin ilk 50 ürünü arasında bu gruba ait ürün bulunmuyor.</td></tr>}
          </tbody>
        </table>
      </div>
      </div>)}
    </section>)}
  </>;
}
function ReactColumns() {
  return <><th scope="col" className="border-l border-[var(--line)] px-3 pb-3 text-right">Adet</th><th scope="col" className="px-3 pb-3 text-right">Net ciro</th></>;
}
function SalesCells({ quantity, revenue }: { quantity: number; revenue: number }) {
  return <><td className="border-l border-[var(--line)] px-3 py-3 text-right tabular-nums">{number.format(quantity)}</td><td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{money.format(revenue)}</td></>;
}
export default function ProductSalesPage() {
  return <div className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6">
    <header>
      <Link href="/" className="text-sm text-[var(--muted)] hover:underline">← Ana sayfaya dön</Link>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--brass)]">Holimer · Fw İlaç</p>
      <h1 className="mt-1 text-3xl font-medium">Ürün Satışları</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Her şirketin en çok ciro getiren 50 ürününü dört dönemde karşılaştırın.</p>
    </header>
    <SalesTabs companyView />
    <Suspense fallback={<p role="status">Ürün satışları hazırlanıyor…</p>}><SalesTables /></Suspense>
  </div>;
}
