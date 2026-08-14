// TCMB (Türkiye Cumhuriyet Merkez Bankası) günlük gösterge niteliğindeki
// döviz kuru — resmi XML servisinden (today.xml) çekilir. Bu dosya SADECE
// Next.js sunucu tarafında (API route / server component) çalışır; tarayıcıda
// CORS nedeniyle tcmb.gov.tr'ye doğrudan erişilemez.
//
// NOT: TCMB hafta sonu/resmi tatilde kur yayınlamaz — today.xml o günlerde
// son yayınlanan (genelde bir önceki iş günü) kuru döner; dönen "tarih"
// alanı bunu gösterir, arayüzde bu tarih gösterilmelidir ("bugünün kuru"
// diye sunulmamalı).

import { KurBilgisi } from "./kutu-types";

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

function xmlSayi(deger: string | undefined): number | null {
  if (!deger) return null;
  const n = Number(deger.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function paraBirimiCek(
  xml: string,
  kod: "USD" | "EUR"
): { alis: number | null; satis: number | null } {
  const blokRegex = new RegExp(`<Currency[^>]*Kod="${kod}"[^>]*>([\\s\\S]*?)</Currency>`, "i");
  const blok = xml.match(blokRegex)?.[1];
  if (!blok) return { alis: null, satis: null };
  const alisM = blok.match(/<ForexBuying>([^<]*)<\/ForexBuying>/i);
  const satisM = blok.match(/<ForexSelling>([^<]*)<\/ForexSelling>/i);
  return { alis: xmlSayi(alisM?.[1]), satis: xmlSayi(satisM?.[1]) };
}

/**
 * TCMB'nin günlük gösterge niteliğindeki döviz kurunu (today.xml) çeker.
 * Ulaşılamazsa veya XML ayrıştırılamazsa `alinamadi: true` ile döner —
 * rakam UYDURULMAZ; çağıran taraf bu durumda EUR/USD kolonlarını
 * gizlemeli veya "kur alınamadı" uyarısı göstermelidir.
 */
export async function fetchTcmbKur(): Promise<KurBilgisi> {
  try {
    const res = await fetch(TCMB_URL, {
      // TCMB günde bir kez (~15:30) günceller; saatlik tazeleme yeterli ve nazik.
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ciro-dashboard/1.0)" },
    });
    if (!res.ok) throw new Error(`TCMB HTTP ${res.status}`);
    const xml = await res.text();

    const tarihM = xml.match(/Tarih="([^"]+)"/);
    const usd = paraBirimiCek(xml, "USD");
    const eur = paraBirimiCek(xml, "EUR");

    if (usd.alis === null || usd.satis === null || eur.alis === null || eur.satis === null) {
      throw new Error("TCMB XML içinde USD/EUR ForexBuying/ForexSelling alanları ayrıştırılamadı");
    }

    return {
      tarih: tarihM?.[1] ?? "",
      usdAlis: usd.alis,
      usdSatis: usd.satis,
      eurAlis: eur.alis,
      eurSatis: eur.satis,
      kaynak: "tcmb",
    };
  } catch (err) {
    console.error("[kur-api] TCMB kuru alınamadı:", err);
    return {
      tarih: "",
      usdAlis: 0,
      usdSatis: 0,
      eurAlis: 0,
      eurSatis: 0,
      kaynak: "yok",
      alinamadi: true,
    };
  }
}

/** Alış/satış ortalaması — null ise (kur alınamadıysa) çağıran taraf EUR/USD hesaplamayı atlamalı. */
export function kurOrtaDegerleri(kur: KurBilgisi | null): {
  usd: number | null;
  eur: number | null;
} {
  if (!kur || kur.alinamadi) return { usd: null, eur: null };
  return { usd: (kur.usdAlis + kur.usdSatis) / 2, eur: (kur.eurAlis + kur.eurSatis) / 2 };
}
