import Link from "next/link";
export default function SalesTabs({ companyView = false }: { companyView?: boolean }) {
  return <nav aria-label="Ürün satışları görünümleri" className="flex gap-2 border-b border-[var(--line)] pb-3">
    {[{href:"/urun-satislari",label:"Holistik Market · İlk 50",active:!companyView},{href:"/urun-satislari/sirkete-gore",label:"Şirkete göre",active:companyView}].map(tab =>
      <Link key={tab.href} href={tab.href} aria-current={tab.active ? "page" : undefined} className={`rounded-lg px-4 py-3 text-sm ${tab.active ? "bg-[var(--ink)] text-[var(--paper)]" : "border border-[var(--line)] hover:underline"}`}>{tab.label}</Link>)}
  </nav>;
}
