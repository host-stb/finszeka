// ⚠️ DUMMY VERİ — bu dosyadaki tüm rakamlar sahte örnek verilerdir.
// Ödemeler/Tahsilatlar/Borçlar/Alacaklar/Banka/Harcamalar/Hata için Logo'da
// veri olsa da, bunları dışarı veren bir uç nokta henüz yok (bkz. README.md
// → "Finans Özeti (dummy)"). Gerçek entegrasyon eklendiğinde bu dosya yerine
// bir API route'u bağlanmalı; bileşenler aynı tipleri beklediği için
// değişiklik minimal olur.

import {
  BankAccount,
  FinanceMetric,
  Granularity,
  MetricKind,
  UpcomingItem,
} from "./finance-types";
import { MONTH_SHORT } from "./report-utils";
import { MONTHS } from "./types";

const SCALE: Record<Granularity, number> = {
  gunluk: 1 / 30,
  aylik: 1,
  yillik: 12,
};

// 12 aylık kabaca mevsimsel bir eğri (ortalaması ~1) — trend grafiklerinde
// tüm metriklerin aynı "doğal" iniş-çıkışı taşıması için kullanılıyor.
const SEASONAL = [0.82, 0.88, 0.95, 1.05, 1.1, 1.0, 0.9, 0.85, 0.95, 1.05, 1.15, 1.2];

function buildTrend(baseValue: number) {
  return MONTHS.map((m, i) => ({
    month: MONTH_SHORT[m],
    value: Math.round(baseValue * SEASONAL[i]),
  }));
}

interface MetricSeed {
  key: FinanceMetric["key"];
  label: string;
  kind: MetricKind;
  monthlyValue: number;
  delta: number | null;
  detail: { label: string; monthlyValue: number }[];
  aging?: { label: string; ratio: number }[];
}

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
    key: "tahsilatlar",
    label: "Tahsilatlar",
    kind: "flow",
    monthlyValue: 5_100_000,
    delta: 4.1,
    detail: [
      { label: "Pazaryeri Tahsilatları", monthlyValue: 3_200_000 },
      { label: "Cari Tahsilat", monthlyValue: 1_900_000 },
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

  return SEEDS.map((s) => {
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
