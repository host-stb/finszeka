import { unstable_cache } from "next/cache";
import { fetchLogoDurum, fetchSatislar, type LogoSatisSatiri } from "./logo-api";
import { aggregateProductSales, shiftDate } from "./product-sales";

/** Existing read-only mirror connection; no additional Logo endpoint is required. */
async function readCompany(base: string, company: string, endDate: string) {
  const rows: LogoSatisSatiri[] = [];
  const limit = 1000;
  for (let offset = 0; offset < 200000; offset += limit) {
    const page = await fetchSatislar(base, {
      sirket: company, baslangic: shiftDate(endDate, -43), bitis: endDate, limit, offset,
    });
    if (page.adet !== page.satirlar.length) throw new Error("Satış sayfası eksik geldi.");
    rows.push(...page.satirlar);
    if (page.satirlar.length < limit) return aggregateProductSales(rows, company, endDate);
  }
  throw new Error("Satış verisi sınırı aşıldı; eksik rapor gösterilmiyor.");
}

// Cache only completed reports; avoid pulling 44 days of invoice lines on every page load.
const readCompanies = unstable_cache(
  async (base: string, endDate: string, transfer: string) => {
    void transfer; // Transfer time participates in the cache key.
    return Promise.all(["Holimer", "Fw İlaç"].map(company => readCompany(base, company, endDate)));
  },
  ["product-sales-44-days-v1"], { revalidate: 3600 },
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
  const startDate = shiftDate(endDate, -43);
  if (status.en_eski_fatura.slice(0, 10) > startDate) throw new Error("Havuzda 44 günlük geçmiş henüz bulunmuyor.");
  const missing = ["Holimer", "Fw İlaç"].filter(company => !status.sirketler.some(item => item.sirket === company));
  if (missing.length) throw new Error(`Şirket verisi bulunamadı: ${missing.join(", ")}`);
  return {
    endDate, startDate, lastTransfer: status.son_aktarim,
    stale: latest < yesterday,
    companies: await readCompanies(base, endDate, status.son_aktarim),
  };
}
