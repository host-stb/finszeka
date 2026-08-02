// ⚠️ DUMMY VERİ — bu dosyadaki tüm rakamlar sahte örnek verilerdir.
// Ödemeler/Tahsilatlar/Borçlar/Alacaklar/Banka/Harcamalar/Hata için Logo'da
// veri olsa da, bunları satzeka/FastAPI üzerinden dışarı veren bir uç nokta
// henüz yok (bkz. README.md → "Finans Özeti (dummy)"). Gerçek entegrasyon
// eklendiğinde bu dosya yerine bir API route'u (ör. src/app/api/finans/route.ts)
// bağlanmalı; FinanceOverview.tsx bileşeni aynı FinanceMetric[] tipini
// beklediği için değişiklik minimal olur.

import { FinanceMetric, Granularity } from "./finance-types";

const SCALE: Record<Granularity, number> = {
  gunluk: 1 / 30,
  aylik: 1,
  yillik: 12,
};

interface MetricSeed {
  key: FinanceMetric["key"];
  label: string;
  monthlyValue: number;
  delta: number | null;
  detail: { label: string; monthlyValue: number }[];
}

const SEEDS: MetricSeed[] = [
  {
    key: "odemeler",
    label: "Ödemeler",
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
    monthlyValue: 2_650_000,
    delta: 2.3,
    detail: [
      { label: "Tedarikçi Borcu", monthlyValue: 1_800_000 },
      { label: "Kredi Kartı Borcu", monthlyValue: 850_000 },
    ],
  },
  {
    key: "alacaklar",
    label: "Alacaklar",
    monthlyValue: 3_400_000,
    delta: -1.4,
    detail: [
      { label: "Vadesi Geçmemiş", monthlyValue: 2_600_000 },
      { label: "Vadesi Geçmiş (30+ gün)", monthlyValue: 800_000 },
    ],
  },
  {
    key: "banka",
    label: "Banka",
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
  return SEEDS.map((s) => ({
    key: s.key,
    label: s.label,
    value: s.monthlyValue * scale,
    delta: s.delta,
    detail: s.detail.map((d) => ({ label: d.label, value: d.monthlyValue * scale })),
  }));
}
