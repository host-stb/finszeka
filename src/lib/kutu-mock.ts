// ⚠️ DUMMY VERİ — sadece FASTAPI_BASE_URL tanımsızsa ya da gerçek Logo
// çağrısı tamamen başarısız olursa (bkz. api/kutu-trend/seri/route.ts)
// kullanılır. Normal koşullarda "Kutu Trendi" sayfası src/lib/kutu-report.ts
// üzerinden gerçek Logo verisiyle çalışır.

import { KutuGranularite, KutuSeri, KutuSeriNoktasi, KutuSirketPay } from "./kutu-types";

// Gerçek raporda web mağaza payı sadece Günlük/Haftalık'ta hesaplanır (bkz.
// kutu-report.ts) — dummy veri de aynı davranışı taklit etsin diye bu iki
// granülaritede MOCK_SIRKETLER[0] (Holimer) için webMagaza dolduruluyor.

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

// Dummy şirket kırılımı — gerçek listeyle aynı isimler kullanılır ki UI
// bileşenleri gerçek veriyle aynı şekilde davransın.
const MOCK_SIRKETLER = [
  { ad: "Holimer", pay: 0.8, webMagazaPay: 0.55 }, // Holimer içindeki web mağaza (e-ticaret) payı — örnek
  { ad: "Fw İlaç", pay: 0.2, webMagazaPay: 0 },
];

// Basit, deterministik bir sözde-rastgele üretici (Math.random yerine) —
// her yüklemede aynı mock veriyi üretsin diye.
function seededNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const MOCK_KUR = {
  tarih: "örnek",
  usdAlis: 47.72,
  usdSatis: 47.81,
  eurAlis: 55.14,
  eurSatis: 55.24,
  kaynak: "yok" as const,
  alinamadi: true as const,
};

function noktaUret(
  key: string,
  label: string,
  baslangic: string,
  bitis: string,
  ortalamaKutu: number,
  seed: number,
  webMagazaHesapla: boolean
): KutuSeriNoktasi {
  const kutuAdedi = Math.max(0, Math.round(ortalamaKutu * (0.6 + seededNoise(seed) * 0.8)));
  const birimFiyat = 200 + seededNoise(seed * 1.7) * 150; // ~200-350 TL/kutu aralığında dummy
  const ciroTl = Math.round(kutuAdedi * birimFiyat);
  const ciroKutuTl = kutuAdedi > 0 ? ciroTl / kutuAdedi : null;

  const sirketler: KutuSirketPay[] = MOCK_SIRKETLER.map((s) => {
    const sKutu = Math.round(kutuAdedi * s.pay);
    const sCiro = Math.round(ciroTl * s.pay);
    return {
      sirket: s.ad,
      kutuAdedi: sKutu,
      ciroTl: sCiro,
      ...(webMagazaHesapla && s.webMagazaPay > 0
        ? {
            webMagaza: {
              kutuAdedi: Math.round(sKutu * s.webMagazaPay),
              ciroTl: Math.round(sCiro * s.webMagazaPay),
            },
          }
        : {}),
    };
  });

  return {
    key,
    label,
    baslangic,
    bitis,
    kutuAdedi,
    ciroTl,
    ciroKutuTl,
    ciroKutuEur: null,
    ciroKutuUsd: null,
    sirketler,
  };
}

function toplamlar(noktalar: KutuSeriNoktasi[]) {
  const sirketMap = new Map<string, KutuSirketPay>();
  for (const n of noktalar) {
    for (const s of n.sirketler) {
      const mevcut = sirketMap.get(s.sirket) ?? { sirket: s.sirket, kutuAdedi: 0, ciroTl: 0 };
      mevcut.kutuAdedi += s.kutuAdedi;
      mevcut.ciroTl += s.ciroTl;
      if (s.webMagaza) {
        const mevcutWeb = mevcut.webMagaza ?? { kutuAdedi: 0, ciroTl: 0 };
        mevcutWeb.kutuAdedi += s.webMagaza.kutuAdedi;
        mevcutWeb.ciroTl += s.webMagaza.ciroTl;
        mevcut.webMagaza = mevcutWeb;
      }
      sirketMap.set(s.sirket, mevcut);
    }
  }
  return {
    toplamKutu: noktalar.reduce((s, n) => s + n.kutuAdedi, 0),
    toplamCiroTl: noktalar.reduce((s, n) => s + n.ciroTl, 0),
    sirketToplamlari: Array.from(sirketMap.values()),
  };
}

export function getMockKutuSeri(granularite: KutuGranularite, yil?: number, ay?: number): KutuSeri {
  const bugun = new Date();

  if (granularite === "gunluk") {
    const hedefYil = yil ?? bugun.getFullYear();
    const hedefAy = ay ?? bugun.getMonth() + 1;
    const gunSayisi = new Date(hedefYil, hedefAy, 0).getDate();
    const noktalar = Array.from({ length: gunSayisi }, (_, i) =>
      noktaUret(
        `${hedefYil}-${hedefAy}-${i + 1}`,
        `${String(i + 1).padStart(2, "0")}.${String(hedefAy).padStart(2, "0")}`,
        `${hedefYil}-${String(hedefAy).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
        `${hedefYil}-${String(hedefAy).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
        1800,
        i + 1,
        true
      )
    );
    return {
      granularite,
      baslik: `${TAM_AY_ADLARI[hedefAy - 1]} ${hedefYil} — Günlük (Örnek)`,
      aciklama: "Örnek veri — FASTAPI_BASE_URL tanımlanınca gerçek Logo verisiyle değişir.",
      noktalar,
      kur: MOCK_KUR,
      webMagazaHesaplandi: true,
      ...toplamlar(noktalar),
    };
  }

  if (granularite === "haftalik") {
    const noktalar = Array.from({ length: 12 }, (_, i) =>
      noktaUret(`hafta-${i}`, `H${i + 1}`, "", "", 9000, i + 1, true)
    );
    return {
      granularite,
      baslik: "Son 12 Hafta — Haftalık (Örnek)",
      aciklama: "Örnek veri — FASTAPI_BASE_URL tanımlanınca gerçek Logo verisiyle değişir.",
      noktalar,
      kur: MOCK_KUR,
      webMagazaHesaplandi: true,
      ...toplamlar(noktalar),
    };
  }

  if (granularite === "aylik") {
    const hedefYil = yil ?? bugun.getFullYear();
    const noktalar = TAM_AY_ADLARI.map((ad, i) =>
      noktaUret(`${hedefYil}-${i + 1}`, ad.slice(0, 3), "", "", 90000, i + 1, false)
    );
    return {
      granularite,
      baslik: `${hedefYil} — Aylık (Örnek)`,
      aciklama: "Örnek veri — FASTAPI_BASE_URL tanımlanınca gerçek Logo verisiyle değişir.",
      noktalar,
      kur: MOCK_KUR,
      webMagazaHesaplandi: false,
      ...toplamlar(noktalar),
    };
  }

  // yillik
  const buYil = bugun.getFullYear();
  const noktalar = Array.from({ length: 4 }, (_, i) =>
    noktaUret(String(buYil - 3 + i), String(buYil - 3 + i), "", "", 700000, i + 1, false)
  );
  return {
    granularite,
    baslik: "Yıllık (Örnek)",
    aciklama: "Örnek veri — FASTAPI_BASE_URL tanımlanınca gerçek Logo verisiyle değişir.",
    noktalar,
    kur: MOCK_KUR,
    webMagazaHesaplandi: false,
    ...toplamlar(noktalar),
  };
}
