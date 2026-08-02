import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Tüm site (sayfalar + /api/companies, /api/report dahil) giriş gerektirir;
// sadece NextAuth'un kendi /api/auth/* uç noktaları ve /giris sayfası hariç.
// Not: Next.js 16'da "middleware.ts" konvansiyonu "proxy.ts" olarak değişti,
// dosya adı bu yüzden proxy.ts.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = pathname.startsWith("/api/auth") || pathname === "/giris";

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const url = new URL("/giris", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
