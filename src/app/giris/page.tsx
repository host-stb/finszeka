import { signIn } from "@/auth";

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-8 text-center shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--brass)]">
          Gelir Defteri
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--ink)]">
          Giriş Yapın
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Bu pano sadece yetkili Google hesaplarına açıktır.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-[var(--negative)]/25 bg-[var(--negative)]/5 px-3 py-2 text-xs text-[var(--negative)]">
            Bu hesapla giriş yapma yetkiniz yok. Erişim gerekiyorsa yöneticinizle iletişime
            geçin.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink-soft)]"
          >
            Google ile Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
