// "Kutu Trendi" veri sözleşmesi — TÜM şirketler (Holimer + Fw İlaç, konsolide)
// için günlük/haftalık/aylık/yıllık satılan kutu (miktar/birim) adedi ve
// kutu başına ciro rasyosu (TL/EUR/USD) + şirket bazlı kırılım.
//
// Web Mağaza sekmesinden bağımsızdır: Web Mağaza sadece holistikmarket.com
// kanallarını (bkz. webstore-types.ts) kapsar, Kutu Trendi ise şirketin
// TÜM satışlarını (tüm kanallar, tüm cariler) kapsar.

/** TCMB'nin günlük gösterge niteliğindeki döviz kuru (today.xml). */
export interface KurBilgisi {
  /** TCMB'nin yayınladığı tarih, "GG.AA.YYYY" (hafta sonu/tatilde son iş gününe ait olabilir). */
  tarih: string;
  usdAlis: number;
  usdSatis: number;
  eurAlis: number;
  eurSatis: number;
  kaynak: "tcmb" | "yok";
  /** true ise TCMB'ye ulaşılamadı — usdAlis/usdSatis/eurAlis/eurSatis 0'dır ve GÖSTERİLMEMELİDİR (rakam uydurmamak için). */
  alinamadi?: boolean;
}

export type KutuGranularite = "gunluk" | "haftalik" | "aylik" | "yillik";

/** Bir şirketin kutu/ciro toplamının web mağaza (e-ticaret) kanallarına düşen kısmı. */
export interface KutuWebMagazaPay {
  kutuAdedi: number;
  ciroTl: number;
}

/** Bir dönem noktasının (veya serinin tamamının) tek bir şirkete düşen payı. */
export interface KutuSirketPay {
  /** /logo/durum -> sirketler[].sirket ile birebir aynı (dinamik, hardcode değil). */
  sirket: string;
  kutuAdedi: number;
  ciroTl: number;
  /**
   * Bu şirketin toplamının, web mağaza (holistikmarket.com + pazaryerleri —
   * bkz. webstore-report.ts) kanallarından gelen kısmı. Sadece bu kanalları
   * olan şirket (bugün için Holimer) için ve sadece KutuSeri.webMagazaHesaplandi
   * true olduğunda doludur; diğer durumlarda alan hiç yoktur (0 GÖSTERİLMEZ —
   * "hesaplanmadı" ile "sıfır" karıştırılmasın diye, rakam uydurmama kuralı).
   */
  webMagaza?: KutuWebMagazaPay;
}

export interface KutuSeriNoktasi {
  key: string;
  label: string;
  baslangic: string; // YYYY-MM-DD
  bitis: string; // YYYY-MM-DD
  /** TÜM şirketlerin toplamı — sirketler[] toplamına eşittir. */
  kutuAdedi: number;
  ciroTl: number;
  /** ciroTl / kutuAdedi. kutuAdedi 0 ise null — gerçek bir sıfır değil, "hesaplanamaz" anlamındadır. */
  ciroKutuTl: number | null;
  /** ciroKutuTl / kur ortalaması. Kur alınamadıysa veya ciroKutuTl null ise null. */
  ciroKutuEur: number | null;
  ciroKutuUsd: number | null;
  /** Şirket bazlı kırılım (bkz. /logo/durum -> sirketler[], dinamik — şu an Holimer + Fw İlaç). */
  sirketler: KutuSirketPay[];
  /**
   * true ise bu dönem için FastAPI'den veri çekilemedi (ağ/HTTP hatası — bir
   * veya daha fazla şirket sorgusu başarısız oldu) — kutuAdedi/ciroTl 0'dır
   * ama GERÇEK bir sıfır değildir, arayüzde ayırt edilmeli (rakam
   * uydurmamak için; bkz. webstore-report.ts'teki aynı desen).
   */
  veriAlinamadi?: boolean;
}

export interface KutuSeri {
  granularite: KutuGranularite;
  baslik: string;
  aciklama: string;
  noktalar: KutuSeriNoktasi[];
  toplamKutu: number;
  toplamCiroTl: number;
  /** Tüm dönemin toplamının şirket bazlı kırılımı (noktalardaki sirketler toplanarak hesaplanır). */
  sirketToplamlari: KutuSirketPay[];
  /** null ise kur hiç çekilemedi (aşırı durum) — normalde alinamadi:true ile dolu döner. */
  kur: KurBilgisi | null;
  /**
   * true ise sirketler[].webMagaza / sirketToplamlari[].webMagaza alanları bu
   * seride hesaplanmıştır. Web mağaza kırılımı /logo/satislar/ozet ile değil,
   * ham fatura satırı sayfalamasıyla hesaplandığından (bkz. kutu-report.ts)
   * SADECE Günlük ve Haftalık'ta hesaplanır — Aylık/Yıllık'ta veri hacmi çok
   * büyüyeceğinden performans nedeniyle bilerek hesaplanmaz (webstore-report.ts
   * içindeki matrahHesaplandi ile aynı desen).
   */
  webMagazaHesaplandi: boolean;
}
