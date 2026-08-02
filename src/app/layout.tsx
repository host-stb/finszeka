import type { Metadata } from "next";
import { auth, signOut } from "@/auth";
import "./globals.css";

// Not: next/font/google (Geist) yerine sistem fontu kullanılıyor — build
// sırasında Google Fonts'a internet erişimi gerektirmesin diye (ör. kapalı
// ağ/CI ortamları). İsterseniz next/font/google ile tekrar değiştirebilirsiniz.

export const metadata: Metadata = {
  title: "Gelir Raporu",
  description: "Firma bazlı aylık gelir raporu",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {session?.user && (
          <div className="flex items-center justify-end gap-3 border-b border-[var(--line)] bg-[var(--paper-card)] px-4 py-1.5 text-xs text-[var(--muted)]">
            <span>{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/giris" });
              }}
            >
              <button type="submit" className="font-medium text-[var(--ink-soft)] hover:underline">
                Çıkış Yap
              </button>
            </form>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
