// "Kutu Trendi" — TÜM şirketler (Holimer + Fw İlaç, konsolide) için
// günlük/haftalık/aylık/yıllık satılan kutu (miktar/birim) adedi, kutu
// başına ciro rasyosu VE şirket bazlı kırılım. GERÇEK Logo verisidir.
//
// Web Mağaza'dan (webstore-report.ts) farklı olarak burada kanal/cari
// kırılımı YOK, sadece ŞİRKET kırılımı var — /logo/satislar/ozet'in "genel"
// toplamı, her şirket için ayrı ayrı (sirket parametresiyle) çekilip
// toplanıyor. Şirket listesi /logo/durum'dan dinamik alınır (hardcode
// değil) — Fw İlaç'ın STB A.Ş.'ye devri gibi değişiklikler otomatik yansır.
//
// ÖNEMLİ — çift sayım notu: Şirketler arası satışlar (varsa) her iki
// şirketin kendi toplamında da görünüp konsolide toplamda çift sayılmış
// olabilir (bkz. proje genelindeki SOUL.md kuralı). Bu rapor şirket bazlı
// ayrımı gösterdiği için en azından hangi şirketin ne kadar katkı yaptığı
// görünür kılınıyor.
//
// Kutu adedi tanımı: fatura satırlarındaki miktar/birim toplamı
// (/logo/satislar/ozet -> genel.toplam_miktar). Ürün bazlı "1 adet = kaç
// kutu" çarpanı Logo'da ayrı bir alan olarak yok; bu yüzden miktar
// doğrudan kutu adedi olarak kabul edilir.

import { fetchLogoDurum, fetchSatislar, fetchSatislarOzet } from "./logo-api";
import { fetchTcmbKur, kurOrtaDegerleri } from "./kur-api";
import { KutuSeri, KutuSeriNoktasi, KutuSirketPay, KutuWebMagazaPay } from "./kutu-types";
import { SIRKET as WEB_MAGAZA_SIRKET_ADI, TUM_KANAL_KODLARI } from "./webstore-report";

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

const GUN_KISALTMALARI = ["Pz", "Pt", "Sl", "Çr", "Pr", "Cm", "Ct"];

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bugunUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** /logo/durum'dan şirket listesini çeker; alınamazsa bilinen son iki şirkete düşer (arayüz yine de kırılımı göstermeye çalışsın diye). */
async function sirketListesiniGetir(base: string): Promise<string[]> {
  try {
    const durum = await fetchLogoDurum(base);
    const isimler = durum.sirketler.map((s) => s.sirket).filter(Boolean);
    if (isimler.length > 0) return isimler;
  } catch {
    // aşağıdaki varsayılana düş
  }
  return ["Holimer", "Fw İlaç"];
}

// ---------------------------------------------------------------------------
// Web mağaza (e-ticaret) payı — "Kutu Trendi"nin şirket kırılımı içinde,
// Holimer'ın toplamının ne kadarının web mağaza (holistikmarket.com +
// pazaryerleri, bkz. webstore-report.ts) kanallarından geldiğini gösterir.
//
// /logo/satislar/ozet kanal/cari bazlı miktar (kutu) vermiyor — sadece genel
// toplamı ve "en çok alan cariler" listesini (miktar olmadan, sadece tutar)
// veriyor. Bu yüzden kutu adedi kırılımı için TEK yol ham fatura satırlarını
// (/logo/satislar, cari_kodu filtresiyle) sayfalayıp miktar alanını toplamak.
//
// Performans: bu ham satır sayfalaması, webstore-report.ts'teki
// gunlukSeriHesapla ile aynı desende — TÜM dönem aralığı için 9 kanalın
// TAMAMI bir kez çekilir, güne göre gruplanır, sonra her seri noktasına
// (gün/hafta) yeniden dağıtılır (nokta başına ayrı çağrı YAPILMAZ). Yine de
// Aylık (tam yıl) ve Yıllık (çoklu yıl) için bu hacim çok büyüyeceğinden
// SADECE Günlük ve Haftalık'ta hesaplanır (bkz. KutuSeri.webMagazaHesaplandi).
// ---------------------------------------------------------------------------

/** Logo'dan gelen tarih hem "YYYY-MM-DD[...]" hem "GG.AA.YYYY" olabilir — ikisini de güvenle günlük anahtara çevirir. */
function gunAnahtari(tarihi: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(tarihi)) return tarihi.slice(0, 10);
  const m = tarihi.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return tarihi.slice(0, 10);
}

/** Bir web mağaza kanalının verilen aralıktaki satırlarını güne göre gruplar (hem kutu adedi/miktar hem ciro). */
async function webMagazaKanaliGunlukHamVeriden(
  base: string,
  cariKodu: string,
  baslangic: string,
  bitis: string,
  sayfaLimiti: number
): Promise<Map<string, KutuWebMagazaPay>> {
  const gunMap = new Map<string, KutuWebMagazaPay>();
  let offset = 0;
  const limit = 1000;

  for (let sayfa = 0; sayfa < sayfaLimiti; sayfa++) {
    const veri = await fetchSatislar(base, { baslangic, bitis, cariKodu, limit, offset });
    for (const satir of veri.satirlar) {
      const gun = gunAnahtari(satir.tarihi);
      const mevcut = gunMap.get(gun) ?? { kutuAdedi: 0, ciroTl: 0 };
      mevcut.kutuAdedi += satir.miktar;
      mevcut.ciroTl += satir.toplami;
      gunMap.set(gun, mevcut);
    }
    if (veri.satirlar.length < limit) break;
    offset += limit;
  }

  return gunMap;
}

/** 9 web mağaza kanalının TAMAMI için ham veriyi bir kez çekip güne göre birleştirir. */
async function webMagazaGunlukToplamHaritasi(
  base: string,
  baslangic: string,
  bitis: string,
  sayfaLimiti: number
): Promise<Map<string, KutuWebMagazaPay>> {
  const kanalSonuclari = await Promise.all(
    TUM_KANAL_KODLARI.map((kod) =>
      webMagazaKanaliGunlukHamVeriden(base, kod, baslangic, bitis, sayfaLimiti).catch((err) => {
        console.error(`[kutu-report] web mağaza kanalı ${kod} için veri alınamadı:`, err);
        return new Map<string, KutuWebMagazaPay>();
      })
    )
  );

  const birlesik = new Map<string, KutuWebMagazaPay>();
  for (const kanalMap of kanalSonuclari) {
    for (const [gun, v] of kanalMap) {
      const mevcut = birlesik.get(gun) ?? { kutuAdedi: 0, ciroTl: 0 };
      mevcut.kutuAdedi += v.kutuAdedi;
      mevcut.ciroTl += v.ciroTl;
      birlesik.set(gun, mevcut);
    }
  }
  return birlesik;
}

/** [baslangic, bitis] (dahil) aralığındaki günlük web mağaza toplamlarını toplar. */
function webMagazaAraligiTopla(
  harita: Map<string, KutuWebMagazaPay>,
  baslangic: string,
  bitis: string
): KutuWebMagazaPay {
  const toplam: KutuWebMagazaPay = { kutuAdedi: 0, ciroTl: 0 };
  for (const [gun, v] of harita) {
    if (gun >= baslangic && gun <= bitis) {
      toplam.kutuAdedi += v.kutuAdedi;
      toplam.ciroTl += v.ciroTl;
    }
  }
  return toplam;
}

/**
 * Seri noktalarına (varsa) web mağaza payını ekler. Hiçbir şirket
 * WEB_MAGAZA_SIRKET_ADI (Holimer) ile eşleşmiyorsa veya ham veri çekimi
 * başarısız olursa `hesaplandi: false` döner — noktalar DEĞİŞTİRİLMEDEN
 * geri verilir (kısmi/yanlış bir kırılımı gerçekmiş gibi göstermemek için).
 */
async function sirketlereWebMagazaEkle(
  base: string,
  noktalar: KutuSeriNoktasi[],
  seriBaslangic: string,
  seriBitis: string,
  sayfaLimiti: number
): Promise<{ noktalar: KutuSeriNoktasi[]; hesaplandi: boolean }> {
  const ilgiliVar = noktalar.some(
    (n) => !n.veriAlinamadi && n.sirketler.some((s) => s.sirket === WEB_MAGAZA_SIRKET_ADI)
  );
  if (!ilgiliVar) return { noktalar, hesaplandi: false };

  try {
    const harita = await webMagazaGunlukToplamHaritasi(base, seriBaslangic, seriBitis, sayfaLimiti);
    const guncellenmis = noktalar.map((n) => {
      if (n.veriAlinamadi) return n;
      const sirketler = n.sirketler.map((s) => {
        if (s.sirket !== WEB_MAGAZA_SIRKET_ADI) return s;
        return { ...s, webMagaza: webMagazaAraligiTopla(harita, n.baslangic, n.bitis) };
      });
      return { ...n, sirketler };
    });
    return { noktalar: guncellenmis, hesaplandi: true };
  } catch (err) {
    console.error("[kutu-report] web mağaza kırılımı hesaplanamadı, bu görünümde gösterilmeyecek:", err);
    return { noktalar, hesaplandi: false };
  }
}

/**
 * Bir dönem noktasını, şirket bazlı kırılımıyla birlikte hesaplar. Her
 * şirket için ayrı bir /logo/satislar/ozet çağrısı yapılır (paralel);
 * TÜMÜ toplamı bunların toplanmasıyla elde edilir (ayrıca bir "TÜMÜ"
 * çağrısı yapılmaz — gereksiz, çünkü toplam zaten şirketlerin toplamına
 * eşit olmalı).
 *
 * Şirketlerden biri bile başarısız olursa TÜM nokta `veriAlinamadi: true`
 * ile işaretlenir — kısmi/yanlış bir toplamı gerçekmiş gibi göstermemek için
 * (bkz. webstore-report.ts'teki aynı "hata yutma" deseni, burada daha
 * katı: kısmi veri de tehlikeli olduğu için tamamı reddediliyor).
 */
async function noktaHesapla(
  base: string,
  key: string,
  label: string,
  baslangicDate: Date,
  bitisDate: Date,
  kurOrta: { usd: number | null; eur: number | null },
  sirketListesi: string[]
): Promise<KutuSeriNoktasi> {
  const baslangic = fmt(baslangicDate);
  const bitis = fmt(bitisDate);

  const sonuclar = await Promise.all(
    sirketListesi.map((sirket) =>
      fetchSatislarOzet(base, { baslangic, bitis, sirket, ilkN: 1 })
        .then((ozet): KutuSirketPay & { hata: false } => ({
          sirket,
          kutuAdedi: ozet.genel.toplam_miktar,
          ciroTl: ozet.genel.toplam_tutar,
          hata: false,
        }))
        .catch((err): KutuSirketPay & { hata: true } => {
          console.error(`[kutu-report] ${key} / ${sirket} için veri alınamadı:`, err);
          return { sirket, kutuAdedi: 0, ciroTl: 0, hata: true };
        })
    )
  );

  if (sonuclar.some((r) => r.hata)) {
    return {
      key,
      label,
      baslangic,
      bitis,
      kutuAdedi: 0,
      ciroTl: 0,
      ciroKutuTl: null,
      ciroKutuEur: null,
      ciroKutuUsd: null,
      sirketler: [],
      veriAlinamadi: true,
    };
  }

  const sirketler: KutuSirketPay[] = sonuclar.map(({ sirket, kutuAdedi, ciroTl }) => ({
    sirket,
    kutuAdedi,
    ciroTl,
  }));
  const kutuAdedi = sirketler.reduce((s, r) => s + r.kutuAdedi, 0);
  const ciroTl = sirketler.reduce((s, r) => s + r.ciroTl, 0);
  const ciroKutuTl = kutuAdedi > 0 ? ciroTl / kutuAdedi : null;

  return {
    key,
    label,
    baslangic,
    bitis,
    kutuAdedi,
    ciroTl,
    ciroKutuTl,
    ciroKutuEur: ciroKutuTl !== null && kurOrta.eur ? ciroKutuTl / kurOrta.eur : null,
    ciroKutuUsd: ciroKutuTl !== null && kurOrta.usd ? ciroKutuTl / kurOrta.usd : null,
    sirketler,
  };
}

function seriToplamlariniHesapla(noktalar: KutuSeriNoktasi[]) {
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

/** Seçilen ay için gün gün kutu adedi + ciro/kutu serisi (varsayılan: içinde bulunulan ay). */
export async function fetchKutuGunlukSeri(
  base: string,
  yil?: number,
  ay?: number
): Promise<KutuSeri> {
  const bugun = bugunUtc();
  const hedefYil = yil ?? bugun.getUTCFullYear();
  const hedefAy = ay ?? bugun.getUTCMonth() + 1;

  const [kur, sirketListesi] = await Promise.all([fetchTcmbKur(), sirketListesiniGetir(base)]);
  const kurOrta = kurOrtaDegerleri(kur);

  const ayBaslangicDate = new Date(Date.UTC(hedefYil, hedefAy - 1, 1));
  const aySonGunDate = new Date(Date.UTC(hedefYil, hedefAy, 0));
  const bitisSinir = aySonGunDate > bugun ? bugun : aySonGunDate;

  const gunler: Date[] = [];
  if (ayBaslangicDate <= bitisSinir) {
    for (let d = new Date(ayBaslangicDate); d <= bitisSinir; d.setUTCDate(d.getUTCDate() + 1)) {
      gunler.push(new Date(d));
    }
  }

  const noktalarHam = await Promise.all(
    gunler.map((tarih) => {
      const label = `${String(tarih.getUTCDate()).padStart(2, "0")}.${String(tarih.getUTCMonth() + 1).padStart(2, "0")} ${GUN_KISALTMALARI[tarih.getUTCDay()]}`;
      return noktaHesapla(base, fmt(tarih), label, tarih, tarih, kurOrta, sirketListesi);
    })
  );

  // Web mağaza payı: tüm ay için ham satır çekimi tek seferde (nokta başına değil).
  const { noktalar, hesaplandi: webMagazaHesaplandi } = await sirketlereWebMagazaEkle(
    base,
    noktalarHam,
    fmt(ayBaslangicDate),
    fmt(bitisSinir),
    60
  );

  return {
    granularite: "gunluk",
    baslik: `${TAM_AY_ADLARI[hedefAy - 1]} ${hedefYil} — Günlük`,
    aciklama: "Seçilen ayın gün gün toplam satılan kutu adedi ve kutu başına ciro (TÜMÜ şirketler, konsolide).",
    noktalar,
    kur,
    webMagazaHesaplandi,
    ...seriToplamlariniHesapla(noktalar),
  };
}

/** Bugünü içeren haftadan geriye doğru son `haftaSayisi` hafta (Pazartesi–Pazar). */
export async function fetchKutuHaftalikSeri(
  base: string,
  haftaSayisi: number = 12
): Promise<KutuSeri> {
  const bugun = bugunUtc();
  const haftaGunu = (bugun.getUTCDay() + 6) % 7; // Pazartesi=0
  const buHaftaBaslangic = new Date(bugun);
  buHaftaBaslangic.setUTCDate(buHaftaBaslangic.getUTCDate() - haftaGunu);

  const [kur, sirketListesi] = await Promise.all([fetchTcmbKur(), sirketListesiniGetir(base)]);
  const kurOrta = kurOrtaDegerleri(kur);

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
        h.bitis,
        kurOrta,
        sirketListesi
      )
    )
  );

  // Web mağaza payı: seçilen tüm hafta aralığı (ör. son 12 hafta ~84 gün) için
  // ham satır çekimi tek seferde — bkz. sirketlereWebMagazaEkle üstündeki not.
  const { noktalar, hesaplandi: webMagazaHesaplandi } =
    haftalar.length > 0
      ? await sirketlereWebMagazaEkle(
          base,
          noktalarHam,
          fmt(haftalar[0].baslangic),
          fmt(haftalar[haftalar.length - 1].bitis),
          150
        )
      : { noktalar: noktalarHam, hesaplandi: false };

  return {
    granularite: "haftalik",
    baslik: `Son ${haftaSayisi} Hafta — Haftalık`,
    aciklama: "Pazartesi–Pazar hafta bazında toplam satılan kutu adedi ve kutu başına ciro (TÜMÜ şirketler, konsolide).",
    noktalar,
    kur,
    webMagazaHesaplandi,
    ...seriToplamlariniHesapla(noktalar),
  };
}

/** Seçilen yılın (varsayılan: bu yıl) ay ay kutu adedi + ciro/kutu serisi — gelecekteki aylar atlanır. */
export async function fetchKutuAylikSeri(base: string, yil?: number): Promise<KutuSeri> {
  const bugun = bugunUtc();
  const hedefYil = yil ?? bugun.getUTCFullYear();

  const [kur, sirketListesi] = await Promise.all([fetchTcmbKur(), sirketListesiniGetir(base)]);
  const kurOrta = kurOrtaDegerleri(kur);

  const aylar: { ay: number; baslangic: Date; bitis: Date }[] = [];
  for (let ay = 1; ay <= 12; ay++) {
    const ayBaslangic = new Date(Date.UTC(hedefYil, ay - 1, 1));
    if (ayBaslangic > bugun) break;
    const aySonGun = new Date(Date.UTC(hedefYil, ay, 0));
    const bitis = aySonGun > bugun ? bugun : aySonGun;
    aylar.push({ ay, baslangic: ayBaslangic, bitis });
  }

  const noktalar = await Promise.all(
    aylar.map((a) =>
      noktaHesapla(
        base,
        `${hedefYil}-${a.ay}`,
        TAM_AY_ADLARI[a.ay - 1].slice(0, 3),
        a.baslangic,
        a.bitis,
        kurOrta,
        sirketListesi
      )
    )
  );

  return {
    granularite: "aylik",
    baslik: `${hedefYil} — Aylık`,
    aciklama: "Seçilen yılın ay ay toplam satılan kutu adedi ve kutu başına ciro (TÜMÜ şirketler, konsolide).",
    noktalar,
    kur,
    // Web mağaza payı Aylık'ta hesaplanmıyor — tam yıl için 9 kanalın ham
    // satırlarını sayfalamak performans açısından riskli (bkz. dosya başındaki not).
    webMagazaHesaplandi: false,
    ...seriToplamlariniHesapla(noktalar),
  };
}

/** Logo'daki en eski faturadan bugüne, yıl yıl kutu adedi + ciro/kutu serisi (en fazla son 6 yıl). */
export async function fetchKutuYillikSeri(base: string): Promise<KutuSeri> {
  const bugun = bugunUtc();
  let baslangicYil = bugun.getUTCFullYear() - 5;
  let mirrorBaslangicNotu = "";

  const [kur, sirketListesi, durum] = await Promise.all([
    fetchTcmbKur(),
    sirketListesiniGetir(base),
    fetchLogoDurum(base).catch(() => null),
  ]);
  const kurOrta = kurOrtaDegerleri(kur);

  if (durum) {
    const eskiYilStr = durum.en_eski_fatura.slice(0, 4);
    const eskiYil = Number(eskiYilStr);
    if (Number.isInteger(eskiYil) && eskiYil > 2000) {
      baslangicYil = Math.max(eskiYil, bugun.getUTCFullYear() - 5);
      mirrorBaslangicNotu = durum.en_eski_fatura;
    }
  }

  const yillar: number[] = [];
  for (let yil = baslangicYil; yil <= bugun.getUTCFullYear(); yil++) yillar.push(yil);

  const noktalar = await Promise.all(
    yillar.map((yil) => {
      const baslangic = new Date(Date.UTC(yil, 0, 1));
      const sonGun = new Date(Date.UTC(yil, 11, 31));
      const bitis = sonGun > bugun ? bugun : sonGun;
      return noktaHesapla(base, String(yil), String(yil), baslangic, bitis, kurOrta, sirketListesi);
    })
  );

  const aciklama =
    yillar.length <= 1
      ? `Logo mirror veritabanında yalnızca ${mirrorBaslangicNotu || String(baslangicYil)} sonrası veri var — önceki yıllarla karşılaştırma şu an mümkün değil.`
      : "Logo'daki en eski faturadan bugüne, yıl yıl toplam satılan kutu adedi ve kutu başına ciro (TÜMÜ şirketler, konsolide).";

  return {
    granularite: "yillik",
    baslik: "Yıllık",
    aciklama,
    noktalar,
    kur,
    // Web mağaza payı Yıllık'ta hesaplanmıyor — çoklu yıl için 9 kanalın ham
    // satırlarını sayfalamak performans açısından riskli (bkz. dosya başındaki not).
    webMagazaHesaplandi: false,
    ...seriToplamlariniHesapla(noktalar),
  };
}
