import Link from "next/link";
import { Suspense } from "react";
import SalesTabs from "./sales-tabs";
import { fetchProductSalesReport } from "@/lib/product-sales-report";
import { SALES_PERIODS, shiftDate, companySalesLabel, type ProductSales } from "@/lib/product-sales";
import { productBrand, PRODUCT_BRANDS } from "@/lib/product-inventory";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const money = new Intl.NumberFormat("tr-TR", {style:"currency",currency:"TRY"});
const number = new Intl.NumberFormat("tr-TR", {maximumFractionDigits:2});
const date = (value:string) => value.split("-").reverse().join(".");
function Cells({product}:{product:ProductSales}) {
  return SALES_PERIODS.map(days => <td key={days} className="border-l border-[var(--line)] px-3 py-3 text-right tabular-nums"><span className="block">{number.format(product.periods[days].quantity)} adet</span><span className="block whitespace-nowrap">{money.format(product.periods[days].revenue)}</span></td>);
}
async function CombinedTable() {
  let report;
  try { report = await fetchProductSalesReport(); } catch {
    return <p role="alert" className="rounded-xl border border-[var(--line)] p-6">Ürün satışları alınamadı. <Link href="/urun-satislari" className="underline">Yeniden dene</Link></p>;
  }
  return <>
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 text-sm text-[var(--muted)]">
      <p>Yılbaşından bugüne sütunu: {date(report.yearStartDate)} – {date(report.yearEndDate)}; son aktarımda mevcut güncel tarihe kadar hesaplanır.</p>
      <p>Rapor bitişi: <b className="text-[var(--ink)]">{date(report.endDate)}</b> · Son tamamlanmış gün.</p>
      <p>Son veri aktarımı: {new Intl.DateTimeFormat("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"short",timeStyle:"short"}).format(new Date(report.lastTransfer))}</p>
      {report.stale && <p className="mt-2">Dünün faturaları havuzda henüz yok; son mevcut fatura tarihi esas alındı.</p>}
      <p className="mt-2">Holimer ve FW satışları ürün koduyla birleştirilir; son 44 günlük toplam net ciroya göre ilk 50 seçilir. Ciro KDV hariçtir; iptaller hariç, iadeler düşülmüştür. More Than, Smart Caps, Raw Material ve yalnızca Tuzy Tuz / ZEOPAK değerlendirilir.</p>
      <p className="mt-2">Şirket satışları holistikmarket.com (Holimer) ve destekurunleri.com (FW) adıyla gösterilir.</p>
      <Link href="/envanter" className="mt-2 inline-block underline">Ürün envanteri</Link>
    </div>
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)]">
      <h2 className="border-b border-[var(--line)] p-5 text-xl font-medium">Holistik Market · İlk {report.products.length} ürün</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[1450px] text-sm">
        <caption className="sr-only">İki şirketin toplam cirosuna göre ilk 50 ürün ve şirket bazında satışları</caption>
        <thead className="bg-[var(--paper)] text-[var(--muted)]"><tr>
          <th scope="col" className="px-3 py-4 text-left">Sıra</th><th scope="col" className="min-w-[260px] px-3 py-4 text-left">Ürün / Marka</th><th scope="col" className="min-w-[240px] px-3 py-4 text-left">Satış / Şirket</th>
          {SALES_PERIODS.map(days => <th key={days} scope="col" className="border-l border-[var(--line)] px-3 py-4">{days === "year" ? "Yılbaşından bugüne" : `Son ${days} gün`}<span className="block text-xs font-normal">{date(days === "year" ? report.yearStartDate : shiftDate(report.endDate,1-days))} – {date(days === "year" ? report.yearEndDate : report.endDate)}</span><span className="block text-xs font-normal">Adet / Net ciro</span></th>)}
        </tr></thead>
        <tbody>{report.products.map((product,index) => <Rows key={product.code} product={product} rank={index+1} />)}
          {!report.products.length && <tr><td colSpan={8} className="p-6">Bu dönemde uygun ürün satışı bulunamadı.</td></tr>}
        </tbody>
      </table></div>
    </section>
  </>;
}
function Rows({product,rank}:{product:Awaited<ReturnType<typeof fetchProductSalesReport>>["products"][number];rank:number}) {
  return <>
    <tr className="border-t border-[var(--line)] bg-[var(--paper)] font-medium"><td className="px-3 py-3">{rank}</td><th scope="row" className="px-3 py-3 text-left">{product.name}<span className="block text-xs font-normal text-[var(--muted)]">{product.code} · {PRODUCT_BRANDS.find(brand => brand.key===productBrand(product.code))?.label}</span></th><td className="px-3 py-3">Toplam</td><Cells product={product} /></tr>
    {["Holimer","Fw İlaç"].map(company => {
      const sales=product.companies.find(item=>item.company===company)?.products[0] ?? {code:product.code,name:product.name,periods:Object.fromEntries(SALES_PERIODS.map(days=>[days,{quantity:0,revenue:0}])) as ProductSales["periods"]};
      return <tr key={company} className="border-t border-[var(--line)] text-[var(--muted)]"><td /><td /><th scope="row" className="px-3 py-2 text-left font-normal">{companySalesLabel(company)}</th><Cells product={sales} /></tr>;
    })}
  </>;
}
export default function ProductSalesPage() {
 return <main className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6"><header><Link href="/" className="text-sm text-[var(--muted)] hover:underline">← Ana sayfaya dön</Link><h1 className="mt-3 text-3xl font-medium">Ürün Satışları</h1><p className="mt-2 text-sm text-[var(--muted)]">Holistik Market’in iki şirkette toplam en çok ciro getiren 50 ürünü.</p></header><SalesTabs /><Suspense fallback={<p role="status">Ürün satışları hazırlanıyor…</p>}><CombinedTable /></Suspense></main>;
}
