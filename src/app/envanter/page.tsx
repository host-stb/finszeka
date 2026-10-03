import Link from "next/link";
import { PHYSICAL_PRODUCTS, PRODUCT_INVENTORY } from "@/lib/product-inventory";

export default function InventoryPage() {
  const excluded = PRODUCT_INVENTORY.products.filter(product => !product.included);
  return <main className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6">
    <header>
      <Link href="/" className="text-sm text-[var(--muted)] hover:underline">← Ana sayfaya dön</Link>
      <h1 className="mt-3 text-3xl font-medium">Ürün Envanteri</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Satış sıralamasında kullanılan {PHYSICAL_PRODUCTS.length} fiziki ürünün referans listesi.</p>
      <Link href="/urun-satislari" className="mt-3 inline-block underline">Ürün Satışları raporunu aç</Link>
    </header>
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-5 text-sm text-[var(--muted)]">
      <p>Kaynak: {PRODUCT_INVENTORY.sourceFile} · Eklenme: 03.10.2026 · Logo havuzunda kontrol edilen son fatura: 02.10.2026.</p>
      <p className="mt-2">93 kaynak satırından 6 kongre / eğitim ve 7 kitap çıkarıldı. Aynı Lugol %2 koduna bağlı iki kayıt tek üründe birleştirildi. {PHYSICAL_PRODUCTS.length} ürünün tamamı Logo havuzunda koduyla eşleşti.</p>
      <p className="mt-2">Holimer geçmişinde 79, FW geçmişinde 70 ürün kodu görüldü. “Kayıt yok” o şirkette fatura geçmişi bulunmadığını belirtir; stok kartının bulunmadığı anlamına gelmez. Bu liste depodaki stok miktarını göstermez.</p>
    </div>
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)]">
      <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm">
        <caption className="sr-only">Fiziki ürün referans envanteri ve Logo eşleşmeleri</caption>
        <thead className="bg-[var(--paper)] text-left text-[var(--muted)]"><tr>
          {["Ürün kodu", "Ürün adı", "Logo açıklaması", "Holimer", "FW İlaç"].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
        </tr></thead>
        <tbody>{PHYSICAL_PRODUCTS.map(product => <tr key={product.code} className="border-t border-[var(--line)]">
          <td className="whitespace-nowrap px-4 py-3">{product.code}</td>
          <th scope="row" className="px-4 py-3 text-left font-medium">{product.name}{product.sourceIds.length > 1 && <span className="block text-xs font-normal text-[var(--muted)]">Tek kodda birleştirildi: {product.sourceIds.join(", ")}</span>}</th>
          <td className="px-4 py-3 text-xs text-[var(--muted)]">{product.logoNames.join(" / ")}</td>
          {["Holimer", "Fw İlaç"].map(company => <td key={company} className="whitespace-nowrap px-4 py-3">{product.observedCompanies.includes(company) ? "Kod eşleşti" : "Kayıt yok"}</td>)}
        </tr>)}</tbody>
      </table></div>
    </section>
    <details className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-5 text-sm">
      <summary className="cursor-pointer font-medium">Hesap dışında tutulan {excluded.length} kayıt</summary>
      <p className="mt-3 text-[var(--muted)]">600.02.017 ve 600.02.018 kodlarında kaynak adı ile Logo&apos;daki bazı açıklamalar farklıdır. Bu kalemlerin tamamı ürün satışlarından çıkarıldı.</p>
      <ul className="mt-3 space-y-3">{excluded.map(product => <li key={product.code}>
        <b>{product.code}</b> · {product.name}<span className="block text-xs text-[var(--muted)]">{product.excludedReason} · Logo: {product.logoNames.join(" / ") || "Havuzda kayıt yok"}</span>
      </li>)}</ul>
    </details>
  </main>;
}
