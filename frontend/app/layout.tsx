import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // 1. Script 컴포넌트 불러오기
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
  // 사이트 정보
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

        {/* 2. AdMaven 광고 스크립트 (Pop + Interstitial 통합)
          - ID(1233768)가 같으므로 이 한 줄로 두 광고 형식이 모두 제어됩니다.
          - strategy="afterInteractive": 페이지가 로드된 직후에 광고를 불러와 속도 저하를 막습니다.
          - data-cfasync="false": 클라우드플레어 등 외부 간섭을 방지합니다.
        */}
        <Script
          id="admaven-script"
          src="//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1233768"
          strategy="afterInteractive"
          data-cfasync="false"
        />
      </body>
    </html>
  );
}