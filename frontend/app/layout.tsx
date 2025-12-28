import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // Script 컴포넌트 사용
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEAD OR PLAY",
  description: "운명을 건 서바이벌 게임",
  // AdMaven 소유권 인증 태그
  other: {
    "admaven-placement": "BrHr5qHs4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* 1. AdMaven Pop (팝언더/인페이지 푸시) - ID: 1233768 */}
        <Script
          id="admaven-pop"
          src="//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1233768"
          strategy="afterInteractive"
          data-cfasync="false"
        />

        {/* 2. AdMaven Interstitial (전면광고) - ID: 1233881 (새로 추가됨) ✅ */}
        <Script
          id="admaven-interstitial"
          src="//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1233881"
          strategy="afterInteractive"
          data-cfasync="false"
        />
      </body>
    </html>
  );
}