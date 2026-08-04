// ⚠️ DUMMY VERİ — sadece FASTAPI_BASE_URL tanımsızsa ya da gerçek Logo
// çağrısı tamamen başarısız olursa (bkz. api/webstore/route.ts) kullanılır.
// Normal koşullarda "Web Mağaza" sekmesi src/lib/webstore-report.ts
// üzerinden gerçek Logo verisiyle çalışır.

import { WebstoreDonem, WebstoreKanal, WebstoreRaporu } from "./webstore-types";

const PAZARYERLERI = [
  { ad: "Trendyol", oran: 0.62 },
  { ad: "Hepsiburada", oran: 0.19 },
  { ad: "Amazon", oran: 0.012 },
  { ad: "Pazarama", oran: 0.008 },
  { ad: "PTT AVM", oran: 0.005 },
  { ad: "N11", oran: 0.002 },
  { ad: "Idefix", oran: 0.001 },
];

function donemUret(label: string, kendiSiteToplam: number, faturaCarpani: number): WebstoreDonem {
  const kendiSite: WebstoreKanal = {
    key: "kendi-site",
    ad: "Kendi Sitem (holistikmarket.com)",
    toplamTutar: kendiSiteToplam,
    faturaAdedi: Math.round(kendiSiteToplam / 850) || 0,
  };

  const pazaryeriToplamOrani = PAZARYERLERI.reduce((s, p) => s + p.oran, 0);
  const pazaryeriGenelToplam = kendiSiteToplam * pazaryeriToplamOrani * faturaCarpani;

  const pazaryerleri: WebstoreKanal[] = PAZARYERLERI.map((p) => {
    const tutar = kendiSiteToplam * p.oran * faturaCarpani;
    return {
      key: p.ad.toLowerCase(),
      ad: p.ad,
      toplamTutar: tutar,
      faturaAdedi: Math.round(tutar / 500) || 0,
    };
  });

  const genelToplam = kendiSite.toplamTutar + pazaryeriGenelToplam;
  const genelFaturaAdedi =
    kendiSite.faturaAdedi + pazaryerleri.reduce((s, p) => s + p.faturaAdedi, 0);

  return {
    key: label === "Bugün" ? "bugun" : label === "Bu Hafta" ? "hafta" : label === "Bu Ay" ? "ay" : "yilbasi",
    label,
    baslangic: new Date().toISOString().slice(0, 10),
    bitis: new Date().toISOString().slice(0, 10),
    kendiSite,
    pazaryerleri,
    genelToplam,
    genelFaturaAdedi,
  };
}

export function getMockWebstoreRaporu(): WebstoreRaporu {
  return {
    brandName: "holistikmarket.com",
    donemler: [
      donemUret("Bugün", 220_000, 1),
      donemUret("Bu Hafta", 1_450_000, 1),
      donemUret("Bu Ay", 6_800_000, 1),
      donemUret("Yılbaşından Bugüne", 43_000_000, 1),
    ],
    generatedAt: new Date().toISOString(),
  };
}
