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

export interface WebstoreDonem {
  key: WebstoreDonemAnahtari;
  label: string;
  baslangic: string; // YYYY-MM-DD
  bitis: string; // YYYY-MM-DD
  kendiSite: WebstoreKanal;
  pazaryerleri: WebstoreKanal[];
  genelToplam: number;
  genelFaturaAdedi: number;
}

export interface WebstoreRaporu {
  brandName: string;
  donemler: WebstoreDonem[];
  generatedAt: string;
}
