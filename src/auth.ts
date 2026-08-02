import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Sadece bu ortam değişkeninde (virgülle ayrılmış) listelenen e-postalar
// Google ile giriş yapabilir. Yanlış yapılandırma durumunda GÜVENLİK GEREĞİ
// herkesi reddeder (fail-closed) — boş/eksikse hiç kimse giremez.
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/giris",
    error: "/giris",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      if (ALLOWED_EMAILS.length === 0) {
        console.warn(
          "[auth] ALLOWED_EMAILS tanımlı değil — güvenlik gereği tüm girişler reddediliyor."
        );
        return false;
      }
      return ALLOWED_EMAILS.includes(user.email.toLowerCase());
    },
  },
});
