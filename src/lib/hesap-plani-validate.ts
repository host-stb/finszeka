import { HESAP_ANA_GRUPLARI, HesapPlaniGirdi, isHesapAnaGrubu } from "./hesap-plani-types";

export type ValidationResult = { girdi: HesapPlaniGirdi } | { error: string };

/** API route'larının POST/PUT gövdesini doğrulaması için ortak fonksiyon. */
export function validateHesapPlaniGirdi(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { error: "Geçersiz istek gövdesi" };
  }
  const b = body as Record<string, unknown>;

  const kod = typeof b.kod === "string" ? b.kod.trim() : "";
  const ad = typeof b.ad === "string" ? b.ad.trim() : "";
  const anaGrup = typeof b.anaGrup === "string" ? b.anaGrup : "";
  const tanim = typeof b.tanim === "string" ? b.tanim.trim() : "";
  const raporKategorisiRaw = typeof b.raporKategorisi === "string" ? b.raporKategorisi.trim() : "";

  if (!kod) return { error: "Hesap kodu zorunludur" };
  if (!ad) return { error: "Hesap adı zorunludur" };
  if (!isHesapAnaGrubu(anaGrup)) {
    return { error: `Ana grup şunlardan biri olmalı: ${HESAP_ANA_GRUPLARI.join(", ")}` };
  }

  return {
    girdi: {
      kod,
      ad,
      anaGrup,
      tanim,
      raporKategorisi: raporKategorisiRaw || undefined,
    },
  };
}
