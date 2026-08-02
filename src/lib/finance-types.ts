// DUMMY VERİ TİPLERİ — bu bölüm gerçek bir Logo/satzeka entegrasyonuna henüz
// bağlı değil (Ödemeler, Tahsilatlar, Borçlar, Alacaklar, Banka, Harcamalar,
// Hata verileri FastAPI'de mevcut değil, bkz. README.md). Gerçek entegrasyon
// eklendiğinde src/lib/finance-mock.ts yerine gerçek bir API route'u
// bağlanmalı; bu tipler o zaman da aynı şekilde kullanılabilir.

export type FinanceMetricKey =
  | "odemeler"
  | "tahsilatlar"
  | "borclar"
  | "alacaklar"
  | "banka"
  | "harcamalar"
  | "hata";

export type Granularity = "gunluk" | "aylik" | "yillik";

export interface FinanceMetricDetail {
  label: string;
  value: number;
}

export interface FinanceMetric {
  key: FinanceMetricKey;
  label: string;
  value: number;
  delta: number | null;
  detail: FinanceMetricDetail[];
}
