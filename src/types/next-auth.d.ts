import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      /** Girişteki oturum sürümü; veritabanındakiyle uyuşmazsa oturum geçersizdir. */
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    sessionVersion?: number;
  }
}
