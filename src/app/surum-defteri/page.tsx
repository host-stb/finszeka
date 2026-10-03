import Link from "next/link";
import { APP_VERSION } from "@/lib/app-version";
import { releaseHistory } from "@/lib/release-history";

export const metadata = { title: "Sürüm Defteri · Finszeka" };
export default function ReleaseHistoryPage() {
  const records = releaseHistory();
  const dates = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-[var(--muted)] hover:underline">← Ana sayfa</Link>
      <h1 className="mt-5 text-3xl font-semibold">Sürüm Defteri</h1>
      <p className="mt-2 text-[var(--ink-soft)]">Kullanılan sürüm: <strong>v{APP_VERSION}</strong></p>
      <p className="mt-3 text-sm text-[var(--muted)]">Değişiklikler en yeniden eskiye sıralanır. Tarihler Türkiye saatine göre kodun kayıt tarihidir. Sürüm numarası kullanılmadan önceki değişiklikler “Önceki güncelleme” olarak gösterilir.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper-card)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--line)]"><tr><th className="p-4">Sürüm / kayıt</th><th className="p-4">Kayıt tarihi</th><th className="p-4">Değişiklik</th></tr></thead>
          <tbody>{records.map(record => (
            <tr key={record.revision} className="border-b border-[var(--line)] last:border-0">
              <td className="p-4 align-top"><span className="whitespace-nowrap font-medium">{record.version ? `v${record.version}+${record.revision.slice(0, 12)}` : "Önceki güncelleme"}</span>{!record.version && <div className="mt-1 text-xs text-[var(--muted)]">{record.revision.slice(0, 12)}</div>}</td>
              <td className="whitespace-nowrap p-4 align-top text-[var(--muted)]">{dates.format(new Date(record.date))}</td>
              <td className="min-w-64 p-4 align-top">{record.summary}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
