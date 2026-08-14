"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCurrency, formatInteger } from "@/lib/format";
import { ApiEnvelope } from "@/lib/types";
import { KutuGranularite, KutuSeri, KutuSeriNoktasi } from "@/lib/kutu-types";
import { RefreshIcon } from "./icons";

const TAM_AY_ADLARI = [
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
];

// Şirket serileri için sabit renk sırası (kategorik kimlik hep aynı renge
// eşlenir) — mevcut "brass" vurgu rengi + tema ile uyumlu ikinci/üçüncü ton.
// 2'den fazla şirket olursa (ör. STB A.Ş. eklenince) döngüye devam eder.
const SIRKET_RENKLERI = ["var(--brass)", "#5b7b8c", "#8a8378", "#a3372c"];

function sirketRengi(index: number): string {
  return SIRKET_RENKLERI[index % SIRKET_RENKLERI.length];
}

interface KutuTooltipPayload {
  payload: KutuSeriNoktasi;
}

/** Stacked çubuk grafikteki tek bir dataKey segmentini tanımlar — web mağaza
 *  kırılımı olan şirketler için "web"/"diger" olarak ikiye bölünür. */
interface BarSerisi {
  key: string;
  renk: string;
  altKanal: "web" | "diger" | null;
}

function KutuTooltip({ active, payload }: { active?: boolean; payload?: KutuTooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const n = payload[0].payload;
  if (n.veriAlinamadi) {
    return (
      <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
        <p className="font-[family-name:var(--font-display)] text-sm">{n.label}</p>
        <p className="mt-0.5 text-sm font-medium text-[var(--negative)]">Veri alınamadı</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
      <p className="font-[family-name:var(--font-display)] text-sm">{n.label}</p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--brass-soft)]">
        {formatInteger(n.kutuAdedi)} kutu
      </p>
      <p className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--paper)]/80">
        {formatCompactCurrency(n.ciroTl)} ₺
        {n.ciroKutuTl !== null && ` · kutu başı ₺${formatCurrency(n.ciroKutuTl)}`}
      </p>
      {n.sirketler.length > 1 && (
        <div className="mt-1.5 flex flex-col gap-0.5 border-t border-[var(--paper)]/15 pt-1.5">
          {n.sirketler.map((s, i) => (
            <div key={s.sirket} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[11px] tabular-nums text-[var(--paper)]/85">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: sirketRengi(i) }}
                />
                <span className="flex-1">{s.sirket}</span>
                <span className="font-[family-name:var(--font-mono)]">{formatInteger(s.kutuAdedi)} kutu</span>
              </div>
              {s.webMagaza && (
                <div className="flex items-center gap-1.5 pl-3 text-[10px] tabular-nums text-[var(--paper)]/60">
                  <span className="flex-1">└ Web Mağaza (e-ticaret)</span>
                  <span className="font-[family-name:var(--font-mono)]">{formatInteger(s.webMagaza.kutuAdedi)} kutu</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RasyoTooltip({ active, payload }: { active?: boolean; payload?: KutuTooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const n = payload[0].payload;
  if (n.veriAlinamadi || n.ciroKutuTl === null) {
    return (
      <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
        <p className="font-[family-name:var(--font-display)] text-sm">{n.label}</p>
        <p className="mt-0.5 text-sm font-medium text-[var(--negative)]">
          {n.veriAlinamadi ? "Veri alınamadı" : "Satış yok"}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
      <p className="font-[family-name:var(--font-display)] text-sm">{n.label}</p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--brass-soft)]">
        ₺{formatCurrency(n.ciroKutuTl)}
      </p>
      {n.ciroKutuEur !== null && n.ciroKutuUsd !== null && (
        <p className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--paper)]/80">
          €{formatCurrency(n.ciroKutuEur)} · ${formatCurrency(n.ciroKutuUsd)}
        </p>
      )}
    </div>
  );
}

const BASLIKLAR: Record<KutuGranularite, { baslik: string; aciklama: string }> = {
  gunluk: { baslik: "Günlük", aciklama: "Seçilen ayın gün gün kutu adedi ve kutu başına ciro." },
  haftalik: { baslik: "Haftalık", aciklama: "Son 12 hafta (Pazartesi–Pazar) kutu adedi ve kutu başına ciro." },
  aylik: { baslik: "Aylık", aciklama: "Seçilen yılın ay ay kutu adedi ve kutu başına ciro." },
  yillik: { baslik: "Yıllık", aciklama: "Logo mirror'daki en eski faturadan bugüne yıl yıl kutu adedi ve kutu başına ciro." },
};

export default function KutuSeriChart({ granularite }: { granularite: KutuGranularite }) {
  const bugun = new Date();
  const buYil = bugun.getUTCFullYear();
  const buAy = bugun.getUTCMonth() + 1;

  const [yil, setYil] = useState(buYil);
  const [ay, setAy] = useState(buAy);
  const [seri, setSeri] = useState<KutuSeri | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ granularite });
      if (granularite === "aylik" || granularite === "gunluk") qs.set("yil", String(yil));
      if (granularite === "gunluk") qs.set("ay", String(ay));
      const res = await fetch(`/api/kutu-trend/seri?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Kutu trendi verisi alınamadı (HTTP ${res.status})`);
      const envelope: ApiEnvelope<KutuSeri> = await res.json();
      setSeri(envelope.data);
      setSource(envelope.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [granularite, yil, ay]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- granularite/yıl/ay değişince trend verisini çekiyoruz
    load();
  }, [load]);

  const { baslik, aciklama } = BASLIKLAR[granularite];
  const kur = seri?.kur ?? null;

  // Şirket isimlerini (+ web mağaza kırılımı olup olmadığını) serideki ilk
  // "veriAlinamadi olmayan" noktadan çıkar — stacked bar için sabit bir
  // sütun sırası lazım.
  const sirketBilgileri = useMemo(() => {
    const ilkGecerli = seri?.noktalar.find((n) => !n.veriAlinamadi && n.sirketler.length > 0);
    return ilkGecerli
      ? ilkGecerli.sirketler.map((s) => ({ ad: s.sirket, webMagazaVar: s.webMagaza !== undefined }))
      : [];
  }, [seri]);

  const sirketIsimleri = useMemo(() => sirketBilgileri.map((s) => s.ad), [sirketBilgileri]);

  // Web mağaza kırılımı olan şirketler için çubuğu iki alt-segmente ayırır
  // (Web Mağaza + Diğer Kanallar) — aynı renk, alt segment daha soluk
  // (dataviz: yeni renk eklemek yerine mevcut kategorik rengin tonu).
  const barSeriler = useMemo<BarSerisi[]>(
    () =>
      sirketBilgileri.flatMap(({ ad, webMagazaVar }, i): BarSerisi[] => {
        const renk = sirketRengi(i);
        if (webMagazaVar) {
          return [
            { key: `${ad}::web`, renk, altKanal: "web" },
            { key: `${ad}::diger`, renk, altKanal: "diger" },
          ];
        }
        return [{ key: ad, renk, altKanal: null }];
      }),
    [sirketBilgileri]
  );

  const webMagazaBolunmusVar = useMemo(() => sirketBilgileri.some((s) => s.webMagazaVar), [sirketBilgileri]);

  // Recharts her seriyi düz bir alan (dataKey) olarak beklediği için,
  // sirketler[] dizisini { ..., "Holimer": 123, "Fw İlaç": 45 } şeklinde
  // düzleştiriyoruz. Web mağaza kırılımı olan şirketler için tek anahtar
  // yerine "Holimer::web" / "Holimer::diger" gibi iki anahtara bölünür.
  const chartData = useMemo(
    () =>
      (seri?.noktalar ?? []).map((n) => {
        const duz: Record<string, unknown> = { ...n };
        for (const s of n.sirketler) {
          if (s.webMagaza) {
            duz[`${s.sirket}::web`] = s.webMagaza.kutuAdedi;
            duz[`${s.sirket}::diger`] = Math.max(0, s.kutuAdedi - s.webMagaza.kutuAdedi);
          } else {
            duz[s.sirket] = s.kutuAdedi;
          }
        }
        return duz;
      }),
    [seri]
  );

  return (
    <div className="animate-rise-in flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            {baslik} Kutu Trendi
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{seri?.aciklama ?? aciklama}</p>
        </div>
        <div className="flex items-center gap-2">
          {(granularite === "aylik" || granularite === "gunluk") && (
            <select
              value={yil}
              onChange={(e) => setYil(Number(e.target.value))}
              className="rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink-soft)] outline-none"
            >
              {Array.from({ length: 6 }, (_, i) => buYil - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {granularite === "gunluk" && (
            <select
              value={ay}
              onChange={(e) => setAy(Number(e.target.value))}
              className="rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink-soft)] outline-none"
            >
              {TAM_AY_ADLARI.map((ad, i) => (
                <option key={ad} value={i + 1}>
                  {ad}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--negative)]/25 bg-[var(--negative)]/5 px-4 py-3 text-sm text-[var(--negative)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-56 items-center justify-center gap-2 text-sm text-[var(--muted)]">
          <RefreshIcon className="h-4 w-4 animate-spin" />
          Yükleniyor...
        </div>
      ) : seri && seri.noktalar.length > 0 ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Toplam kutu · toplam ciro (TÜMÜ şirketler)
              </p>
              <p className="font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--ink)]">
                {formatInteger(seri.toplamKutu)} kutu
                <span className="ml-2 text-base font-normal text-[var(--muted)]">
                  · {formatCompactCurrency(seri.toplamCiroTl)} ₺
                </span>
              </p>
              {seri.sirketToplamlari.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {seri.sirketToplamlari.map((s, i) => (
                    <div key={s.sirket} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: sirketRengi(i) }}
                        />
                        <span className="font-medium">{s.sirket}:</span>
                        <span className="font-[family-name:var(--font-mono)] tabular-nums">
                          {formatInteger(s.kutuAdedi)} kutu · {formatCompactCurrency(s.ciroTl)} ₺
                        </span>
                      </div>
                      {s.webMagaza && (
                        <div className="flex items-center gap-1.5 pl-3.5 text-[11px] text-[var(--muted)]">
                          <span>└ Web Mağaza (e-ticaret):</span>
                          <span className="font-[family-name:var(--font-mono)] tabular-nums">
                            {formatInteger(s.webMagaza.kutuAdedi)} kutu · {formatCompactCurrency(s.webMagaza.ciroTl)} ₺
                            {s.kutuAdedi > 0 && ` · %${((s.webMagaza.kutuAdedi / s.kutuAdedi) * 100).toFixed(0)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {source === "mock" && (
              <span className="rounded-full bg-[var(--brass)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--brass-strong)]">
                ○ Örnek Veri
              </span>
            )}
          </div>

          {kur?.alinamadi && (
            <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--brass)]/5 px-4 py-2.5 text-xs text-[var(--brass-strong)]">
              TCMB kuruna şu an ulaşılamadı — EUR/USD kolonları bu yüzden boş. TL rakamları
              gerçek ve güncel.
            </div>
          )}

          {!seri.webMagazaHesaplandi && seri.sirketToplamlari.length > 0 && (
            <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-2.5 text-xs text-[var(--muted)]">
              Web mağaza (e-ticaret) kırılımı bu görünümde hesaplanmıyor veya bu dönem için
              alınamadı — performans nedeniyle yalnızca Günlük ve Haftalık sekmelerinde
              hesaplanır.
            </div>
          )}

          {/* Kutu adedi — şirket bazlı yığılmış (stacked) çubuk grafik */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Toplam Satılan Kutu Adedi — Şirket Kırılımı
              </p>
              {sirketIsimleri.length > 1 && (
                <div className="flex items-center gap-3">
                  {sirketIsimleri.map((ad, i) => (
                    <div key={ad} className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: sirketRengi(i) }}
                      />
                      {ad}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-48 w-full sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    axisLine={{ stroke: "var(--line-strong)" }}
                    tickLine={false}
                    interval={granularite === "gunluk" ? 2 : 0}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatInteger(v)}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip content={<KutuTooltip />} cursor={{ fill: "var(--line)", opacity: 0.4 }} />
                  {barSeriler.length > 0 ? (
                    barSeriler.map((s, i) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        stackId="kutu"
                        fill={s.renk}
                        fillOpacity={s.altKanal === "diger" ? 0.35 : 1}
                        radius={i === barSeriler.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))
                  ) : (
                    <Bar dataKey="kutuAdedi" radius={[4, 4, 0, 0]} fill="var(--line-strong)" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {webMagazaBolunmusVar && (
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                Koyu ton: Web Mağaza (e-ticaret, holistikmarket.com + pazaryerleri) · Açık ton:
                diğer kanallar (distribütör/eczane/toptan vb.)
              </p>
            )}
          </div>

          {/* Kutu başına ciro — ayrı eksen (dataviz kuralı: tek eksen, farklı ölçekler ayrı grafikte) */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Kutu Başına Ciro (TL) — TÜMÜ şirketler
            </p>
            <div className="h-40 w-full sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    axisLine={{ stroke: "var(--line-strong)" }}
                    tickLine={false}
                    interval={granularite === "gunluk" ? 2 : 0}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `₺${formatInteger(v)}`}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                  />
                  <Tooltip content={<RasyoTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
                  <Line
                    type="monotone"
                    dataKey="ciroKutuTl"
                    stroke="var(--brass)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--brass)", strokeWidth: 0 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tablo — TL / EUR / USD (TÜMÜ şirketler toplamı) */}
          <div className="ledger-scroll max-h-72 overflow-y-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--paper-card)] text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                <tr className="border-b border-[var(--line)]">
                  <th className="px-3 py-2 text-left">Dönem</th>
                  <th className="px-3 py-2 text-right">Kutu Adedi</th>
                  <th className="px-3 py-2 text-right">Ciro (TL)</th>
                  <th className="px-3 py-2 text-right">Ciro/Kutu (TL)</th>
                  <th className="px-3 py-2 text-right">Ciro/Kutu (EUR)</th>
                  <th className="px-3 py-2 text-right">Ciro/Kutu (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {seri.noktalar.map((n) => (
                  <tr key={n.key} className="hover:bg-[var(--paper)]">
                    <td className="px-3 py-2 text-[var(--ink-soft)]">{n.label}</td>
                    {n.veriAlinamadi ? (
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-medium text-[var(--negative)]">
                        Veri alınamadı — FastAPI&apos;ye bu dönem için ulaşılamadı
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatInteger(n.kutuAdedi)}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatCurrency(n.ciroTl)}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] font-semibold tabular-nums text-[var(--ink)]">
                          {n.ciroKutuTl !== null ? formatCurrency(n.ciroKutuTl) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                          {n.ciroKutuEur !== null ? formatCurrency(n.ciroKutuEur) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                          {n.ciroKutuUsd !== null ? formatCurrency(n.ciroKutuUsd) : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Şirket bazlı toplam tablosu */}
          {seri.sirketToplamlari.length > 1 && (
            <div className="rounded-xl border border-[var(--line)]">
              <table className="w-full text-sm">
                <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-3 py-2 text-left">Şirket</th>
                    <th className="px-3 py-2 text-right">Kutu Adedi</th>
                    <th className="px-3 py-2 text-right">Ciro (TL)</th>
                    <th className="px-3 py-2 text-right">Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {seri.sirketToplamlari.map((s, i) => (
                    <Fragment key={s.sirket}>
                      <tr>
                        <td className="px-3 py-2 text-[var(--ink-soft)]">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: sirketRengi(i) }}
                            />
                            {s.sirket}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatInteger(s.kutuAdedi)}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatCurrency(s.ciroTl)}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                          {seri.toplamCiroTl > 0 ? `${((s.ciroTl / seri.toplamCiroTl) * 100).toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                      {s.webMagaza && (
                        <tr className="bg-[var(--paper)]/60">
                          <td className="px-3 py-1.5 pl-8 text-xs text-[var(--muted)]">
                            └ Web Mağaza (e-ticaret)
                          </td>
                          <td className="px-3 py-1.5 text-right font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--muted)]">
                            {formatInteger(s.webMagaza.kutuAdedi)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--muted)]">
                            {formatCurrency(s.webMagaza.ciroTl)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--muted)]">
                            {s.kutuAdedi > 0
                              ? `${((s.webMagaza.kutuAdedi / s.kutuAdedi) * 100).toFixed(1)}% (şirket içi)`
                              : "—"}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {kur && !kur.alinamadi && (
            <p className="text-[11px] text-[var(--muted)]">
              Kur: TCMB gösterge kuru ({kur.tarih}) — USD alış {formatCurrency(kur.usdAlis)} / satış{" "}
              {formatCurrency(kur.usdSatis)} · EUR alış {formatCurrency(kur.eurAlis)} / satış{" "}
              {formatCurrency(kur.eurSatis)}. EUR/USD kolonları ortalama kur ile hesaplanmıştır.
            </p>
          )}
        </>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
          Bu dönem için veri yok.
        </div>
      )}
    </div>
  );
}
