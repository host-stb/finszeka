// Gerçek FastAPI (satzeka / Logo entegrasyonu) uç noktalarına ham erişim.
// Bu dosya sadece HTTP çağrılarını ve tiplerini içerir; kategori/rapor
// dönüşümü src/lib/logo-report.ts içinde yapılır.
//
// Doğrulanmış uç noktalar (2026-08-01 itibarıyla api.nutramolai.com üzerinde):
//   GET /logo/durum          -> LogoDurum
//   GET /logo/satislar/ozet  -> LogoSatislarOzet (baslangic, bitis, sirket, ilk_n)
//   GET /logo/satislar       -> satır bazlı fatura verisi (fetchSatislar).
//                                 Yıllık veri 100binlerce satır olduğundan büyük
//                                 hacimli cariler için burada TAM yıl çekilmiyor —
//                                 sadece küçük hacimli kanallar (bkz.
//                                 src/lib/webstore-report.ts) için nokta atışı
//                                 cari_kodu filtresiyle kullanılıyor.
//   GET /logo/cariler        -> cari bazlı toplam fatura tutarı (bakiye/borç-alacak yok)

export interface LogoDurum {
  satir_sayisi: number;
  son_aktarim: string;
  en_eski_fatura: string;
  en_yeni_fatura: string;
  veri_var: boolean;
  sirketler: { sirket: string; satir_sayisi: number }[];
}

export interface LogoCariOzet {
  cari_hesap_kodu: string;
  cari_hesap_unvani: string;
  fatura_adedi: number;
  toplam_tutar: number;
}

export interface LogoSatislarOzet {
  donem: { baslangic: string; bitis: string };
  sirket_filtresi: string;
  genel: {
    fatura_adedi: number;
    siparis_adedi: number;
    musteri_adedi: number;
    toplam_miktar: number;
    toplam_matrah: number;
    toplam_kdv: number;
    toplam_tutar: number;
  };
  en_cok_satan_urunler: unknown[];
  en_cok_alan_cariler: LogoCariOzet[];
}

// FastAPI (2026-09-23 itibarıyla) her istekte X-Integration-Key başlığı bekler.
// Finszeka için sunucudaki LOGO_READ_API_KEY kullanılır (sadece GET /logo/*).
function authHeaders(): HeadersInit {
  const token = process.env.FASTAPI_API_KEY;
  return token ? { "X-Integration-Key": token } : {};
}

export async function fetchLogoDurum(base: string): Promise<LogoDurum> {
  const res = await fetch(`${base}/logo/durum`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`logo/durum HTTP ${res.status}`);
  return res.json();
}

export async function fetchSatislarOzet(
  base: string,
  params: { baslangic: string; bitis: string; sirket?: string; ilkN?: number }
): Promise<LogoSatislarOzet> {
  const url = new URL(`${base}/logo/satislar/ozet`);
  url.searchParams.set("baslangic", params.baslangic);
  url.searchParams.set("bitis", params.bitis);
  if (params.sirket) url.searchParams.set("sirket", params.sirket);
  url.searchParams.set("ilk_n", String(params.ilkN ?? 40));

  const res = await fetch(url, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) throw new Error(`logo/satislar/ozet HTTP ${res.status}`);
  return res.json();
}

export interface LogoSatisSatiri {
  sirket: string;
  tarihi: string;
  fatura_numarasi: string;
  fatura_turu: string;
  fatura_iptal_durumu: string;
  cari_hesap_kodu: string;
  cari_hesap_unvani: string;
  hizmet_kodu: string;
  hizmet_aciklamasi: string;
  birim: string;
  miktar: number;
  birim_fiyat: number;
  satir_matrahi: number;
  kdv: number;
  toplami: number;
  satis_temsilci_adi: string;
  siparis_numarasi: string;
}

export interface LogoSatislarSayfa {
  adet: number;
  limit: number;
  offset: number;
  satirlar: LogoSatisSatiri[];
}

export async function fetchSatislar(
  base: string,
  params: {
    baslangic?: string;
    bitis?: string;
    sirket?: string;
    cariKodu?: string;
    limit?: number;
    offset?: number;
  }
): Promise<LogoSatislarSayfa> {
  const url = new URL(`${base}/logo/satislar`);
  if (params.baslangic) url.searchParams.set("baslangic", params.baslangic);
  if (params.bitis) url.searchParams.set("bitis", params.bitis);
  if (params.sirket) url.searchParams.set("sirket", params.sirket);
  if (params.cariKodu) url.searchParams.set("cari_kodu", params.cariKodu);
  url.searchParams.set("limit", String(params.limit ?? 1000));
  url.searchParams.set("offset", String(params.offset ?? 0));

  const res = await fetch(url, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) throw new Error(`logo/satislar HTTP ${res.status}`);
  return res.json();
}
