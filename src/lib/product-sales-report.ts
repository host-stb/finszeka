import { unstable_cache } from "next/cache";
import { fetchLogoDurum, fetchSatislar } from "./logo-api";
import { aggregateProductSales, combineCompanySales, mergeProductSales, shiftDate } from "./product-sales";

/** Existing read-only mirror connection; no additional Logo endpoint is required. */
async function readCompany(base: string, company: string, endDate: string, yearEndDate: string) {
  const parts: ReturnType<typeof aggregateProductSales>[] = [];
  const start = shiftDate(endDate,-43) < `${yearEndDate.slice(0,4)}-01-01` ? shiftDate(endDate,-43) : `${yearEndDate.slice(0,4)}-01-01`;
  const limit = 1000;
  for (let offset = 0, pages = 0; pages < 600; pages++) {
    const page = await fetchSatislar(base, {
      sirket: company, baslangic: start, bitis: yearEndDate, limit, offset,
    });
    if (page.adet !== page.satirlar.length) throw new Error("Satış sayfası eksik geldi.");
    if (page.satirlar.length < limit) {
      parts.push(aggregateProductSales(page.satirlar, company, endDate, undefined, null, yearEndDate));
      return mergeProductSales(parts, company);
    }
    // Existing service sorts by date + invoice, but not by unique line ID.
    // Never keep a partial invoice at a page boundary: refetch its whole group.
    const last = page.satirlar[page.satirlar.length - 1];
    let complete = page.satirlar.length;
    while (complete > 0) {
      const row = page.satirlar[complete - 1];
      if (row.tarihi !== last.tarihi || row.fatura_numarasi !== last.fatura_numarasi) break;
      complete--;
    }
    if (complete === 0) throw new Error("Tek fatura sayfa sınırını aşıyor; eksik rapor gösterilmiyor.");
    parts.push(aggregateProductSales(page.satirlar.slice(0,complete), company, endDate, undefined, null, yearEndDate));
    offset += complete;
  }
  throw new Error("Satış verisi sınırı aşıldı; eksik rapor gösterilmiyor.");
}

// Cache only completed reports; avoid pulling the full year of invoice lines on every page load.
const readCompanies = unstable_cache(
  async (base: string, endDate: string, yearEndDate: string, transfer: string) => {
    void transfer; // Transfer time participates in the cache key.
    return Promise.all(["Holimer", "Fw İlaç"].map(company => readCompany(base, company, endDate, yearEndDate)));
  },
  ["product-sales-own-websites-2026-10-04-v7"], { revalidate: 3600 },
);

export async function fetchProductSalesReport() {
  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Satış verisi bağlantısı tanımlı değil.");
  const status = await fetchLogoDurum(base);
  if (!status.veri_var || !status.en_yeni_fatura) throw new Error("Satış havuzunda veri bulunamadı.");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const yesterday = shiftDate(today, -1);
  const latest = status.en_yeni_fatura.slice(0, 10);
  const endDate = latest < yesterday ? latest : yesterday;
  const yearEndDate = latest < today ? latest : today;
  const yearStartDate = `${yearEndDate.slice(0,4)}-01-01`;
  const startDate = shiftDate(endDate, -43);
  if (status.en_eski_fatura.slice(0, 10) > (startDate < yearStartDate ? startDate : yearStartDate)) throw new Error("Havuzda yılbaşından itibaren ve 44 günlük dönemi kapsayan geçmiş bulunmuyor.");
  const missing = ["Holimer", "Fw İlaç"].filter(company => !status.sirketler.some(item => item.sirket === company));
  if (missing.length) throw new Error(`Şirket verisi bulunamadı: ${missing.join(", ")}`);
  const allCompanies = await readCompanies(base, endDate, yearEndDate, status.son_aktarim);
  return {
    endDate, startDate, yearEndDate, yearStartDate, lastTransfer: status.son_aktarim,
    stale: latest < yesterday,
    products: combineCompanySales(allCompanies),
    companies: allCompanies.map(company => ({ ...company, products: company.products.filter(product => product.periods[44].revenue > 0).slice(0,50) })),
  };
}
