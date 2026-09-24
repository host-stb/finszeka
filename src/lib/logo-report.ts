import { fetchLogoDurum, fetchSatislarOzet } from "./logo-api";
import { classifyCari } from "./logo-category";
import { CompanyReport, CompanySummary, Month, MONTHS, ReportRow } from "./types";

const MONTH_INDEX: Record<Month, number> = {
  Ocak: 0,
  Şubat: 1,
  Mart: 2,
  Nisan: 3,
  Mayıs: 4,
  Haziran: 5,
  Temmuz: 6,
  Ağustos: 7,
  Eylül: 8,
  Ekim: 9,
  Kasım: 10,
  Aralık: 11,
};

const CATEGORY_ORDER = ["Pazaryeri", "E-Ticaret", "Cari Satış", "Grup Firmalar"];

function monthRange(year: number, monthIdx: number) {
  const start = new Date(Date.UTC(year, monthIdx, 1));
  const end = new Date(Date.UTC(year, monthIdx + 1, 0));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { baslangic: fmt(start), bitis: fmt(end) };
}

/** /logo/durum'daki şirket listesini firma sekmelerine dönüştürür. */
export async function fetchCompaniesFromLogo(base: string): Promise<CompanySummary[]> {
  const durum = await fetchLogoDurum(base);
  return durum.sirketler.map((s) => ({ id: s.sirket, name: s.sirket }));
}

/**
 * Bir şirket için 12 aylık /logo/satislar/ozet verisini paralel çeker,
 * ay bazlı gerçek toplamı (genel.toplam_tutar) ve en çok satış yapılan
 * carilerden türetilmiş bir kategori kırılımını CompanyReport'a dönüştürür.
 *
 * Not: Kategori kırılımı "en iyi çaba" niteliğindedir — her ay için sadece
 * ilk N (varsayılan 40) cari alınır; kalan tutar "Diğer (sınıflandırılmamış)"
 * kalemine yazılır ki kategori toplamları her zaman gerçek aylık toplamla
 * birebir tutsun. Toplam satırı (GİRDİLER TOPLAM) her zaman %100 gerçektir.
 */
export async function fetchCompanyReportFromLogo(
  base: string,
  sirket: string
): Promise<CompanyReport> {
  const year = new Date().getFullYear();

  const ozetResults = await Promise.all(
    MONTHS.map((m) =>
      fetchSatislarOzet(base, { ...monthRange(year, MONTH_INDEX[m]), sirket, ilkN: 40 }).catch(
        () => null
      )
    )
  );

  const categoryMap = new Map<string, Map<string, Partial<Record<Month, number>>>>();
  const totalPerMonth: Partial<Record<Month, number>> = {};
  const iadePerMonth: Partial<Record<Month, number>> = {};
  const netPerMonth: Partial<Record<Month, number>> = {};

  MONTHS.forEach((m, i) => {
    const ozet = ozetResults[i];
    if (!ozet || !ozet.genel || ozet.genel.fatura_adedi === 0) return; // bu ay için veri yok

    totalPerMonth[m] = ozet.genel.toplam_tutar;

    // toplam_tutar iadeleri içermez; iade_tutar gelirse brütten düşülür.
    // İşareti ne olursa olsun (Logo'da iade satırları eksi) eksi olarak gösterilir.
    if (typeof ozet.genel.iade_tutar === "number") {
      const iade = -Math.abs(ozet.genel.iade_tutar);
      iadePerMonth[m] = iade;
      netPerMonth[m] = ozet.genel.toplam_tutar + iade;
    }

    let classifiedSum = 0;
    for (const cari of ozet.en_cok_alan_cariler) {
      const category = classifyCari(cari.cari_hesap_unvani);
      classifiedSum += cari.toplam_tutar;

      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const items = categoryMap.get(category)!;
      if (!items.has(cari.cari_hesap_unvani)) items.set(cari.cari_hesap_unvani, {});
      const itemValues = items.get(cari.cari_hesap_unvani)!;
      itemValues[m] = (itemValues[m] ?? 0) + cari.toplam_tutar;
    }

    const residual = ozet.genel.toplam_tutar - classifiedSum;
    if (residual > 1) {
      const category = "Cari Satış";
      const label = "Diğer (sınıflandırılmamış cariler)";
      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const items = categoryMap.get(category)!;
      if (!items.has(label)) items.set(label, {});
      const itemValues = items.get(label)!;
      itemValues[m] = (itemValues[m] ?? 0) + residual;
    }
  });

  const rows: ReportRow[] = [];
  for (const categoryName of CATEGORY_ORDER) {
    const items = categoryMap.get(categoryName);
    if (!items) continue;

    const categoryValues: Partial<Record<Month, number>> = {};
    const itemRows: ReportRow[] = [];
    let idx = 0;
    for (const [label, values] of items) {
      itemRows.push({ id: `${categoryName}-${idx++}`, label, kind: "item", values });
      for (const m of MONTHS) {
        const v = values[m];
        if (v != null) categoryValues[m] = (categoryValues[m] ?? 0) + v;
      }
    }

    rows.push({
      id: `cat-${categoryName}`,
      label: categoryName.toLocaleUpperCase("tr"),
      kind: "category",
      values: categoryValues,
    });
    rows.push(...itemRows);
  }

  rows.push({ id: "total", label: "GİRDİLER TOPLAM", kind: "total", values: totalPerMonth });

  const netRows: ReportRow[] | undefined =
    Object.keys(iadePerMonth).length > 0
      ? [
          { id: "iade", label: "İADELER", kind: "item", values: iadePerMonth },
          { id: "net", label: "NET GELİR", kind: "total", values: netPerMonth },
        ]
      : undefined;

  return {
    netRows,
    companyId: sirket,
    companyName: sirket,
    period: String(year),
    columnTitle: `${sirket.toLocaleUpperCase("tr")} GELİRLER`,
    generatedAt: new Date().toISOString(),
    rows,
  };
}
