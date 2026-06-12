import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Serif_KR, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/lib/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "CHECK ⬦ MATE",
    template: "%s ⬦ CHECKMATE",
  },
  description:
    "체크메이트에서 나만의 주얼리를 찾아보세요. 펜던트, 반지, 이어링, 브레이슬렛 등 다양한 주얼리 컬렉션.",
  keywords: [
    "주얼리",
    "목걸이",
    "반지",
    "이어링",
    "귀걸이",
    "브레이슬렛",
    "펜던트",
    "체크메이트",
  ],
  openGraph: {
    title: "CHECKMATE — 나만의 주얼리 쇼핑몰",
    description: "체크메이트에서 나만의 주얼리를 찾아보세요.",
    type: "website",
    images: ["/og-image.png"],
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${cormorant.variable} ${notoSerifKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
