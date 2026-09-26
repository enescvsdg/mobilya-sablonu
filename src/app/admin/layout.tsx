import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { brand } from "@/config/brand";
import { brandCssVariables } from "@/lib/brand-theme";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Sayfalar yalnızca kendi adını verir ("Kullanıcılar"); şablon markayı ekler.
  title: { default: `${brand.name} Admin`, template: `%s — ${brand.name} Admin` },
  description: `${brand.name} yönetim paneli.`,
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={brandCssVariables}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
