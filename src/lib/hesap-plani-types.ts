// Hesap Planı (chart of accounts) veri sözleşmesi.
//
// Bu, Logo'dan otomatik çekilen bir veri DEĞİLDİR — Aydın'ın bu sayfa
// üzerinden elle girdiği, her hesap kaleminin ne anlama geldiğini ve rapor
// tarafında hangi kategoriye karşılık geldiğini açıklayan bir REFERANS
// tanımlar listesidir. Amaç: gelir tablosu ve diğer finansal kalemler
// hesaplanırken (ör. bir sohbette Claude'a "gelir tablosunu hesapla"
// dendiğinde) kategori tahminine (bkz. src/lib/logo-category.ts'teki anahtar
// kelime kuralları) değil, burada tanımlı kesin hesap planına dayanılması.

export const HESAP_ANA_GRUPLARI = [
  "1 - Dönen Varlıklar",
  "2 - Duran Varlıklar",
  "3 - Kısa Vadeli Yabancı Kaynaklar",
  "4 - Uzun Vadeli Yabancı Kaynaklar",
  "5 - Özkaynaklar",
  "6 - Gelir Tablosu Hesapları",
  "7 - Maliyet Hesapları",
  "Diğer",
] as const;

export type HesapAnaGrubu = (typeof HESAP_ANA_GRUPLARI)[number];

export function isHesapAnaGrubu(value: string): value is HesapAnaGrubu {
  return (HESAP_ANA_GRUPLARI as readonly string[]).includes(value);
}

export interface HesapPlaniKalemi {
  /** Sunucu tarafında üretilen benzersiz kimlik (kod değişse bile sabit kalır). */
  id: string;
  /** Hesap kodu, ör. "600", "120.01". Tekdüzen hesap planı kodu ya da kendi iç kodunuz olabilir. */
  kod: string;
  /** Hesap adı, ör. "Yurtiçi Satışlar". */
  ad: string;
  anaGrup: HesapAnaGrubu;
  /**
   * Bu hesabın neyi kapsadığına dair serbest metin açıklama — hangi cariler,
   * hangi kanallar, hangi kurallar bu hesaba girer. Gelecekte gelir tablosu
   * hesaplanırken referans alınacak asıl içerik burasıdır.
   */
  tanim: string;
  /**
   * Bu hesabın dashboard'daki hangi rapor kalemine karşılık geldiği (ör.
   * "Pazaryeri", "E-Ticaret", "Cari Satış", "Grup Firmalar", "Diğer
   * Gelirler"). Serbest metin, opsiyonel — girilmezse eşleme henüz
   * yapılmamış demektir.
   */
  raporKategorisi?: string;
  olusturmaTarihi: string; // ISO 8601
  guncellemeTarihi: string; // ISO 8601
}

/** Formdan / API isteğinden gelen, sunucunun ürettiği alanlar hariç girdi. */
export interface HesapPlaniGirdi {
  kod: string;
  ad: string;
  anaGrup: HesapAnaGrubu;
  tanim: string;
  raporKategorisi?: string;
}
