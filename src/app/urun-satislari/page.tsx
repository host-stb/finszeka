import { formatRevenueShare } from "@/lib/sales-shares";
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
function Cells({product,total}:{product:ProductSales;total:ProductSales}) {
  return SALES_PERIODS.map(days => <td key={days} className="border-l border-[var(--line)] px-1.5 py-2 text-right tabular-nums"><span className="block">{number.format(product.periods[days].quantity)} adet</span><span className="block font-medium">{money.format(product.periods[days].revenue)}</span><span className="block text-[var(--muted)]">Pay {formatRevenueShare(product.periods[days].revenue,total.periods[days].revenue)}</span></td>);
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
      <p className="mt-2">Yalnızca holistikmarket.com (Holimer) ve destekurunleri.com (FW) web sitesi satışları ürün koduyla birleştirilir; son 44 günlük toplam net ciroya göre ilk 50 seçilir. Ciro KDV hariçtir; iptaller hariç, iadeler düşülmüştür. More Than, Smart Caps, Raw Material ve yalnızca Tuzy Tuz / ZEOPAK değerlendirilir.</p>
      <p className="mt-2">Pazaryeri, bayi, cihaz ve bayi/site bilgisi çelişen kartların satışları bu rapora ve ilk 50 seçimine dahil edilmez. Web satışı, sitenin torba cari kodu veya Excel’de açıkça site adresi belirtilen müşteri kartıyla eşleştirilir.</p>
      <p className="mt-2">Her dönem sütununda sırasıyla adet, net ciro (TL) ve pay gösterilir. Pay, ilgili dönemde sitenin bu üründen elde ettiği net cironun iki site toplamındaki yüzdesidir. Net toplam sıfırsa yüzde yerine — gösterilir; iadeler nedeniyle pay negatif veya %100 üzerinde olabilir.</p>
      <Link href="/ciro-kanallari" className="mt-2 mr-4 inline-block underline">Tüm gelirler ve ciro kanalları</Link>
      <Link href="/envanter" className="mt-2 inline-block underline">Ürün envanteri</Link>
    </div>
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)]">
      <h2 className="border-b border-[var(--line)] p-5 text-xl font-medium">Holistik vs FW · İlk {report.products.length} ürün</h2>
      <div className="overflow-x-auto"><table className="w-full table-fixed text-[clamp(9px,0.82vw,12px)] leading-snug">
        <caption className="sr-only">İki şirketin toplam cirosuna göre ilk 50 ürün ve şirket bazında satışları</caption><colgroup><col style={{width:"3%"}} /><col style={{width:"22%"}} /><col style={{width:"10%"}} />{SALES_PERIODS.map(period => <col key={period} style={{width:"13%"}} />)}</colgroup>
        <thead className="bg-[var(--paper)] text-[var(--muted)]"><tr>
          <th scope="col" className="px-1.5 py-2 text-left">Sıra</th><th scope="col" className="px-1.5 py-2 text-left">Ürün / Marka</th><th scope="col" className="px-1.5 py-2 text-left">Satış / Şirket</th>
          {SALES_PERIODS.map(days => <th key={days} scope="col" className="border-l border-[var(--line)] px-1.5 py-2">{days === "year" ? "Yılbaşından bugüne" : `Son ${days} gün`}<span className="block text-[0.9em] font-normal break-words">{date(days === "year" ? report.yearStartDate : shiftDate(report.endDate,1-days))} – {date(days === "year" ? report.yearEndDate : report.endDate)}</span></th>)}
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
    <tr className="border-t border-[var(--line)] bg-[var(--paper)] font-medium"><td className="px-1.5 py-2">{rank}</td><th scope="row" className="px-1.5 py-2 text-left break-words">{product.name}<span className="block text-[0.9em] font-normal text-[var(--muted)]">{product.code} · {PRODUCT_BRANDS.find(brand => brand.key===productBrand(product.code))?.label}</span></th><td className="px-1.5 py-2">Toplam</td><Cells product={product} total={product} /></tr>
    {["Holimer","Fw İlaç"].map(company => {
      const sales=product.companies.find(item=>item.company===company)?.products[0] ?? {code:product.code,name:product.name,periods:Object.fromEntries(SALES_PERIODS.map(days=>[days,{quantity:0,revenue:0}])) as ProductSales["periods"]};
      return <tr key={company} className="border-t border-[var(--line)] text-[var(--muted)]"><td /><td /><th scope="row" className="px-1.5 py-2 text-left font-normal"><span title={companySalesLabel(company)}>{company === "Holimer" ? "Holistik" : "Destek (FW)"}</span></th><Cells product={sales} total={product} /></tr>;
    })}
  </>;
}
export default function ProductSalesPage() {
 return <main className="mx-auto flex w-full max-w-none min-w-0 flex-col gap-4 px-2 py-6 sm:px-3"><header><Link href="/" className="text-sm text-[var(--muted)] hover:underline">← Ana sayfaya dön</Link><h1 className="mt-3 text-3xl font-medium">Web Ürün Satışları</h1><p className="mt-2 text-sm text-[var(--muted)]">İki web sitesinin toplam net cirosuna göre ilk 50 ürün.</p></header><SalesTabs /><Suspense fallback={<p role="status">Ürün satışları hazırlanıyor…</p>}><CombinedTable /></Suspense></main>;
}
