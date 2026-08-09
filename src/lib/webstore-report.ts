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
// KDV dahil/hariç (matrah) kırılımı: /logo/satislar/ozet'in "genel" alanı
// matrah/kdv/tutar verir ama bu ŞİRKET GENELİ toplamıdır (sadece web mağaza
// kanalları değil) — bu yüzden web mağaza kırılımı için kullanılamaz. Doğru
// kırılım sadece satır bazlı veriden (satir_matrahi + kdv alanları) elde
// edilebilir. Bunu SADECE kısa dönemlerde (bugün/hafta/ay) 9 kanalın TAMAMI
// için ham veri çekerek hesaplıyoruz — yılbaşından bugüne gibi uzun
// dönemlerde veri hacmi çok büyüyeceği için hesaplanmıyor (bkz.
// WebstoreMatrahKirilimi.matrahHesaplandi — rakam uydurmamak için bu
// durumda arayüzde gösterilmemeli).
//
// NOT: Danışmana /logo/satislar/ozet'e bir cari_kodu (tekli/çoklu) filtresi
// eklemesi rica edildi — eklenince bu "ham veriden tamamla" adımına hiç
// gerek kalmayacak, tüm dönemler tek çağrıyla kesinleşecek.

import { fetchLogoDurum, fetchSatislar, fetchSatislarOzet } from "./logo-api";
import {
  WebstoreDonem,
  WebstoreDonemAnahtari,
  WebstoreGunlukNokta,
  WebstoreGunlukSeri,
  WebstoreKanal,
  WebstoreKarsilastirma,
  WebstoreRaporu,
  WebstoreSeri,
  WebstoreSeriNoktasi,
} from "./webstore-types";

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

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Logo'dan gelen tarih hem "YYYY-MM-DD[...]" hem "GG.AA.YYYY" olabilir — ikisini de güvenle günlük anahtara çevirir. */
function gunAnahtari(tarihi: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(tarihi)) return tarihi.slice(0, 10);
  const m = tarihi.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return tarihi.slice(0, 10);
}

interface DonemAraligi {
  key: WebstoreDonemAnahtari;
  label: string;
  baslangic: Date;
  bitis: Date;
}

function bugunUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function donemAraliklari(): DonemAraligi[] {
  const bugun = bugunUtc();

  // Pazartesi = haftanın ilk günü
  const haftaGunu = (bugun.getUTCDay() + 6) % 7;
  const haftaBaslangic = new Date(bugun);
  haftaBaslangic.setUTCDate(haftaBaslangic.getUTCDate() - haftaGunu);

  const ayBaslangic = new Date(Date.UTC(bugun.getUTCFullYear(), bugun.getUTCMonth(), 1));
  const yilBaslangic = new Date(Date.UTC(bugun.getUTCFullYear(), 0, 1));

  return [
    { key: "bugun", label: "Bugün", baslangic: bugun, bitis: bugun },
    { key: "hafta", label: "Bu Hafta", baslangic: haftaBaslangic, bitis: bugun },
    { key: "ay", label: "Bu Ay", baslangic: ayBaslangic, bitis: bugun },
    { key: "yilbasi", label: "Yılbaşından Bugüne", baslangic: yilBaslangic, bitis: bugun },
  ];
}

/** Bir önceki eşdeğer dönemin (aynı uzunlukta) aralığı + görünen etiketi. */
function oncekiDonemAraligi(d: DonemAraligi): { label: string; baslangic: Date; bitis: Date } {
  const bugun = bugunUtc();

  if (d.key === "bugun") {
    const t = new Date(bugun);
    t.setUTCDate(t.getUTCDate() - 1);
    return { label: "Dün", baslangic: t, bitis: t };
  }

  if (d.key === "hafta") {
    const b = new Date(d.baslangic);
    b.setUTCDate(b.getUTCDate() - 7);
    const s = new Date(bugun);
    s.setUTCDate(s.getUTCDate() - 7);
    return { label: "Geçen Hafta (aynı gün sayısı)", baslangic: b, bitis: s };
  }

  if (d.key === "ay") {
    const oncekiAyBaslangic = new Date(
      Date.UTC(d.baslangic.getUTCFullYear(), d.baslangic.getUTCMonth() - 1, 1)
    );
    const oncekiAySonGun = new Date(
      Date.UTC(oncekiAyBaslangic.getUTCFullYear(), oncekiAyBaslangic.getUTCMonth() + 1, 0)
    ).getUTCDate();
    const gun = Math.min(bugun.getUTCDate(), oncekiAySonGun);
    const oncekiAyBitis = new Date(
      Date.UTC(oncekiAyBaslangic.getUTCFullYear(), oncekiAyBaslangic.getUTCMonth(), gun)
    );
    return { label: "Geçen Ay (aynı gün sayısı)", baslangic: oncekiAyBaslangic, bitis: oncekiAyBitis };
  }

  // yilbasi
  const oncekiYilBaslangic = new Date(Date.UTC(d.baslangic.getUTCFullYear() - 1, 0, 1));
  const yil = bugun.getUTCFullYear() - 1;
  const ay = bugun.getUTCMonth();
  const sonGun = new Date(Date.UTC(yil, ay + 1, 0)).getUTCDate();
  const gun = Math.min(bugun.getUTCDate(), sonGun);
  const oncekiYilBitis = new Date(Date.UTC(yil, ay, gun));
  return {
    label: "Geçen Yıl (Yılbaşı – Aynı Tarih)",
    baslangic: oncekiYilBaslangic,
    bitis: oncekiYilBitis,
  };
}

interface KanalToplamDetay {
  toplamTutar: number;
  faturaAdedi: number;
  /** Sadece detaylı (matrah hesaplayan) çağrılarda doludur. */
  matrah: number;
  kdv: number;
}

/** Küçük hacimli kanallar / detaylı mod için: ham satırları (gerekirse sayfalayarak) toplar. */
async function kanalToplamiHamVeriden(
  base: string,
  cariKodu: string,
  baslangic: string,
  bitis: string
): Promise<KanalToplamDetay> {
  let offset = 0;
  const limit = 1000;
  let toplamTutar = 0;
  let matrah = 0;
  let kdv = 0;
  const faturaSet = new Set<string>();

  // Güvenlik sınırı: 40 sayfa (40.000 satır) — bir ay/hafta/gün için
  // fazlasıyla yeterli; bir kanal yanlışlıkla buraya düşerse sonsuz
  // sayfalamaya girmesin diye.
  for (let sayfa = 0; sayfa < 40; sayfa++) {
    const veri = await fetchSatislar(base, { baslangic, bitis, cariKodu, limit, offset });
    for (const satir of veri.satirlar) {
      toplamTutar += satir.toplami;
      matrah += satir.satir_matrahi;
      kdv += satir.kdv;
      faturaSet.add(satir.fatura_numarasi);
    }
    if (veri.satirlar.length < limit) break;
    offset += limit;
  }

  return { toplamTutar, faturaAdedi: faturaSet.size, matrah, kdv };
}

/**
 * Kanal başına toplamları döner.
 * - `detayli=false` (hızlı yol, YTD gibi uzun dönemler için): /logo/satislar/ozet
 *   top-50 listesinden okunur, sadece eksik kalan (düşük hacimli) kanallar için
 *   ham veriye düşülür. matrah/kdv alanları 0'dır (hesaplanmadı).
 * - `detayli=true` (kısa dönemler — bugün/hafta/ay): 9 kanalın TAMAMI için ham
 *   veri çekilir, böylece gerçek matrah/kdv toplamı elde edilir.
 */
async function kanalToplamlariniGetir(
  base: string,
  baslangic: string,
  bitis: string,
  detayli: boolean
): Promise<Map<string, KanalToplamDetay>> {
  if (detayli) {
    const sonuc = new Map<string, KanalToplamDetay>();
    const detaylar = await Promise.all(
      TUM_KANAL_KODLARI.map((kod) =>
        kanalToplamiHamVeriden(base, kod, baslangic, bitis).catch(
          (): KanalToplamDetay => ({ toplamTutar: 0, faturaAdedi: 0, matrah: 0, kdv: 0 })
        )
      )
    );
    TUM_KANAL_KODLARI.forEach((kod, i) => sonuc.set(kod, detaylar[i]));
    return sonuc;
  }

  const sonuc = new Map<string, KanalToplamDetay>();

  const ozet = await fetchSatislarOzet(base, { baslangic, bitis, sirket: SIRKET, ilkN: 50 });

  const bulunanlar = new Set<string>();
  for (const cari of ozet.en_cok_alan_cariler) {
    if (TUM_KANAL_KODLARI.includes(cari.cari_hesap_kodu)) {
      sonuc.set(cari.cari_hesap_kodu, {
        toplamTutar: cari.toplam_tutar,
        faturaAdedi: cari.fatura_adedi,
        matrah: 0,
        kdv: 0,
      });
      bulunanlar.add(cari.cari_hesap_kodu);
    }
  }

  const eksikler = TUM_KANAL_KODLARI.filter((kod) => !bulunanlar.has(kod));
  const hamSonuclar = await Promise.all(
    eksikler.map((kod) =>
      kanalToplamiHamVeriden(base, kod, baslangic, bitis).catch(
        (): KanalToplamDetay => ({ toplamTutar: 0, faturaAdedi: 0, matrah: 0, kdv: 0 })
      )
    )
  );
  eksikler.forEach((kod, i) => sonuc.set(kod, hamSonuclar[i]));

  return sonuc;
}

function kanalMapindenOzet(map: Map<string, KanalToplamDetay>) {
  const kendiSiteToplam = KENDI_SITE_KODLARI.reduce<KanalToplamDetay>(
    (acc, kod) => {
      const v = map.get(kod) ?? { toplamTutar: 0, faturaAdedi: 0, matrah: 0, kdv: 0 };
      return {
        toplamTutar: acc.toplamTutar + v.toplamTutar,
        faturaAdedi: acc.faturaAdedi + v.faturaAdedi,
        matrah: acc.matrah + v.matrah,
        kdv: acc.kdv + v.kdv,
      };
    },
    { toplamTutar: 0, faturaAdedi: 0, matrah: 0, kdv: 0 }
  );

  const kendiSite: WebstoreKanal = {
    key: "kendi-site",
    ad: "Kendi Sitem (holistikmarket.com)",
    toplamTutar: kendiSiteToplam.toplamTutar,
    faturaAdedi: kendiSiteToplam.faturaAdedi,
  };

  const pazaryerleri: WebstoreKanal[] = PAZARYERLERI.map((p) => {
    const v = map.get(p.kod) ?? { toplamTutar: 0, faturaAdedi: 0, matrah: 0, kdv: 0 };
    return { key: p.kod, ad: p.ad, toplamTutar: v.toplamTutar, faturaAdedi: v.faturaAdedi };
  });

  const genelToplam = kendiSite.toplamTutar + pazaryerleri.reduce((s, p) => s + p.toplamTutar, 0);
  const genelFaturaAdedi =
    kendiSite.faturaAdedi + pazaryerleri.reduce((s, p) => s + p.faturaAdedi, 0);

  let genelMatrah = 0;
  let genelKdv = 0;
  for (const kod of TUM_KANAL_KODLARI) {
    const v = map.get(kod);
    if (v) {
      genelMatrah += v.matrah;
      genelKdv += v.kdv;
    }
  }

  return { kendiSite, pazaryerleri, genelToplam, genelFaturaAdedi, genelMatrah, genelKdv };
}

export async function fetchWebstoreRaporu(base: string): Promise<WebstoreRaporu> {
  const donemler = await Promise.all(
    donemAraliklari().map(async (d): Promise<WebstoreDonem> => {
      const baslangic = fmt(d.baslangic);
      const bitis = fmt(d.bitis);
      const detayli = d.key !== "yilbasi";

      const map = await kanalToplamlariniGetir(base, baslangic, bitis, detayli);
      const { kendiSite, pazaryerleri, genelToplam, genelFaturaAdedi, genelMatrah, genelKdv } =
        kanalMapindenOzet(map);

      const oncekiAralik = oncekiDonemAraligi(d);
      const oncekiMap = await kanalToplamlariniGetir(
        base,
        fmt(oncekiAralik.baslangic),
        fmt(oncekiAralik.bitis),
        false
      );
      const oncekiOzet = kanalMapindenOzet(oncekiMap);
      const pazaryerleriToplamRecord: Record<string, number> = {};
      oncekiOzet.pazaryerleri.forEach((p) => (pazaryerleriToplamRecord[p.key] = p.toplamTutar));

      const karsilastirma: WebstoreKarsilastirma = {
        label: oncekiAralik.label,
        baslangic: fmt(oncekiAralik.baslangic),
        bitis: fmt(oncekiAralik.bitis),
        genelToplam: oncekiOzet.genelToplam,
        genelFaturaAdedi: oncekiOzet.genelFaturaAdedi,
        kendiSiteToplam: oncekiOzet.kendiSite.toplamTutar,
        pazaryerleriToplam: pazaryerleriToplamRecord,
        degisimYuzde:
          oncekiOzet.genelToplam > 0
            ? ((genelToplam - oncekiOzet.genelToplam) / oncekiOzet.genelToplam) * 100
            : null,
      };

      return {
        key: d.key,
        label: d.label,
        baslangic,
        bitis,
        kendiSite,
        pazaryerleri,
        genelToplam,
        genelFaturaAdedi,
        matrahKirilimi: {
          matrahHesaplandi: detayli,
          matrah: detayli ? genelMatrah : 0,
          kdv: detayli ? genelKdv : 0,
          tutar: genelToplam,
        },
        karsilastirma,
      };
    })
  );

  return {
    brandName: "holistikmarket.com",
    donemler,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Günlük detay (bir ay seçilip gün gün ciro serisi görmek için).
// ---------------------------------------------------------------------------

/** Bir kanalın verilen aralıktaki satırlarını güne göre gruplar. */
async function kanalGunlukHamVeriden(
  base: string,
  cariKodu: string,
  baslangic: string,
  bitis: string
): Promise<Map<string, { tutar: number; faturaSet: Set<string> }>> {
  const gunMap = new Map<string, { tutar: number; faturaSet: Set<string> }>();
  let offset = 0;
  const limit = 1000;

  for (let sayfa = 0; sayfa < 60; sayfa++) {
    const veri = await fetchSatislar(base, { baslangic, bitis, cariKodu, limit, offset });
    for (const satir of veri.satirlar) {
      const gun = gunAnahtari(satir.tarihi);
      const mevcut = gunMap.get(gun) ?? { tutar: 0, faturaSet: new Set<string>() };
      mevcut.tutar += satir.toplami;
      mevcut.faturaSet.add(satir.fatura_numarasi);
      gunMap.set(gun, mevcut);
    }
    if (veri.satirlar.length < limit) break;
    offset += limit;
  }

  return gunMap;
}

async function gunlukSeriHesapla(
  base: string,
  yil: number,
  ay: number
): Promise<{ gunler: WebstoreGunlukNokta[]; toplam: number } | null> {
  const ayBaslangicDate = new Date(Date.UTC(yil, ay - 1, 1));
  const bugun = bugunUtc();
  if (ayBaslangicDate > bugun) return null; // tamamen gelecekteki bir ay

  const aySonGunDate = new Date(Date.UTC(yil, ay, 0));
  const bitisDate = aySonGunDate > bugun ? bugun : aySonGunDate;

  const baslangic = fmt(ayBaslangicDate);
  const bitis = fmt(bitisDate);

  const kanalSonuclari = await Promise.all(
    TUM_KANAL_KODLARI.map((kod) =>
      kanalGunlukHamVeriden(base, kod, baslangic, bitis).catch(
        () => new Map<string, { tutar: number; faturaSet: Set<string> }>()
      )
    )
  );

  const kendiSiteIdxler = KENDI_SITE_KODLARI.map((kod) => TUM_KANAL_KODLARI.indexOf(kod));
  const pazaryeriIdxler = PAZARYERLERI.map((p) => TUM_KANAL_KODLARI.indexOf(p.kod));

  const gunler: WebstoreGunlukNokta[] = [];
  let toplam = 0;
  for (
    let d = new Date(ayBaslangicDate);
    d <= bitisDate;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const tarih = fmt(d);
    let kendiSiteToplam = 0;
    let pazaryerleriToplam = 0;
    const faturaSet = new Set<string>();

    kendiSiteIdxler.forEach((idx) => {
      const g = kanalSonuclari[idx].get(tarih);
      if (g) {
        kendiSiteToplam += g.tutar;
        g.faturaSet.forEach((f) => faturaSet.add(f));
      }
    });
    pazaryeriIdxler.forEach((idx) => {
      const g = kanalSonuclari[idx].get(tarih);
      if (g) {
        pazaryerleriToplam += g.tutar;
        g.faturaSet.forEach((f) => faturaSet.add(f));
      }
    });

    const genelToplam = kendiSiteToplam + pazaryerleriToplam;
    toplam += genelToplam;
    gunler.push({
      tarih,
      genelToplam,
      kendiSiteToplam,
      pazaryerleriToplam,
      faturaAdedi: faturaSet.size,
    });
  }

  return { gunler, toplam };
}

/** Seçilen ay için gün gün ciro serisi + varsa aynı ayın geçen yılıyla karşılaştırma. */
export async function fetchWebstoreGunlukSeri(
  base: string,
  yil: number,
  ay: number
): Promise<WebstoreGunlukSeri> {
  const guncel = await gunlukSeriHesapla(base, yil, ay);
  if (!guncel) {
    return {
      yil,
      ay,
      ayEtiketi: `${TAM_AY_ADLARI[ay - 1]} ${yil}`,
      gunler: [],
      toplam: 0,
    };
  }

  let gecenYilAyniAy: WebstoreGunlukSeri["gecenYilAyniAy"];
  try {
    const gecenYil = await gunlukSeriHesapla(base, yil - 1, ay);
    if (gecenYil && gecenYil.gunler.length > 0) {
      gecenYilAyniAy = {
        ayEtiketi: `${TAM_AY_ADLARI[ay - 1]} ${yil - 1}`,
        gunler: gecenYil.gunler,
        toplam: gecenYil.toplam,
      };
    }
  } catch {
    // Geçen yılın verisi alınamazsa karşılaştırmayı sessizce atla — ana veri hâlâ geçerli.
  }

  return {
    yil,
    ay,
    ayEtiketi: `${TAM_AY_ADLARI[ay - 1]} ${yil}`,
    gunler: guncel.gunler,
    toplam: guncel.toplam,
    gecenYilAyniAy,
  };
}

// ---------------------------------------------------------------------------
// Haftalık / Aylık / Yıllık zaman serisi (trend grafiği).
// Hepsi "hızlı yol"u (kanalToplamlariniGetir(..., false)) kullanır — matrah/kdv
// kırılımı yok, sadece KDV dahil toplam. Uzun bir zaman aralığında çok sayıda
// nokta çekildiği için (12 ay, 12 hafta, birkaç yıl) performans amaçlı böyle
// tasarlandı; kısa dönem kartlarındaki (bugün/hafta/ay) detaylı matrah
// hesaplamasıyla karıştırılmamalı.
// ---------------------------------------------------------------------------

/**
 * Bir dönem noktasını hesaplar. Bu tek noktanın çekilmesi başarısız olursa
 * (ağ/HTTP hatası) TÜM seriyi mock'a düşürmemek için hatayı burada yutar ve
 * `veriAlinamadi: true` ile işaretler — arayüz bunu gerçek bir sıfırdan
 * ayırt edip gösterebilsin diye (rakam uydurmamak için: 0 ile "veri yok"
 * karıştırılmamalı).
 */
async function noktaHesapla(
  base: string,
  key: string,
  label: string,
  baslangicDate: Date,
  bitisDate: Date
): Promise<WebstoreSeriNoktasi> {
  const baslangic = fmt(baslangicDate);
  const bitis = fmt(bitisDate);

  try {
    const map = await kanalToplamlariniGetir(base, baslangic, bitis, false);
    const ozet = kanalMapindenOzet(map);
    return {
      key,
      label,
      baslangic,
      bitis,
      genelToplam: ozet.genelToplam,
      genelFaturaAdedi: ozet.genelFaturaAdedi,
      kendiSiteToplam: ozet.kendiSite.toplamTutar,
      pazaryerleriToplam: ozet.pazaryerleri.reduce((s, p) => s + p.toplamTutar, 0),
    };
  } catch (err) {
    console.error(`[webstore-report] ${key} (${baslangic} – ${bitis}) için veri alınamadı:`, err);
    return {
      key,
      label,
      baslangic,
      bitis,
      genelToplam: 0,
      genelFaturaAdedi: 0,
      kendiSiteToplam: 0,
      pazaryerleriToplam: 0,
      veriAlinamadi: true,
    };
  }
}

/** Seçilen yılın (varsayılan: bu yıl) ay ay toplamı — gelecekteki aylar atlanır. */
export async function fetchWebstoreAylikSeri(base: string, yil?: number): Promise<WebstoreSeri> {
  const bugun = bugunUtc();
  const hedefYil = yil ?? bugun.getUTCFullYear();

  const aylar: { ay: number; baslangic: Date; bitis: Date }[] = [];
  for (let ay = 1; ay <= 12; ay++) {
    const ayBaslangic = new Date(Date.UTC(hedefYil, ay - 1, 1));
    if (ayBaslangic > bugun) break; // gelecekteki aylar
    const aySonGun = new Date(Date.UTC(hedefYil, ay, 0));
    const bitis = aySonGun > bugun ? bugun : aySonGun;
    aylar.push({ ay, baslangic: ayBaslangic, bitis });
  }

  const noktalar = await Promise.all(
    aylar.map((a) =>
      noktaHesapla(base, `${hedefYil}-${a.ay}`, TAM_AY_ADLARI[a.ay - 1].slice(0, 3), a.baslangic, a.bitis)
    )
  );

  return {
    granularite: "aylik",
    baslik: `${hedefYil} — Aylık`,
    noktalar,
    toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
  };
}

/** Bugünü içeren haftadan geriye doğru son `haftaSayisi` hafta (Pazartesi–Pazar). */
export async function fetchWebstoreHaftalikSeri(
  base: string,
  haftaSayisi: number = 12
): Promise<WebstoreSeri> {
  const bugun = bugunUtc();
  const haftaGunu = (bugun.getUTCDay() + 6) % 7;
  const buHaftaBaslangic = new Date(bugun);
  buHaftaBaslangic.setUTCDate(buHaftaBaslangic.getUTCDate() - haftaGunu);

  const haftalar: { baslangic: Date; bitis: Date }[] = [];
  for (let i = haftaSayisi - 1; i >= 0; i--) {
    const b = new Date(buHaftaBaslangic);
    b.setUTCDate(b.getUTCDate() - i * 7);
    const s = new Date(b);
    s.setUTCDate(s.getUTCDate() + 6);
    haftalar.push({ baslangic: b, bitis: s > bugun ? bugun : s });
  }

  const noktalar = await Promise.all(
    haftalar.map((h) =>
      noktaHesapla(
        base,
        fmt(h.baslangic),
        `${String(h.baslangic.getUTCDate()).padStart(2, "0")}.${String(h.baslangic.getUTCMonth() + 1).padStart(2, "0")}`,
        h.baslangic,
        h.bitis
      )
    )
  );

  return {
    granularite: "haftalik",
    baslik: `Son ${haftaSayisi} Hafta`,
    noktalar,
    toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
  };
}

/** Logo'daki en eski faturadan bugüne, yıl yıl toplam (en fazla son 6 yıl). */
export async function fetchWebstoreYillikSeri(base: string): Promise<WebstoreSeri> {
  const bugun = bugunUtc();
  let baslangicYil = bugun.getUTCFullYear() - 5;

  try {
    const durum = await fetchLogoDurum(base);
    const eskiYilStr = gunAnahtari(durum.en_eski_fatura).slice(0, 4);
    const eskiYil = Number(eskiYilStr);
    if (Number.isInteger(eskiYil) && eskiYil > 2000) {
      baslangicYil = Math.max(eskiYil, bugun.getUTCFullYear() - 5);
    }
  } catch {
    // /logo/durum alınamazsa son 6 yılla devam edilir.
  }

  const yillar: number[] = [];
  for (let yil = baslangicYil; yil <= bugun.getUTCFullYear(); yil++) yillar.push(yil);

  const noktalar = await Promise.all(
    yillar.map((yil) => {
      const baslangic = new Date(Date.UTC(yil, 0, 1));
      const sonGun = new Date(Date.UTC(yil, 11, 31));
      const bitis = sonGun > bugun ? bugun : sonGun;
      return noktaHesapla(base, String(yil), String(yil), baslangic, bitis);
    })
  );

  return {
    granularite: "yillik",
    baslik: "Yıllık",
    noktalar,
    toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
  };
}
