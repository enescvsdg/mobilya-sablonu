import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { hashClientIp } from "@/lib/client-ip";
import { clearFailedLogins, isLoginBlocked, recordFailedLogin } from "@/lib/login-throttle";
import { prisma } from "@/lib/prisma";

export const TOO_MANY_ATTEMPTS_CODE = "too_many_attempts";

/** Çok fazla hatalı denemeden sonra giriş geçici olarak kilitlenir. */
class TooManyLoginAttempts extends CredentialsSignin {
  code = TOO_MANY_ATTEMPTS_CODE;
}

/**
 * Kayıtlı olmayan bir e-postayla denendiğinde de aynı süre harcansın diye
 * karşılaştırılan sahte özet; aksi halde yanıt süresinden hangi
 * e-postanın kayıtlı olduğu anlaşılabilirdi.
 */
const DUMMY_PASSWORD_HASH = "$2b$12$ZBK9Mr6eeQbWmSo4HPQhHuXWlnG5DHsPzxCEtUGrGz5MmsNbavkeS";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Panel admin.<alan adı> alt alan adından, yerelde admin.localhost'tan
  // servis edilir; AUTH_URL/NEXTAUTH_URL tek bir sabit adrese bağlamaz.
  // trustHost olmadan Auth.js üretimde host header'ını reddedip genel bir
  // "server configuration" hatası verir — tüm girişleri kilitler.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Giriş formu da doğrudan /api/auth istekleri de buradan geçer; deneme
      // sınırı bu yüzden burada uygulanır.
      authorize: async (rawCredentials, request) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const { password } = parsed.data;
        const ipHash = hashClientIp(request.headers);

        if (await isLoginBlocked(email, ipHash)) {
          throw new TooManyLoginAttempts();
        }

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        const passwordMatches = await bcrypt.compare(
          password,
          admin?.passwordHash ?? DUMMY_PASSWORD_HASH
        );

        // Davet bekleyen (activatedAt boş) hesabın henüz şifresi yoktur.
        if (!admin || !admin.isActive || !admin.activatedAt || !passwordMatches) {
          await recordFailedLogin(email, ipHash);
          return null;
        }

        await clearFailedLogins(email, ipHash);
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });
        // İşlem kaydı (src/lib/activity.ts oturuma dayandığı için burada doğrudan).
        await prisma.activityLog
          .create({
            data: {
              userId: admin.id,
              userName: admin.name,
              action: "auth.login",
              summary: "Panele giriş yaptı",
            },
          })
          .catch((error) => console.error("[islem-kaydi] Yazılamadı:", error));

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          sessionVersion: admin.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // Bu alan eklenmeden önce açılmış oturumlarda yoktur; 0 sayılır.
        session.user.sessionVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      }
      return session;
    },
  },
});
