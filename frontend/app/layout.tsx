import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEAL or DIE",
  description: "운명을 건 서바이벌 게임.",
  other: { "admaven-placement": "BrHr5qHs4" },
  openGraph: {
    title: "DEAL or DIE",
    description: "지금 당신의 친구들이 탈락하고 있습니다. 참여하시겠습니까?",
    url: "https://dead-or-play-kr.vercel.app",
    siteName: "DEAL or DIE",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>

        {/* 📺 배경 효과 추가 */}
        <div className="bg-noise"></div>
        <div className="bg-scanline"></div>

        {children}

        {/* 알림창: 블랙 & 화이트 테마 */}
        <Toaster
          position="top-center"
          visibleToasts={1}
          closeButton={true}
          theme="dark"
          duration={2000}
          style={{ marginTop: '20px', fontWeight: 'bold', border: '1px solid #333' }}
        />

        <Analytics />
      </body>
    </html>
  );
}