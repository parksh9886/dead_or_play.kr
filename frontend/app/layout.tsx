import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// 👇 추가된 라이브러리 (없으면 에러나니 꼭 npm install 하세요)
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
  title: "DEAD OR PLAY",
  description: "운명을 건 서바이벌 게임. 총 상금 456억 원.",

  // 1. AdMaven 소유권 인증
  other: {
    "admaven-placement": "BrHr5qHs4",
  },

  // 2. 카톡/인스타 공유 시 뜨는 썸네일 설정 (OG Tag)
  openGraph: {
    title: "DEAD OR PLAY - 서바이벌 게임",
    description: "현재 당신의 친구들이 탈락하고 있습니다. 살아남을 수 있겠습니까?",
    url: "https://dead-or-play-kr.vercel.app", // 나중에 도메인 사면 여기 바꾸세요!
    siteName: "DEAD OR PLAY",
    images: [
      {
        url: "/og-image.png", // public 폴더에 이 이름으로 이미지를 넣으세요!
        width: 1200,
        height: 630,
      },
    ],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* 3. 예쁜 알림창 (alert 대신 사용) */}
        <Toaster position="top-center" richColors />

        {/* 4. 방문자 통계 (Vercel Analytics) */}
        <Analytics />

        {/* 5. AdMaven 광고 스크립트들 */}
        {/* AdMaven Pop (팝언더/인페이지 푸시) - ID: 1233768 */}
        <Script
          id="admaven-pop"
          src="//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1233768"
          strategy="afterInteractive"
          data-cfasync="false"
        />

        {/* AdMaven Interstitial (전면광고) - ID: 1233881 */}
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