import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

// Sadece gerçekten HTTPS ile yayındaysak alt kaynakları HTTPS'e yükselt;
// aksi halde yerelde `pnpm start` ile http://localhost test edilemez.
const isHttpsSite = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? "https://" : "")
).startsWith("https://");

/**
 * Content-Security-Policy.
 *
 * - `'unsafe-inline'` script için gereklidir: Next.js sayfayı canlandıran
 *   bootstrap script'ini satır içi basar. Nonce'a geçmek proxy'de her isteğe
 *   nonce üretip tüm sayfaları dinamik hale getirmeyi gerektirir.
 * - `'unsafe-eval'` yalnızca geliştirmede; Turbopack HMR buna ihtiyaç duyar.
 * - Satır içi style, Tailwind ve Framer Motion'ın `style` attribute'ları için.
 * - `frame-ancestors 'self'` sitenin başka bir alan adına gömülmesini
 *   (clickjacking / içerik çalma) engeller.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co" + (isDev ? " ws: wss:" : ""),
  // İletişim sayfasındaki Google Haritalar gömülü çerçevesi.
  "frame-src 'self' https://maps.google.com https://www.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isHttpsSite ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // MIME sniffing kapalı — yüklenen dosyaların script olarak yorumlanmasını önler.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // HSTS: bir kez HTTPS ile girildikten sonra tarayıcı HTTP'ye düşmez.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Panelden görsel yükleme. Varsayılan 1 MB bir fotoğrafa yetmiyor;
      // Vercel'in istek sınırı 4,5 MB olduğundan 4 MB'ta tutulur.
      // Tarayıcı da görselleri göndermeden önce küçültür
      // (src/components/admin/image-file-input.tsx).
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // Supabase Storage'a yüklenen görseller (Faz 7) için — proje adı
    // henüz belli olmadığından tüm *.supabase.co alt alanları kabul
    // edilir, bu genel/güvenli bir kapsam (sadece Supabase'in kendi
    // domain'i).
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
    // Site görselleri en fazla 1920 px genişlikte dağıtılır (varsayılan
    // 3840'a kadar çıkar); yüksek çözünürlüklü kopya sitede hiç bulunmaz.
    // Panel de yüklemeden önce aynı sınıra küçültür (image-file-input.tsx).
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Sekme simgesi marka ayarından üretilir (src/app/icon.tsx); /favicon.ico
  // isteyen tarayıcı ve arama motorları da aynı PNG'yi alır.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default withNextIntl(nextConfig);
