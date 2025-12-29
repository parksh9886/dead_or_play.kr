import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// 👇 라이브러리 임포트
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
    url: "https://dead-or-play-kr.vercel.app",
    siteName: "DEAD OR PLAY",
    images: [
      {
        url: "/og-image.png",
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

        {/* 3. 알림창 설정 (수정됨: 광클 방지 & 위치 조정) */}
        <Toaster
          position="top-center"   // 상단 중앙 (모바일 키보드 간섭 최소화)
          visibleToasts={1}       // 🔥 한번에 1개만 표시 (광클해도 알림창 안 쌓임)
          closeButton={true}      // 닫기 버튼 추가
          theme="dark"            // 다크 모드
          duration={2000}         // 2초 뒤 자동 삭제
          style={{
            marginTop: '10px',    // 모바일 상단 여백 확보
            fontWeight: 'bold'
          }}
          // richColors={true}  <-- (요청하신 대로 뺀 상태 유지)
        />

        {/* 4. 방문자 통계 (Vercel Analytics) */}
        <Analytics />

        {/* 5. AdMaven 광고 스크립트들 */}

        {/* (중요) 서비스 워커 파일 연결 - 아까 다운받은 sw.js가 public 폴더에 있어야 작동합니다 */}
        <Script
          id="admaven-sw"
          src="/sw.js"
          strategy="afterInteractive"
          data-cfasync="false"
        />

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

        {/* 🔥 [추가됨] AdMaven 추가 광고 (요청하신 스크립트) - ID: 1234224 */}
        <Script
          id="admaven-additional"
          src="//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1234224"
          strategy="afterInteractive"
          data-cfasync="false"
        />

      </body>
    </html>
  );
}