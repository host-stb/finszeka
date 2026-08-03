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
  /** Henüz gerçekleşmemiş (gelecek) aylar için null — grafikte boşluk bırakılır. */
  value: number | null;
}

/**
 * Danışmanın SQL Server'da paylaştığı VW_100_TAHSILATLAR görünümünün gerçek
 * satır şeması. FastAPI tarafında bu view'i dönen bir uç nokta henüz yok
 * (bkz. finance-mock.ts) — bu tip, o uç nokta geldiğinde birebir eşleşmesi
 * için şimdiden gerçek kolon adlarına göre tanımlandı.
 */
export interface TahsilatSatiri {
  islemKod: string;
  fisTur: string;
  fisNo: string;
  fisTarih: string; // ISO
  fisAciklama: string;
  islemYeriKod: string;
  islemYeri: string;
  cariAd: string;
  cariKod: string;
  tutar: number;
  aciklama: string;
  isyeri: string;
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
  /** Bu metrik için trend/toplamın hangi ölçüde gerçek veriye dayandığını açıklayan kısa not. */
  dataNote?: string;
  /** Sadece "tahsilatlar" için: gerçek şemaya uygun örnek fiş satırları (fiş bazlı veri API'ye bağlanana kadar illüstratif). */
  sampleRows?: TahsilatSatiri[];
}

export interface UpcomingItem {
  label: string;
  date: string; // ISO
  value: number;
  type: "odeme" | "tahsilat";
}
