// "Web Mağaza" (holistikmarket.com) ciro özeti — GERÇEK Logo verisi.
//
// Kanal eşlemesi (2026-08-04'te /logo/cariler ile doğrulandı):
//   Kendi site   : 9.HOLISTIK.COM (HOLİSTİKMARKET.COM) + 9.TICIMAX (HOLİSTİK
//                  MARKET.COM) — ikisi de aynı sitenin farklı tahsilat
//                  kanalları, toplanıyor.
//   Pazaryerleri : 9.H.TRENDYOL, 9.H.HEPSIBURADA, 9.H.AMAZON, 9.H.PAZARAMA,
//                  9.H.PTT, 9.H.N11, 9.H.IDEFIX — hepsi "Holimer" şirketi
//                  altında ayrı torba cari.
//
// Hesaplama yöntemi: /logo/satislar/ozet tek çağrıda (sirket=Holimer,
// ilk_n=50) hem toplam hem "en çok alan cariler" listesini veriyor — kısa
// dönemlerde (bugün/hafta/ay) bu liste yukarıdaki 9 kanalın tamamını
// güvenle yakalıyor. Yılbaşından bugüne gibi uzun dönemlerde ise düşük
// hacimli kanallar (N11, Idefix gibi) top-50 dışında kalabiliyor — bu
// durumda o kanal için /logo/satislar'ı cari_kodu filtresiyle çekip ham
// satırlardan topluyoruz (hacimleri küçük olduğu için tek sayfada biter).
// Büyük hacimli kanallar (kendi site, Trendyol) için ham satır çekmiyoruz —
// zaten her zaman top-50 içinde çıkıyorlar.
//
// NOT: Danışmana /logo/satislar/ozet'e bir cari_kodu (tekli/çoklu) filtresi
// eklemesi rica edildi — eklenince bu "ham veriden tamamla" adımına hiç
// gerek kalmayacak, tüm dönemler tek çağrıyla kesinleşecek.

import { fetchSatislar, fetchSatislarOzet } from "./logo-api";
import { WebstoreDonem, WebstoreDonemAnahtari, WebstoreKanal, WebstoreRaporu } from "./webstore-types";

const SIRKET = "Holimer";

const KENDI_SITE_KODLARI = ["9.HOLISTIK.COM", "9.TICIMAX"];

const PAZARYERLERI: { kod: string; ad: string }[] = [
  { kod: "9.H.TRENDYOL", ad: "Trendyol" },
  { kod: "9.H.HEPSIBURADA", ad: "Hepsiburada" },
  { kod: "9.H.AMAZON", ad: "Amazon" },
  { kod: "9.H.PAZARAMA", ad: "Pazarama" },
  { kod: "9.H.PTT", ad: "PTT AVM" },
  { kod: "9.H.N11", ad: "N11" },
  { kod: "9.H.IDEFIX", ad: "Idefix" },
];

const TUM_KANAL_KODLARI = [...KENDI_SITE_KODLARI, ...PAZARYERLERI.map((p) => p.kod)];

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

interface DonemAraligi {
  key: WebstoreDonemAnahtari;
  label: string;
  baslangic: Date;
  bitis: Date;
}

function donemAraliklari(): DonemAraligi[] {
  const now = new Date();
  const bugun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Pazartesi = haftanın ilk günü
  const haftaGunu = (bugun.getUTCDay() + 6) % 7;
  const haftaBaslangic = new Date(bugun);
  haftaBaslangic.setUTCDate(haftaBaslangic.getUTCDate() - haftaGunu);

  const ayBaslangic = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const yilBaslangic = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  return [
    { key: "bugun", label: "Bugün", baslangic: bugun, bitis: bugun },
    { key: "hafta", label: "Bu Hafta", baslangic: haftaBaslangic, bitis: bugun },
    { key: "ay", label: "Bu Ay", baslangic: ayBaslangic, bitis: bugun },
    { key: "yilbasi", label: "Yılbaşından Bugüne", baslangic: yilBaslangic, bitis: bugun },
  ];
}

interface KanalToplam {
  toplamTutar: number;
  faturaAdedi: number;
}

/** Küçük hacimli kanallar için: ham satırları (gerekirse sayfalayarak) toplar. */
async function kanalToplamiHamVeriden(
  base: string,
  cariKodu: string,
  baslangic: string,
  bitis: string
): Promise<KanalToplam> {
  let offset = 0;
  const limit = 1000;
  let toplamTutar = 0;
  const faturaSet = new Set<string>();

  // Güvenlik sınırı: 20 sayfa (20.000 satır) — küçük hacimli kanallar için
  // fazlasıyla yeterli, büyük bir kanal yanlışlıkla buraya düşerse sonsuz
  // sayfalamaya girmesin diye.
  for (let sayfa = 0; sayfa < 20; sayfa++) {
    const veri = await fetchSatislar(base, { baslangic, bitis, cariKodu, limit, offset });
    for (const satir of veri.satirlar) {
      toplamTutar += satir.toplami;
      faturaSet.add(satir.fatura_numarasi);
    }
    if (veri.satirlar.length < limit) break;
    offset += limit;
  }

  return { toplamTutar, faturaAdedi: faturaSet.size };
}

async function kanalToplamlariniGetir(
  base: string,
  baslangic: string,
  bitis: string
): Promise<Map<string, KanalToplam>> {
  const sonuc = new Map<string, KanalToplam>();

  const ozet = await fetchSatislarOzet(base, { baslangic, bitis, sirket: SIRKET, ilkN: 50 });

  const bulunanlar = new Set<string>();
  for (const cari of ozet.en_cok_alan_cariler) {
    if (TUM_KANAL_KODLARI.includes(cari.cari_hesap_kodu)) {
      sonuc.set(cari.cari_hesap_kodu, {
        toplamTutar: cari.toplam_tutar,
        faturaAdedi: cari.fatura_adedi,
      });
      bulunanlar.add(cari.cari_hesap_kodu);
    }
  }

  const eksikler = TUM_KANAL_KODLARI.filter((kod) => !bulunanlar.has(kod));
  const hamSonuclar = await Promise.all(
    eksikler.map((kod) =>
      kanalToplamiHamVeriden(base, kod, baslangic, bitis).catch(
        (): KanalToplam => ({ toplamTutar: 0, faturaAdedi: 0 })
      )
    )
  );
  eksikler.forEach((kod, i) => sonuc.set(kod, hamSonuclar[i]));

  return sonuc;
}

export async function fetchWebstoreRaporu(base: string): Promise<WebstoreRaporu> {
  const donemler = await Promise.all(
    donemAraliklari().map(async (d): Promise<WebstoreDonem> => {
      const baslangic = fmt(d.baslangic);
      const bitis = fmt(d.bitis);
      const map = await kanalToplamlariniGetir(base, baslangic, bitis);

      const kendiSiteToplam = KENDI_SITE_KODLARI.reduce<KanalToplam>(
        (acc, kod) => {
          const v = map.get(kod) ?? { toplamTutar: 0, faturaAdedi: 0 };
          return {
            toplamTutar: acc.toplamTutar + v.toplamTutar,
            faturaAdedi: acc.faturaAdedi + v.faturaAdedi,
          };
        },
        { toplamTutar: 0, faturaAdedi: 0 }
      );

      const kendiSite: WebstoreKanal = {
        key: "kendi-site",
        ad: "Kendi Sitem (holistikmarket.com)",
        toplamTutar: kendiSiteToplam.toplamTutar,
        faturaAdedi: kendiSiteToplam.faturaAdedi,
      };

      const pazaryerleri: WebstoreKanal[] = PAZARYERLERI.map((p) => {
        const v = map.get(p.kod) ?? { toplamTutar: 0, faturaAdedi: 0 };
        return { key: p.kod, ad: p.ad, toplamTutar: v.toplamTutar, faturaAdedi: v.faturaAdedi };
      });

      const genelToplam =
        kendiSite.toplamTutar + pazaryerleri.reduce((s, p) => s + p.toplamTutar, 0);
      const genelFaturaAdedi =
        kendiSite.faturaAdedi + pazaryerleri.reduce((s, p) => s + p.faturaAdedi, 0);

      return {
        key: d.key,
        label: d.label,
        baslangic,
        bitis,
        kendiSite,
        pazaryerleri,
        genelToplam,
        genelFaturaAdedi,
      };
    })
  );

  return {
    brandName: "holistikmarket.com",
    donemler,
    generatedAt: new Date().toISOString(),
  };
}
