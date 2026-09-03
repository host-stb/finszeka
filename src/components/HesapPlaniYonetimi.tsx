"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HESAP_ANA_GRUPLARI, HesapAnaGrubu, HesapPlaniGirdi, HesapPlaniKalemi } from "@/lib/hesap-plani-types";
import { formatTimestamp } from "@/lib/format";
import { AlertIcon, PencilIcon, PlusIcon, RefreshIcon, SearchIcon, TrashIcon, XIcon } from "./icons";

const BOS_FORM: HesapPlaniGirdi = {
  kod: "",
  ad: "",
  anaGrup: HESAP_ANA_GRUPLARI[5], // "6 - Gelir Tablosu Hesapları" en sık kullanılacak grup olduğu için varsayılan
  tanim: "",
  raporKategorisi: "",
};

type Durum = { tip: "basarili" | "hata"; mesaj: string } | null;
type SekmeKey = HesapAnaGrubu | "tumu";

export default function HesapPlaniYonetimi() {
  const [kalemler, setKalemler] = useState<HesapPlaniKalemi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [form, setForm] = useState<HesapPlaniGirdi>(BOS_FORM);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [formHata, setFormHata] = useState<string | null>(null);
  const [durum, setDurum] = useState<Durum>(null);

  const [arama, setArama] = useState("");
  const [sekme, setSekme] = useState<SekmeKey>("tumu");
  const ilkSekmeSecildi = useRef(false);

  const listeyiYukle = async () => {
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/hesap-plani", { cache: "no-store" });
      if (!res.ok) throw new Error(`Liste alınamadı (HTTP ${res.status})`);
      const envelope: { data: HesapPlaniKalemi[] } = await res.json();
      setKalemler(envelope.data);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ilk yüklemede listeyi çekiyoruz
    listeyiYukle();
  }, []);

  useEffect(() => {
    if (!durum) return;
    const t = setTimeout(() => setDurum(null), 3500);
    return () => clearTimeout(t);
  }, [durum]);

  // Sekmeler: veride kalemi olan ana gruplar (600'lü -> "6 - Gelir Tablosu
  // Hesapları", 700'lü -> "7 - Maliyet Hesapları" vb.), kod sırasına göre.
  const mevcutSekmeler = useMemo(() => {
    return HESAP_ANA_GRUPLARI.map((grup) => ({
      grup,
      adet: kalemler.filter((k) => k.anaGrup === grup).length,
    })).filter((s) => s.adet > 0);
  }, [kalemler]);

  useEffect(() => {
    // İlk veri geldiğinde hepsi alt alta değil, tek bir sekme (ilk mevcut ana
    // grup) seçili gelsin — kullanıcı isterse "Tümü" sekmesine geçebilir.
    if (ilkSekmeSecildi.current) return;
    if (mevcutSekmeler.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- veri ilk geldiğinde tek bir sekmeyi varsayılan seçiyoruz
    setSekme(mevcutSekmeler[0].grup);
    ilkSekmeSecildi.current = true;
  }, [mevcutSekmeler]);

  const filtrelenmis = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return kalemler.filter((k) => {
      if (sekme !== "tumu" && k.anaGrup !== sekme) return false;
      if (!q) return true;
      return (
        k.kod.toLocaleLowerCase("tr").includes(q) ||
        k.ad.toLocaleLowerCase("tr").includes(q) ||
        k.tanim.toLocaleLowerCase("tr").includes(q) ||
        (k.raporKategorisi ?? "").toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [kalemler, arama, sekme]);

  const gruplanmis = useMemo(() => {
    const map = new Map<HesapAnaGrubu, HesapPlaniKalemi[]>();
    for (const grup of HESAP_ANA_GRUPLARI) map.set(grup, []);
    for (const k of filtrelenmis) map.get(k.anaGrup)?.push(k);
    return HESAP_ANA_GRUPLARI.map((grup) => ({ grup, kalemler: map.get(grup) ?? [] })).filter(
      (g) => g.kalemler.length > 0
    );
  }, [filtrelenmis]);

  function yeniEkleFormunuAc() {
    setDuzenlenenId(null);
    setForm(sekme !== "tumu" ? { ...BOS_FORM, anaGrup: sekme } : BOS_FORM);
    setFormHata(null);
    setFormAcik(true);
  }

  function duzenlemeyiAc(kalem: HesapPlaniKalemi) {
    setDuzenlenenId(kalem.id);
    setForm({
      kod: kalem.kod,
      ad: kalem.ad,
      anaGrup: kalem.anaGrup,
      tanim: kalem.tanim,
      raporKategorisi: kalem.raporKategorisi ?? "",
    });
    setFormHata(null);
    setFormAcik(true);
  }

  function formuKapat() {
    setFormAcik(false);
    setDuzenlenenId(null);
    setForm(BOS_FORM);
    setFormHata(null);
  }

  async function formuGonder() {
    if (!form.kod.trim() || !form.ad.trim()) {
      setFormHata("Hesap kodu ve hesap adı zorunludur.");
      return;
    }
    setKaydediliyor(true);
    setFormHata(null);
    try {
      const url = duzenlenenId ? `/api/hesap-plani/${duzenlenenId}` : "/api/hesap-plani";
      const method = duzenlenenId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `İstek başarısız (HTTP ${res.status})`);

      await listeyiYukle();
      setDurum({ tip: "basarili", mesaj: duzenlenenId ? "Kalem güncellendi." : "Kalem eklendi." });
      formuKapat();
    } catch (err) {
      setFormHata(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function sil(kalem: HesapPlaniKalemi) {
    const onay = window.confirm(`"${kalem.kod} - ${kalem.ad}" kalemini silmek istediğinize emin misiniz?`);
    if (!onay) return;
    try {
      const res = await fetch(`/api/hesap-plani/${kalem.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Silinemedi (HTTP ${res.status})`);
      setKalemler((prev) => prev.filter((k) => k.id !== kalem.id));
      setDurum({ tip: "basarili", mesaj: "Kalem silindi." });
    } catch (err) {
      setDurum({ tip: "hata", mesaj: err instanceof Error ? err.message : "Silinemedi" });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
        <b className="text-[var(--ink-soft)]">Not:</b> Bu liste Logo&apos;dan otomatik çekilmez —
        her hesap kalemini kod, ad, ana grup ve (en önemlisi) neyi kapsadığına dair bir tanımla
        elle siz girersiniz. Gelir tablosu ve diğer finansal kalemler hesaplanırken bundan sonra
        anahtar-kelime tahmini yerine burada tanımladığınız kesin hesap planı referans alınabilir.
        Veri bu bilgisayarda <code className="rounded bg-[var(--paper)] px-1 py-0.5">src/data/hesap-plani.json</code>{" "}
        dosyasında saklanır; canlı siteye (finszeka.com) yansıması için dosyanın commit edilip
        deploy edilmesi gerekir.
      </div>

      {/* Ana grup sekmeleri — "600'lü", "700'lü" gibi her grup ayrı bir sekme,
          alt alta değil; bir sekmeye tıklayınca sadece o grubun kalemleri görünür. */}
      {mevcutSekmeler.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 border-b border-[var(--line)] pb-2">
          <button
            type="button"
            onClick={() => setSekme("tumu")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              sekme === "tumu"
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "text-[var(--muted)] hover:bg-[var(--paper-card)] hover:text-[var(--ink-soft)]"
            }`}
          >
            Tümü
            <span className="ml-1.5 text-[10px] font-normal opacity-70">({kalemler.length})</span>
          </button>
          {mevcutSekmeler.map(({ grup, adet }) => (
            <button
              key={grup}
              type="button"
              onClick={() => setSekme(grup)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                sekme === grup
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:bg-[var(--paper-card)] hover:text-[var(--ink-soft)]"
              }`}
            >
              {grup}
              <span className="ml-1.5 text-[10px] font-normal opacity-70">({adet})</span>
            </button>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kod, ad, tanım ya da rapor kategorisinde ara..."
              className="w-72 max-w-full rounded-full border border-[var(--line)] bg-[var(--paper-card)] py-2 pl-9 pr-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brass)]"
            />
          </div>
          <button
            type="button"
            onClick={listeyiYukle}
            disabled={yukleniyor}
            className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper-card)] px-3.5 py-2 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshIcon className={`h-4 w-4 ${yukleniyor ? "animate-spin" : ""}`} />
            Yenile
          </button>
        </div>

        {!formAcik && (
          <button
            type="button"
            onClick={yeniEkleFormunuAc}
            className="flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink-soft)]"
          >
            <PlusIcon className="h-4 w-4" />
            Yeni Hesap Ekle
          </button>
        )}
      </div>

      {durum && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm ${
            durum.tip === "basarili"
              ? "border-[var(--positive)]/25 bg-[var(--positive)]/5 text-[var(--positive)]"
              : "border-[var(--negative)]/25 bg-[var(--negative)]/5 text-[var(--negative)]"
          }`}
        >
          {durum.mesaj}
        </div>
      )}

      {formAcik && (
        <div className="animate-rise-in rounded-2xl border border-[var(--brass)]/40 bg-[var(--paper-card)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
              {duzenlenenId ? "Hesap Kalemini Düzenle" : "Yeni Hesap Kalemi"}
            </h3>
            <button
              type="button"
              onClick={formuKapat}
              className="rounded-full p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink-soft)]"
              aria-label="Kapat"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--muted)]">
              Hesap Kodu *
              <input
                value={form.kod}
                onChange={(e) => setForm((f) => ({ ...f, kod: e.target.value }))}
                placeholder="ör. 600"
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brass)]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--muted)] sm:col-span-1 lg:col-span-2">
              Hesap Adı *
              <input
                value={form.ad}
                onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
                placeholder="ör. Yurtiçi Satışlar"
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brass)]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--muted)]">
              Ana Grup
              <select
                value={form.anaGrup}
                onChange={(e) => setForm((f) => ({ ...f, anaGrup: e.target.value as HesapAnaGrubu }))}
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brass)]"
              >
                {HESAP_ANA_GRUPLARI.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--muted)] sm:col-span-2 lg:col-span-4">
              Rapor Kategorisi <span className="font-normal normal-case">(opsiyonel — ör. Pazaryeri, E-Ticaret, Cari Satış, Grup Firmalar, Diğer Gelirler)</span>
              <input
                value={form.raporKategorisi ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, raporKategorisi: e.target.value }))}
                placeholder="Dashboard'daki hangi gelir kategorisine karşılık geliyor?"
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brass)]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--muted)] sm:col-span-2 lg:col-span-4">
              Tanım <span className="font-normal normal-case">(bu hesap neyi kapsar? hangi cariler/kanallar/kurallar buraya girer?)</span>
              <textarea
                value={form.tanim}
                onChange={(e) => setForm((f) => ({ ...f, tanim: e.target.value }))}
                rows={3}
                placeholder="ör. Trendyol, Hepsiburada, Amazon ve diğer pazaryeri carilerinden yapılan tüm satışlar."
                className="resize-y rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brass)]"
              />
            </label>
          </div>

          {formHata && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--negative)]/25 bg-[var(--negative)]/5 px-3 py-2 text-xs text-[var(--negative)]">
              <AlertIcon className="h-3.5 w-3.5 shrink-0" />
              {formHata}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={formuGonder}
              disabled={kaydediliyor}
              className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {kaydediliyor ? "Kaydediliyor..." : duzenlenenId ? "Güncelle" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={formuKapat}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink-soft)]"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {hata && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--negative)]/25 bg-[var(--negative)]/5 px-4 py-3 text-sm text-[var(--negative)]">
          <AlertIcon className="h-4 w-4 shrink-0" />
          {hata}
        </div>
      )}

      {yukleniyor ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] py-20 text-sm text-[var(--muted)]">
          Yükleniyor...
        </div>
      ) : gruplanmis.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line-strong)] py-20 text-center text-sm text-[var(--muted)]">
          <p>
            {kalemler.length === 0
              ? "Henüz hesap planı kalemi eklenmedi."
              : "Aramanızla eşleşen bir kalem bulunamadı."}
          </p>
          {kalemler.length === 0 && (
            <button
              type="button"
              onClick={yeniEkleFormunuAc}
              className="mt-1 text-sm font-medium text-[var(--brass-strong)] hover:underline"
            >
              İlk hesap kalemini ekle
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {gruplanmis.map(({ grup, kalemler: grupKalemleri }) => (
            <div key={grup} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-card)]">
              {sekme === "tumu" && (
                <div className="flex items-baseline justify-between gap-2 border-b border-[var(--line)] bg-[var(--brass-soft)]/40 px-4 py-2.5">
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-medium text-[var(--ink-soft)]">
                    {grup}
                  </h3>
                  <span className="text-xs text-[var(--muted)]">{grupKalemleri.length} kalem</span>
                </div>
              )}

              <div className="ledger-scroll overflow-x-auto">
                <table className="w-full min-w-[840px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                      <th className="px-4 py-2 font-medium">Kod</th>
                      <th className="px-4 py-2 font-medium">Hesap Adı</th>
                      <th className="px-4 py-2 font-medium">Rapor Kategorisi</th>
                      <th className="px-4 py-2 font-medium">Tanım</th>
                      <th className="px-4 py-2 font-medium">Güncellendi</th>
                      <th className="px-4 py-2 font-medium text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupKalemleri.map((k) => (
                      <tr key={k.id} className="border-t border-[var(--line)] align-top hover:bg-[var(--paper)]/60">
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[var(--ink-soft)]">{k.kod}</td>
                        <td className="px-4 py-2.5 font-medium text-[var(--ink)]">{k.ad}</td>
                        <td className="px-4 py-2.5 text-[var(--ink-soft)]">
                          {k.raporKategorisi ? (
                            <span className="rounded-full bg-[var(--brass)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brass-strong)]">
                              {k.raporKategorisi}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="max-w-[420px] px-4 py-2.5 text-[var(--ink-soft)]">
                          {k.tanim || <span className="text-xs text-[var(--muted)]">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-[var(--muted)]">
                          {formatTimestamp(k.guncellemeTarihi)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => duzenlemeyiAc(k)}
                              className="rounded-full p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink-soft)]"
                              aria-label="Düzenle"
                              title="Düzenle"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => sil(k)}
                              className="rounded-full p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--negative)]/10 hover:text-[var(--negative)]"
                              aria-label="Sil"
                              title="Sil"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
