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

// NOT: aşağıdaki dört sabit `export` edilmiştir çünkü src/lib/kutu-report.ts
// da (Kutu Trendi'ndeki "web mağaza payı" kırılımı için) aynı kanal/şirket
// eşlemesini kullanıyor — kanal kodları tek bir yerde (burada) tanımlı
// kalsın diye, kopyalanmıyor.

export const SIRKET = "Holimer";

export const KENDI_SITE_KODLARI = ["9.HOLISTIK.COM", "9.TICIMAX"];

export const PAZARYERLERI: { kod: string; ad: string }[] = [
  { kod: "9.H.TRENDYOL", ad: "Trendyol" },
  { kod: "9.H.HEPSIBURADA", ad: "Hepsiburada" },
  { kod: "9.H.AMAZON", ad: "Amazon" },
  { kod: "9.H.PAZARAMA", ad: "Pazarama" },
  { kod: "9.H.PTT", ad: "PTT AVM" },
  { kod: "9.H.N11", ad: "N11" },
  { kod: "9.H.IDEFIX", ad: "Idefix" },
];

export const TUM_KANAL_KODLARI = [...KENDI_SITE_KODLARI, ...PAZARYERLERI.map((p) => p.kod)];

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

/** Bir kanalın verilen aralıktaki satırlarını güne göre gruplar. `sayfaLimiti` çağırana göre değişir (bkz. çağrı yerlerindeki yorumlar — uzun dönemler daha yüksek sınır ister). */
async function kanalGunlukHamVeriden(
  base: string,
  cariKodu: string,
  baslangic: string,
  bitis: string,
  sayfaLimiti: number
): Promise<Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>> {
  const gunMap = new Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>();
  let offset = 0;
  const limit = 1000;

  for (let sayfa = 0; sayfa < sayfaLimiti; sayfa++) {
    const veri = await fetchSatislar(base, { baslangic, bitis, cariKodu, limit, offset });
    for (const satir of veri.satirlar) {
      const gun = gunAnahtari(satir.tarihi);
      const mevcut = gunMap.get(gun) ?? { tutar: 0, kutuAdedi: 0, faturaSet: new Set<string>() };
      mevcut.tutar += satir.toplami;
      mevcut.kutuAdedi += satir.miktar;
      mevcut.faturaSet.add(satir.fatura_numarasi);
      gunMap.set(gun, mevcut);
    }
    if (veri.satirlar.length < limit) break;
    offset += limit;
  }

  return gunMap;
}

/**
 * Bir kanal grubunun (kendi site VEYA pazaryerleri) verilen aralıktaki
 * TÜM ham verisini bir kez çekip güne göre birleştirir. Bu, seri
 * fonksiyonlarında (haftalık/aylık/yıllık) nokta başına değil TEK seferde
 * çağrılır — sonra her nokta kendi [baslangic, bitis] aralığını bu haritadan
 * toplar (bkz. araliktaTopla). Bir kanal başarısız olursa (ağ/HTTP hatası)
 * o kanal sessizce 0 katkı yapar — TÜM grubu/seriyi düşürmemek için (bkz.
 * kanalToplamiHamVeriden'daki aynı "hata yutma" deseni).
 */
async function kanalGrubuGunlukToplamHaritasi(
  base: string,
  kodlar: string[],
  baslangic: string,
  bitis: string,
  sayfaLimiti: number
): Promise<Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>> {
  const kanalSonuclari = await Promise.all(
    kodlar.map((kod) =>
      kanalGunlukHamVeriden(base, kod, baslangic, bitis, sayfaLimiti).catch((err) => {
        console.error(`[webstore-report] kanal ${kod} için ham veri (kutu) alınamadı:`, err);
        return new Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>();
      })
    )
  );

  const birlesik = new Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>();
  for (const kanalMap of kanalSonuclari) {
    for (const [gun, v] of kanalMap) {
      const mevcut = birlesik.get(gun) ?? { tutar: 0, kutuAdedi: 0, faturaSet: new Set<string>() };
      mevcut.tutar += v.tutar;
      mevcut.kutuAdedi += v.kutuAdedi;
      v.faturaSet.forEach((f) => mevcut.faturaSet.add(f));
      birlesik.set(gun, mevcut);
    }
  }
  return birlesik;
}

/** [baslangic, bitis] (dahil) aralığındaki günlük kutu adedini bir günlük haritadan toplar. */
function haritadanKutuTopla(
  harita: Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>,
  baslangic: string,
  bitis: string
): number {
  let toplam = 0;
  for (const [gun, v] of harita) {
    if (gun >= baslangic && gun <= bitis) toplam += v.kutuAdedi;
  }
  return toplam;
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
      kanalGunlukHamVeriden(base, kod, baslangic, bitis, 60).catch(
        () => new Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>()
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
    let kendiSiteKutuAdedi = 0;
    let pazaryerleriKutuAdedi = 0;
    const faturaSet = new Set<string>();

    kendiSiteIdxler.forEach((idx) => {
      const g = kanalSonuclari[idx].get(tarih);
      if (g) {
        kendiSiteToplam += g.tutar;
        kendiSiteKutuAdedi += g.kutuAdedi;
        g.faturaSet.forEach((f) => faturaSet.add(f));
      }
    });
    pazaryeriIdxler.forEach((idx) => {
      const g = kanalSonuclari[idx].get(tarih);
      if (g) {
        pazaryerleriToplam += g.tutar;
        pazaryerleriKutuAdedi += g.kutuAdedi;
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
      kutuAdedi: kendiSiteKutuAdedi + pazaryerleriKutuAdedi,
      kendiSiteKutuAdedi,
      pazaryerleriKutuAdedi,
      ciroKutuKendiSite: kendiSiteKutuAdedi > 0 ? kendiSiteToplam / kendiSiteKutuAdedi : null,
      ciroKutuPazaryerleri: pazaryerleriKutuAdedi > 0 ? pazaryerleriToplam / pazaryerleriKutuAdedi : null,
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
//
// Ciro (genelToplam/kendiSiteToplam/pazaryerleriToplam): "hızlı yol"
// (kanalToplamlariniGetir(..., false)) kullanır — matrah/kdv kırılımı yok,
// sadece KDV dahil toplam. Uzun bir zaman aralığında çok sayıda nokta
// çekildiği için (12 ay, 12 hafta, birkaç yıl) performans amaçlı böyle
// tasarlandı; kısa dönem kartlarındaki (bugün/hafta/ay) detaylı matrah
// hesaplamasıyla karıştırılmamalı.
//
// Kutu (miktar): /logo/satislar/ozet kanal bazlı miktar vermediği için TEK
// yol ham fatura satırlarını sayfalamak — ama nokta başına değil, TÜM seri
// aralığı için TEK seferde (bkz. noktalaraKutuEkle / kanalGrubuGunlukToplamHaritasi),
// sonra her noktaya güne göre yeniden dağıtılır. Bu, Günlük Detay'daki
// (gunlukSeriHesapla) aynı deseninin haftalık/aylık/yıllık'a genişletilmiş
// hali — ciro hesabından bağımsız, WebstoreSeri.kutuHesaplandi ile ayrı
// izlenir (ciro her zaman gerçek kalır, kutu fetch'i başarısız olsa bile).
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
      // Kutu alanları burada değil, ayrı bir geçişte (noktayaKutuEkle) doldurulur —
      // bkz. fetchWebstore{Aylik,Haftalik,Yillik}Seri ve WebstoreSeri.kutuHesaplandi.
      kendiSiteKutuAdedi: 0,
      pazaryerleriKutuAdedi: 0,
      ciroKutuKendiSite: null,
      ciroKutuPazaryerleri: null,
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
      kendiSiteKutuAdedi: 0,
      pazaryerleriKutuAdedi: 0,
      ciroKutuKendiSite: null,
      ciroKutuPazaryerleri: null,
    };
  }
}

/**
 * Önceden çekilmiş kanal-grubu günlük haritalarından, tek bir noktanın
 * [baslangic, bitis] aralığına düşen kutu adedini toplayıp noktaya ekler.
 * Saf senkron bir birleştirme — ayrı bir ağ çağrısı yapmaz.
 */
function noktayaKutuEkle(
  nokta: WebstoreSeriNoktasi,
  kendiSiteHarita: Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>,
  pazaryerleriHarita: Map<string, { tutar: number; kutuAdedi: number; faturaSet: Set<string> }>
): WebstoreSeriNoktasi {
  if (nokta.veriAlinamadi) return nokta;
  const kendiSiteKutuAdedi = haritadanKutuTopla(kendiSiteHarita, nokta.baslangic, nokta.bitis);
  const pazaryerleriKutuAdedi = haritadanKutuTopla(pazaryerleriHarita, nokta.baslangic, nokta.bitis);
  return {
    ...nokta,
    kendiSiteKutuAdedi,
    pazaryerleriKutuAdedi,
    ciroKutuKendiSite: kendiSiteKutuAdedi > 0 ? nokta.kendiSiteToplam / kendiSiteKutuAdedi : null,
    ciroKutuPazaryerleri:
      pazaryerleriKutuAdedi > 0 ? nokta.pazaryerleriToplam / pazaryerleriKutuAdedi : null,
  };
}

/**
 * Bir serinin TÜM noktalarını kapsayan kutu (miktar) verisini TEK seferde
 * çeker (nokta başına değil — bkz. kanalGrubuGunlukToplamHaritasi) ve her
 * noktaya dağıtır. Grup fetch'i tamamen başarısız olursa (ör. ağ hatası)
 * `kutuHesaplandi: false` ile orijinal noktalar (kutu alanları 0/null)
 * değiştirilmeden döner — rakam uydurmamak için.
 */
async function noktalaraKutuEkle(
  base: string,
  noktalar: WebstoreSeriNoktasi[],
  genelBaslangic: string,
  genelBitis: string,
  sayfaLimiti: number
): Promise<{ noktalar: WebstoreSeriNoktasi[]; kutuHesaplandi: boolean }> {
  if (noktalar.length === 0) return { noktalar, kutuHesaplandi: false };
  try {
    const [kendiSiteHarita, pazaryerleriHarita] = await Promise.all([
      kanalGrubuGunlukToplamHaritasi(base, KENDI_SITE_KODLARI, genelBaslangic, genelBitis, sayfaLimiti),
      kanalGrubuGunlukToplamHaritasi(
        base,
        PAZARYERLERI.map((p) => p.kod),
        genelBaslangic,
        genelBitis,
        sayfaLimiti
      ),
    ]);
    return {
      noktalar: noktalar.map((n) => noktayaKutuEkle(n, kendiSiteHarita, pazaryerleriHarita)),
      kutuHesaplandi: true,
    };
  } catch (err) {
    console.error("[webstore-report] kutu (miktar) verisi hesaplanamadı, bu seride gösterilmeyecek:", err);
    return { noktalar, kutuHesaplandi: false };
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

  const noktalarHam = await Promise.all(
    aylar.map((a) =>
      noktaHesapla(base, `${hedefYil}-${a.ay}`, TAM_AY_ADLARI[a.ay - 1].slice(0, 3), a.baslangic, a.bitis)
    )
  );

  // Kutu (miktar) verisi: seçilen yılın TAMAMI için 9 kanalın ham verisi TEK
  // seferde çekilir (nokta başına değil) — bkz. noktalaraKutuEkle. Tam yıl
  // olduğu için sayfa sınırı Günlük Detay'daki (60/ay) orana göre yüksek
  // tutuluyor; gerçek hacim bu sınırın çok altında kalıyor olsa da güvenlik
  // payı olarak böyle bırakıldı.
  const { noktalar, kutuHesaplandi } = await noktalaraKutuEkle(
    base,
    noktalarHam,
    fmt(aylar[0]?.baslangic ?? bugun),
    fmt(aylar[aylar.length - 1]?.bitis ?? bugun),
    600
  );

  return {
    granularite: "aylik",
    baslik: `${hedefYil} — Aylık`,
    noktalar,
    toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
    kutuHesaplandi,
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

  const noktalarHam = await Promise.all(
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

  // Kutu (miktar) verisi: seçilen tüm hafta aralığı (ör. son 12 hafta ~84
  // gün) için TEK seferde — bkz. noktalaraKutuEkle üstündeki not.
  const { noktalar, kutuHesaplandi } =
    haftalar.length > 0
      ? await noktalaraKutuEkle(
          base,
          noktalarHam,
          fmt(haftalar[0].baslangic),
          fmt(haftalar[haftalar.length - 1].bitis),
          150
        )
      : { noktalar: noktalarHam, kutuHesaplandi: false };

  return {
    granularite: "haftalik",
    baslik: `Son ${haftaSayisi} Hafta`,
    noktalar,
    toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
    kutuHesaplandi,
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

  const noktalarHam = await Promise.all(
    yillar.map((yil) => {
      const baslangic = new Date(Date.UTC(yil, 0, 1));
      const sonGun = new Date(Date.UTC(yil, 11, 31));
      const bitis = sonGun > bugun ? bugun : sonGun;
      return noktaHesapla(base, String(yil), String(yil), baslangic, bitis);
    })
  );

  // Kutu (miktar) verisi: en fazla 6 yıllık aralık için TEK seferde — bkz.
  // noktalaraKutuEkle üstündeki not. Bu en uzun aralık olduğu için sayfa
  // sınırı da en yüksek tutuluyor; yine de güvenlik sınırı olarak
  // düşünülmeli, gerçek hacmin çok üzerinde.
  const ilkYil = yillar[0] ?? bugun.getUTCFullYear();
  const sonYilBitis = new Date(Date.UTC(yillar[yillar.length - 1] ?? bugun.getUTCFullYear(), 11, 31));
  const { noktalar, kutuHesaplandi } = await noktalaraKutuEkle(
    base,
    noktalarHam,
    fmt(new Date(Date.UTC(ilkYil, 0, 1))),
    fmt(sonYilBitis > bugun ? bugun : sonYilBitis),
    1500
  );

  return {
    granularite: "yillik",
    baslik: "Yıllık",
    noktalar,
    toplam: noktalar.reduce((s, n) => s + n.genelToplam, 0),
    kutuHesaplandi,
  };
}
