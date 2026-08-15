// ⚠️ DUMMY VERİ — sadece FASTAPI_BASE_URL tanımsızsa ya da gerçek Logo
// çağrısı tamamen başarısız olursa (bkz. api/webstore/route.ts) kullanılır.
// Normal koşullarda "Web Mağaza" sekmesi src/lib/webstore-report.ts
// üzerinden gerçek Logo verisiyle çalışır.

import {
  WebstoreDonem,
  WebstoreDonemAnahtari,
  WebstoreGranularite,
  WebstoreGunlukNokta,
  WebstoreGunlukSeri,
  WebstoreKanal,
  WebstoreRaporu,
  WebstoreSeri,
  WebstoreSeriNoktasi,
} from "./webstore-types";

const PAZARYERLERI = [
  { ad: "Trendyol", oran: 0.62 },
  { ad: "Hepsiburada", oran: 0.19 },
  { ad: "Amazon", oran: 0.012 },
  { ad: "Pazarama", oran: 0.008 },
  { ad: "PTT AVM", oran: 0.005 },
  { ad: "N11", oran: 0.002 },
  { ad: "Idefix", oran: 0.001 },
];

const TAM_AY_ADLARI = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

// Basit, deterministik bir sözde-rastgele üretici — her yüklemede aynı
// (ama günden güne değişen) mock veriyi üretsin diye Math.random yerine
// tercih edildi.
function seededNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function donemUret(
  key: WebstoreDonemAnahtari,
  label: string,
  kendiSiteToplam: number,
  faturaCarpani: number,
  detayli: boolean
): WebstoreDonem {
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

  // KDV %20 varsayımıyla mock matrah/kdv (sadece örnek veri — gerçek veride
  // bu satır bazlı Logo verisinden hesaplanır, bkz. webstore-report.ts).
  const matrah = detayli ? genelToplam / 1.2 : 0;
  const kdv = detayli ? genelToplam - matrah : 0;

  // Önceki dönem: %-8 ile %+15 arası rastgele bir değişim.
  const degisim = -0.08 + seededNoise(genelToplam) * 0.23;
  const oncekiGenelToplam = genelToplam / (1 + degisim);
  const pazaryerleriToplamRecord: Record<string, number> = {};
  pazaryerleri.forEach((p) => (pazaryerleriToplamRecord[p.key] = p.toplamTutar / (1 + degisim)));

  const oncekiLabel =
    key === "bugun"
      ? "Dün"
      : key === "hafta"
        ? "Geçen Hafta (aynı gün sayısı)"
        : key === "ay"
          ? "Geçen Ay (aynı gün sayısı)"
          : "Geçen Yıl (Yılbaşı – Aynı Tarih)";

  return {
    key,
    label,
    baslangic: new Date().toISOString().slice(0, 10),
    bitis: new Date().toISOString().slice(0, 10),
    kendiSite,
    pazaryerleri,
    genelToplam,
    genelFaturaAdedi,
    matrahKirilimi: {
      matrahHesaplandi: detayli,
      matrah,
      kdv,
      tutar: genelToplam,
    },
    karsilastirma: {
      label: oncekiLabel,
      baslangic: new Date().toISOString().slice(0, 10),
      bitis: new Date().toISOString().slice(0, 10),
      genelToplam: oncekiGenelToplam,
      genelFaturaAdedi: Math.round(genelFaturaAdedi / (1 + degisim)),
      kendiSiteToplam: kendiSite.toplamTutar / (1 + degisim),
      pazaryerleriToplam: pazaryerleriToplamRecord,
      degisimYuzde: degisim * 100,
    },
  };
}

export function getMockWebstoreRaporu(): WebstoreRaporu {
  return {
    brandName: "holistikmarket.com",
    donemler: [
      donemUret("bugun", "Bugün", 220_000, 1, true),
      donemUret("hafta", "Bu Hafta", 1_450_000, 1, true),
      donemUret("ay", "Bu Ay", 6_800_000, 1, true),
      donemUret("yilbasi", "Yılbaşından Bugüne", 43_000_000, 1, false),
    ],
    generatedAt: new Date().toISOString(),
  };
}

function aySeriUret(yil: number, ay: number, gunSayisi: number, gunlukOrtalama: number) {
  const gunler: WebstoreGunlukNokta[] = [];
  let toplam = 0;
  for (let gun = 1; gun <= gunSayisi; gun++) {
    const noise = 0.55 + seededNoise(yil * 1000 + ay * 31 + gun) * 0.9;
    const genelToplam = Math.round(gunlukOrtalama * noise);
    const kendiSiteToplam = Math.round(genelToplam * 0.32);
    const pazaryerleriToplam = genelToplam - kendiSiteToplam;
    toplam += genelToplam;
    gunler.push({
      tarih: `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`,
      genelToplam,
      kendiSiteToplam,
      pazaryerleriToplam,
      faturaAdedi: Math.round(genelToplam / 500) || 0,
      // ~260 TL/kutu dummy varsayım — kutu-mock.ts'teki (~200-350 TL) aralığıyla tutarlı.
      kutuAdedi: Math.round(genelToplam / 260) || 0,
    });
  }
  return { gunler, toplam };
}

export function getMockWebstoreGunlukSeri(yil: number, ay: number): WebstoreGunlukSeri {
  const bugun = new Date();
  const suAnkiAy = bugun.getUTCFullYear() === yil && bugun.getUTCMonth() + 1 === ay;
  const aySonGunu = new Date(Date.UTC(yil, ay, 0)).getUTCDate();
  const gunSayisi = suAnkiAy ? bugun.getUTCDate() : aySonGunu;

  if (new Date(Date.UTC(yil, ay - 1, 1)) > new Date(Date.UTC(bugun.getUTCFullYear(), bugun.getUTCMonth(), bugun.getUTCDate()))) {
    return { yil, ay, ayEtiketi: `${TAM_AY_ADLARI[ay - 1]} ${yil}`, gunler: [], toplam: 0 };
  }

  const { gunler, toplam } = aySeriUret(yil, ay, gunSayisi, 230_000);
  const gecenYilGunSayisi = new Date(Date.UTC(yil - 1, ay, 0)).getUTCDate();
  const gecenYil = aySeriUret(yil - 1, ay, gecenYilGunSayisi, 190_000);

  return {
    yil,
    ay,
    ayEtiketi: `${TAM_AY_ADLARI[ay - 1]} ${yil}`,
    gunler,
    toplam,
    gecenYilAyniAy: {
      ayEtiketi: `${TAM_AY_ADLARI[ay - 1]} ${yil - 1}`,
      gunler: gecenYil.gunler,
      toplam: gecenYil.toplam,
    },
  };
}

function seriNoktasiUret(key: string, label: string, ortalama: number, seed: number): WebstoreSeriNoktasi {
  const noise = 0.6 + seededNoise(seed) * 0.8;
  const genelToplam = Math.round(ortalama * noise);
  const kendiSiteToplam = Math.round(genelToplam * 0.32);
  return {
    key,
    label,
    baslangic: new Date().toISOString().slice(0, 10),
    bitis: new Date().toISOString().slice(0, 10),
    genelToplam,
    genelFaturaAdedi: Math.round(genelToplam / 500) || 0,
    kendiSiteToplam,
    pazaryerleriToplam: genelToplam - kendiSiteToplam,
  };
}

export function getMockWebstoreSeri(granularite: WebstoreGranularite, yil?: number): WebstoreSeri {
  const bugun = new Date();
  const hedefYil = yil ?? bugun.getUTCFullYear();

  if (granularite === "aylik") {
    const suAnkiAy = hedefYil === bugun.getUTCFullYear() ? bugun.getUTCMonth() + 1 : 12;
    const noktalar = Array.from({ length: suAnkiAy }, (_, i) =>
      seriNoktasiUret(`${hedefYil}-${i + 1}`, TAM_AY_ADLARI[i].slice(0, 3), 6_800_000, hedefYil * 100 + i)
    );
    return {
      granularite,
      baslik: `${hedefYil} — Aylık`,
      noktalar,
      toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
    };
  }

  if (granularite === "haftalik") {
    const noktalar = Array.from({ length: 12 }, (_, i) => {
      const gun = new Date(bugun);
      gun.setUTCDate(gun.getUTCDate() - (11 - i) * 7);
      const label = `${String(gun.getUTCDate()).padStart(2, "0")}.${String(gun.getUTCMonth() + 1).padStart(2, "0")}`;
      return seriNoktasiUret(gun.toISOString().slice(0, 10), label, 1_450_000, i * 7 + 3);
    });
    return {
      granularite,
      baslik: "Son 12 Hafta",
      noktalar,
      toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
    };
  }

  // yillik
  const buYil = bugun.getUTCFullYear();
  const noktalar = Array.from({ length: 4 }, (_, i) => {
    const yilDegeri = buYil - 3 + i;
    return seriNoktasiUret(String(yilDegeri), String(yilDegeri), 38_000_000 * (0.7 + i * 0.15), yilDegeri);
  });
  return {
    granularite,
    baslik: "Yıllık",
    noktalar,
    toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
  };
}
