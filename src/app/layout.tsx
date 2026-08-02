import type { Metadata } from "next";
import "./globals.css";

// Not: next/font/google (Geist) yerine sistem fontu kullanılıyor — build
// sırasında Google Fonts'a internet erişimi gerektirmesin diye (ör. kapalı
// ağ/CI ortamları). İsterseniz next/font/google ile tekrar değiştirebilirsiniz.

export const metadata: Metadata = {
  title: "Gelir Raporu",
  description: "Firma bazlı aylık gelir raporu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
