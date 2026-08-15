// "Web Mağaza" (holistikmarket.com) veri sözleşmesi.
// Bu bölüm GERÇEK Logo verisidir (bkz. webstore-report.ts) — sadece
// FastAPI'ye hiç ulaşılamazsa webstore-mock.ts'e düşülür (bkz. API route).

export interface WebstoreKanal {
  key: string;
  ad: string;
  toplamTutar: number;
  faturaAdedi: number;
}

export type WebstoreDonemAnahtari = "bugun" | "hafta" | "ay" | "yilbasi";

/**
 * KDV dahil/hariç kırılımı. Sadece kısa dönemlerde (bugün/hafta/ay)
 * hesaplanır — yıl başından bugüne gibi uzun dönemlerde büyük veri
 * hacmi nedeniyle hesaplanmaz (bkz. webstore-report.ts).
 * `matrahHesaplandi=false` ise `matrah`/`kdv` alanları 0'dır ve arayüzde
 * gösterilmemelidir — rakam uydurmamak için.
 */
export interface WebstoreMatrahKirilimi {
  matrahHesaplandi: boolean;
  matrah: number;
  kdv: number;
  tutar: number; // KDV dahil — matrah + kdv ile aynı olmalı
}

/** Bir dönemin bir önceki eşdeğer dönemle (dün/geçen hafta/geçen ay/geçen yıl YTD) karşılaştırması. */
export interface WebstoreKarsilastirma {
  label: string;
  baslangic: string; // YYYY-MM-DD
  bitis: string; // YYYY-MM-DD
  genelToplam: number;
  genelFaturaAdedi: number;
  kendiSiteToplam: number;
  pazaryerleriToplam: Record<string, number>; // kanal key -> tutar
  /** (güncel - önceki) / önceki * 100. Önceki 0 ise null. */
  degisimYuzde: number | null;
}

export interface WebstoreDonem {
  key: WebstoreDonemAnahtari;
  label: string;
  baslangic: string; // YYYY-MM-DD
  bitis: string; // YYYY-MM-DD
  kendiSite: WebstoreKanal;
  pazaryerleri: WebstoreKanal[];
  genelToplam: number;
  genelFaturaAdedi: number;
  matrahKirilimi: WebstoreMatrahKirilimi;
  karsilastirma: WebstoreKarsilastirma;
}

export interface WebstoreRaporu {
  brandName: string;
  donemler: WebstoreDonem[];
  generatedAt: string;
}

/** Seçilen bir ay için gün gün ciro noktası. */
export interface WebstoreGunlukNokta {
  tarih: string; // YYYY-MM-DD
  genelToplam: number;
  kendiSiteToplam: number;
  pazaryerleriToplam: number;
  faturaAdedi: number;
  /** Fatura satırlarındaki miktar/birim toplamı (bkz. kutu-types.ts'teki tanım) — o günkü web mağaza satışlarının kutu adedi. */
  kutuAdedi: number;
}

export interface WebstoreGunlukSeri {
  yil: number;
  ay: number; // 1-12
  ayEtiketi: string; // "Ağustos 2026"
  gunler: WebstoreGunlukNokta[];
  toplam: number;
  /** Aynı ayın bir önceki yılıyla karşılaştırma (varsa). */
  gecenYilAyniAy?: {
    ayEtiketi: string;
    gunler: WebstoreGunlukNokta[];
    toplam: number;
  };
}

// Haftalık / aylık / yıllık zaman serisi (trend grafiği için).

export type WebstoreGranularite = "haftalik" | "aylik" | "yillik";

export interface WebstoreSeriNoktasi {
  key: string;
  label: string;
  baslangic: string; // YYYY-MM-DD
  bitis: string; // YYYY-MM-DD
  genelToplam: number;
  genelFaturaAdedi: number;
  kendiSiteToplam: number;
  pazaryerleriToplam: number;
  /**
   * true ise bu dönem için FastAPI'den veri çekilemedi (ağ/HTTP hatası) —
   * genelToplam 0'dır ama bu GERÇEK bir sıfır değildir, arayüzde ayırt
   * edilmeli (rakam uydurmamak için).
   */
  veriAlinamadi?: boolean;
}

export interface WebstoreSeri {
  granularite: WebstoreGranularite;
  baslik: string;
  noktalar: WebstoreSeriNoktasi[];
  toplam: number;
}
