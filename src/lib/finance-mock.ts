// ⚠️ DUMMY VERİ — bu dosyadaki rakamların büyük kısmı sahte örnek verilerdir.
// Ödemeler/Borçlar/Alacaklar/Banka/Harcamalar/Hata için Logo'da veri olsa da,
// bunları dışarı veren bir uç nokta henüz yok (bkz. README.md → "Finans
// Özeti (dummy)"). Gerçek entegrasyon eklendiğinde bu dosya yerine bir API
// route'u bağlanmalı; bileşenler aynı tipleri beklediği için değişiklik
// minimal olur.
//
// İSTİSNA — Tahsilatlar: danışman SQL Server'da VW_100_TAHSILATLAR view'ini
// paylaştı ve 03.08.2026 tarihinde bu view'den 2026 Ocak-Ağustos aylık
// toplamlarını sorguladı (bkz. TAHSILAT_2026_GERCEK). O sekiz ay için
// GERÇEK rakamlardır; FastAPI'de bu view'i dönen bir uç nokta henüz yok,
// bu yüzden hâlâ bu dosyada duruyor ama artık uydurma değil. Fiş bazlı
// satır verisi (kim, ne zaman, ne kadar ödedi) için henüz gerçek bir kaynak
// yok — TAHSILAT_ORNEK_SATIRLAR o yüzden hâlâ illüstratif örnektir.

import {
  BankAccount,
  FinanceMetric,
  Granularity,
  MetricKind,
  TahsilatSatiri,
  UpcomingItem,
} from "./finance-types";
import { MONTH_SHORT } from "./report-utils";
import { MONTHS } from "./types";

const SCALE: Record<Granularity, number> = {
  gunluk: 1 / 30,
  aylik: 1,
  yillik: 12,
};

// 12 aylık kabaca mevsimsel bir eğri (ortalaması ~1) — hâlâ tamamen dummy
// olan metriklerin trend grafiklerinde "doğal" bir iniş-çıkış taşıması için.
const SEASONAL = [0.82, 0.88, 0.95, 1.05, 1.1, 1.0, 0.9, 0.85, 0.95, 1.05, 1.15, 1.2];

function buildTrend(baseValue: number) {
  return MONTHS.map((m, i) => ({
    month: MONTH_SHORT[m],
    value: Math.round(baseValue * SEASONAL[i]),
  }));
}

// --- GERÇEK VERİ: Tahsilatlar (VW_100_TAHSILATLAR, danışmanın SQL sorgusu, 03.08.2026) ---
// SELECT Year(fistarih) YIL, month(fistarih) AY, SUM(Tutar) Tutar
//   FROM [TIGER3ENT].[dbo].[VW_100_TAHSILATLAR]
//   GROUP BY month(fistarih), Year(fistarih)
// Ağustos kısmi bir ay (sorgu ayın ilk günlerinde çekildi), Eylül-Aralık henüz
// gerçekleşmedi — bu yüzden trend grafiğinde bu aylar boş bırakılıyor.
const TAHSILAT_2026_GERCEK: number[] = [
  26_124_413.2, // Ocak
  18_905_941.18, // Şubat
  25_966_419.07, // Mart
  31_973_707.62, // Nisan
  23_958_225.57, // Mayıs
  18_828_577.85, // Haziran
  18_455_406.38, // Temmuz
  218_599.17, // Ağustos (kısmi ay)
];

const TAHSILAT_SON_TAM_AY = TAHSILAT_2026_GERCEK[6]; // Temmuz — son tamamlanmış ay
const TAHSILAT_ONCEKI_AY = TAHSILAT_2026_GERCEK[5]; // Haziran
const TAHSILAT_DELTA =
  ((TAHSILAT_SON_TAM_AY - TAHSILAT_ONCEKI_AY) / TAHSILAT_ONCEKI_AY) * 100;

function buildTahsilatTrend() {
  return MONTHS.map((m, i) => ({
    month: MONTH_SHORT[m],
    value: i < TAHSILAT_2026_GERCEK.length ? Math.round(TAHSILAT_2026_GERCEK[i]) : null,
  }));
}

// Fiş bazlı (satır) veri için henüz gerçek bir kaynak yok — VW_100_TAHSILATLAR
// sadece aylık toplam olarak sorgulandı. Aşağıdaki satırlar gerçek şemaya
// (IslemKod/FisTur/FisNo/FisTarih/FisAciklama/IslemYeriKod/IslemYeri/CariAd/
// CariKod/Tutar/ACIKLAMA/ISYERI) uygun ama içerik illüstratif örnektir.
function daysAgoIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const TAHSILAT_ORNEK_SATIRLAR: TahsilatSatiri[] = [
  {
    islemKod: "THS-014822",
    fisTur: "Tahsilat Fişi",
    fisNo: "TF-2026-01482",
    fisTarih: daysAgoIso(1),
    fisAciklama: "Pazaryeri tahsilatı",
    islemYeriKod: "PZY01",
    islemYeri: "Pazaryeri",
    cariAd: "Trendyol Elektronik Ticaret A.Ş.",
    cariKod: "120.01.045",
    tutar: 84_520.5,
    aciklama: "Havale/EFT",
    isyeri: "Merkez",
  },
  {
    islemKod: "THS-014810",
    fisTur: "Tahsilat Fişi",
    fisNo: "TF-2026-01470",
    fisTarih: daysAgoIso(2),
    fisAciklama: "Pazaryeri tahsilatı",
    islemYeriKod: "PZY02",
    islemYeri: "Pazaryeri",
    cariAd: "Hepsiburada.com Bilgi Teknolojileri A.Ş.",
    cariKod: "120.01.052",
    tutar: 61_340,
    aciklama: "Havale/EFT",
    isyeri: "Merkez",
  },
  {
    islemKod: "THS-014791",
    fisTur: "Tahsilat Fişi",
    fisNo: "TF-2026-01455",
    fisTarih: daysAgoIso(3),
    fisAciklama: "Cari tahsilat",
    islemYeriKod: "CRI01",
    islemYeri: "Cari Satış",
    cariAd: "Vital Sağlıklı Yaşam Ürünleri Ltd. Şti.",
    cariKod: "120.02.011",
    tutar: 22_750,
    aciklama: "Çek tahsili",
    isyeri: "Merkez",
  },
  {
    islemKod: "THS-014775",
    fisTur: "Tahsilat Fişi",
    fisNo: "TF-2026-01440",
    fisTarih: daysAgoIso(4),
    fisAciklama: "E-ticaret tahsilatı",
    islemYeriKod: "ETC01",
    islemYeri: "E-Ticaret",
    cariAd: "Amazon Türkiye",
    cariKod: "120.01.061",
    tutar: 15_980.25,
    aciklama: "Havale/EFT",
    isyeri: "Merkez",
  },
];

interface MetricSeed {
  key: FinanceMetric["key"];
  label: string;
  kind: MetricKind;
  monthlyValue: number;
  delta: number | null;
  detail: { label: string; monthlyValue: number }[];
  aging?: { label: string; ratio: number }[];
}

// Not: "tahsilatlar" artık aşağıda değil — ayrı olarak, gerçek veriden
// (TAHSILAT_2026_GERCEK) inşa ediliyor, bkz. getMockFinanceMetrics.
const SEEDS: MetricSeed[] = [
  {
    key: "odemeler",
    label: "Ödemeler",
    kind: "flow",
    monthlyValue: 4_250_000,
    delta: -6.2,
    detail: [
      { label: "Tedarikçi Ödemeleri", monthlyValue: 2_800_000 },
      { label: "Personel Ödemeleri", monthlyValue: 950_000 },
      { label: "Vergi / SGK", monthlyValue: 500_000 },
    ],
  },
  {
    key: "borclar",
    label: "Borçlar",
    kind: "stock",
    monthlyValue: 2_650_000,
    delta: 2.3,
    detail: [
      { label: "Tedarikçi Borcu", monthlyValue: 1_800_000 },
      { label: "Kredi Kartı Borcu", monthlyValue: 850_000 },
    ],
    aging: [
      { label: "Vadesi Gelmemiş", ratio: 0.58 },
      { label: "1-30 gün", ratio: 0.24 },
      { label: "31-60 gün", ratio: 0.11 },
      { label: "61-90 gün", ratio: 0.05 },
      { label: "90+ gün", ratio: 0.02 },
    ],
  },
  {
    key: "alacaklar",
    label: "Alacaklar",
    kind: "stock",
    monthlyValue: 3_400_000,
    delta: -1.4,
    detail: [
      { label: "Vadesi Geçmemiş", monthlyValue: 2_600_000 },
      { label: "Vadesi Geçmiş (30+ gün)", monthlyValue: 800_000 },
    ],
    aging: [
      { label: "Vadesi Geçmemiş", ratio: 0.55 },
      { label: "1-30 gün", ratio: 0.22 },
      { label: "31-60 gün", ratio: 0.12 },
      { label: "61-90 gün", ratio: 0.07 },
      { label: "90+ gün", ratio: 0.04 },
    ],
  },
  {
    key: "banka",
    label: "Banka",
    kind: "stock",
    monthlyValue: 6_800_000,
    delta: 3.5,
    detail: [
      { label: "İş Bankası", monthlyValue: 3_200_000 },
      { label: "Garanti BBVA", monthlyValue: 2_100_000 },
      { label: "Yapı Kredi", monthlyValue: 1_500_000 },
    ],
  },
  {
    key: "harcamalar",
    label: "Harcamalar",
    kind: "flow",
    monthlyValue: 1_950_000,
    delta: 5.8,
    detail: [
      { label: "Ofis / Genel Gider", monthlyValue: 620_000 },
      { label: "Pazarlama", monthlyValue: 780_000 },
      { label: "Lojistik", monthlyValue: 550_000 },
    ],
  },
  {
    key: "hata",
    label: "Hata (Mutabakat Farkı)",
    kind: "stock",
    monthlyValue: 42_500,
    delta: null,
    detail: [
      { label: "Banka - Muhasebe Farkı", monthlyValue: 28_000 },
      { label: "Fatura - Tahsilat Farkı", monthlyValue: 14_500 },
    ],
  },
];

export function getMockFinanceMetrics(granularity: Granularity): FinanceMetric[] {
  const scale = SCALE[granularity];

  const generic = SEEDS.map((s): FinanceMetric => {
    // "stock" metrikler (Borçlar/Alacaklar/Banka/Hata) bir andaki durumu
    // gösterir, Günlük/Aylık/Yıllık seçiciden etkilenmez — o yüzden scale=1.
    const effectiveScale = s.kind === "flow" ? scale : 1;

    return {
      key: s.key,
      label: s.label,
      kind: s.kind,
      value: s.monthlyValue * effectiveScale,
      delta: s.delta,
      detail: s.detail.map((d) => ({ label: d.label, value: d.monthlyValue * effectiveScale })),
      trend: buildTrend(s.monthlyValue),
      aging: s.aging?.map((a) => ({ label: a.label, value: s.monthlyValue * a.ratio })),
      bankAccounts:
        s.key === "banka"
          ? s.detail.map((d, i): BankAccount => {
              const daysAgo = [1, 3, 0][i] ?? 2;
              const date = new Date();
              date.setDate(date.getDate() - daysAgo);
              return { name: d.label, balance: d.monthlyValue, lastTxnDate: date.toISOString() };
            })
          : undefined,
    };
  });

  // Tahsilatlar: gerçek aylık toplamlardan (Temmuz = son tam ay) inşa edilir.
  // Kategori kırılımı (Pazaryeri/Cari) henüz gerçek bir alan olmadığı için
  // eski dummy oranla (yaklaşık %63 / %37) tahmini olarak bölüştürülüyor.
  const flowScale = scale;
  const tahsilatlar: FinanceMetric = {
    key: "tahsilatlar",
    label: "Tahsilatlar",
    kind: "flow",
    value: TAHSILAT_SON_TAM_AY * flowScale,
    delta: Math.round(TAHSILAT_DELTA * 10) / 10,
    detail: [
      { label: "Pazaryeri Tahsilatları (tahmini oran)", value: TAHSILAT_SON_TAM_AY * 0.627451 * flowScale },
      { label: "Cari Tahsilat (tahmini oran)", value: TAHSILAT_SON_TAM_AY * 0.372549 * flowScale },
    ],
    trend: buildTahsilatTrend(),
    dataNote: "Aylık toplamlar gerçek (Oca–Ağu 2026, VW_100_TAHSILATLAR — 03.08.2026 sorgusu)",
    sampleRows: TAHSILAT_ORNEK_SATIRLAR,
  };

  const [odemeler, borclar, alacaklar, banka, harcamalar, hata] = generic;
  return [odemeler, tahsilatlar, borclar, alacaklar, banka, harcamalar, hata];
}

/** "Yaklaşan Ödemeler & Tahsilatlar" — bugüne göre göreli tarihlerle üretilir. */
export function getMockUpcomingItems(): UpcomingItem[] {
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  const items: UpcomingItem[] = [
    { label: "Tedarikçi - Nutramol Ambalaj", date: inDays(2), value: 420_000, type: "odeme" },
    { label: "Trendyol Tahsilatı", date: inDays(3), value: 850_000, type: "tahsilat" },
    { label: "SGK Prim Ödemesi", date: inDays(5), value: 310_000, type: "odeme" },
    { label: "Hepsiburada Tahsilatı", date: inDays(6), value: 640_000, type: "tahsilat" },
    { label: "Kredi Kartı Ekstresi", date: inDays(9), value: 275_000, type: "odeme" },
    { label: "Cari Tahsilat - Vital Sağlıklı Yaşam", date: inDays(12), value: 190_000, type: "tahsilat" },
  ];
  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
