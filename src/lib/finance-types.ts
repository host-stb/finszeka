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

/**
 * "flow": bir dönem için akan tutar (Ödemeler/Tahsilatlar/Harcamalar) —
 *   Günlük/Aylık/Yıllık seçiciye göre ölçeklenir.
 * "stock": belirli bir andaki bakiye/durum (Borçlar/Alacaklar/Banka/Hata) —
 *   "yıllık borç" gibi bir kavram olmadığı için seçiciden etkilenmez, her
 *   zaman güncel durumu gösterir.
 */
export type MetricKind = "flow" | "stock";

export interface FinanceMetricDetail {
  label: string;
  value: number;
}

export interface AgingBucket {
  label: string;
  value: number;
}

export interface BankAccount {
  name: string;
  balance: number;
  lastTxnDate: string; // ISO
}

export interface TrendPoint {
  month: string;
  value: number;
}

export interface FinanceMetric {
  key: FinanceMetricKey;
  label: string;
  kind: MetricKind;
  value: number;
  delta: number | null;
  detail: FinanceMetricDetail[];
  trend: TrendPoint[];
  /** Sadece "borclar" ve "alacaklar" için: vade kırılımı. */
  aging?: AgingBucket[];
  /** Sadece "banka" için: hesap bazlı bakiye. */
  bankAccounts?: BankAccount[];
}

export interface UpcomingItem {
  label: string;
  date: string; // ISO
  value: number;
  type: "odeme" | "tahsilat";
}
