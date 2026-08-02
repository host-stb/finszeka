// Gelir raporu veri sözleşmesi (data contract).
// Gerçek FastAPI backend'i (satzeka / Logo entegrasyonu) bu tipteki JSON'u
// döndürmelidir. Detaylar için proje kökündeki README.md dosyasına bakın.

export const MONTHS = [
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
] as const;

export type Month = (typeof MONTHS)[number];

/**
 * Bir satırın görsel/hiyerarşik türü:
 * - "category": Ana kategori başlığı (ör. PAZARYERİ) — kalın, gri zemin.
 * - "subgroup": Kategori içindeki alt başlık (ör. grup firma adı) — kalın, italik.
 * - "item": Tekil kalem satırı (ör. "Holistikmarket - Amazon") — normal, girintili.
 * - "total": Rapor sonundaki genel toplam satırı — kalın, üst çizgili.
 */
export type RowKind = "category" | "subgroup" | "item" | "total";

export interface ReportRow {
  /** Benzersiz satır kimliği (React key + olası düzenleme/eşleme için). */
  id: string;
  /** B sütununda görünen etiket. */
  label: string;
  /** A sütunu ("Faaliyet İçi" / "Faaliyet Dışı"). Sadece "item" satırlarında dolu olur. */
  faaliyet?: string;
  kind: RowKind;
  /** Ay adına göre tutar. Değer yoksa anahtar hiç bulunmaz ya da null olabilir. */
  values: Partial<Record<Month, number | null>>;
}

export interface CompanyReport {
  /** Firma kimliği (ör. "holimer"). Logo'daki cari/firma koduyla eşleşebilir. */
  companyId: string;
  /** Ekranda gösterilecek firma adı (ör. "Holimer"). */
  companyName: string;
  /** Rapor dönemi başlığı, ör. "2026" ya da "2026-Q2". */
  period: string;
  /** İkinci sütunun başlığı, ör. "HOLİMER GELİRLER". */
  columnTitle: string;
  rows: ReportRow[];
  /** Verinin backend tarafında en son ne zaman üretildiği (ISO 8601). */
  generatedAt: string;
}

export interface CompanySummary {
  id: string;
  name: string;
}

/** API route'larının döndürdüğü zarf (envelope) — veri gerçek mi mock mu görünür kılar. */
export interface ApiEnvelope<T> {
  data: T;
  source: "live" | "mock";
  fetchedAt: string;
}
