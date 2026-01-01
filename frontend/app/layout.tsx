import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/react";
import { GoogleTagManager } from '@next/third-parties/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 1. 여기에 구매하신 도메인 주소를 넣으세요 (https:// 포함)
  // 예: https://www.dealordie.kr
  metadataBase: new URL("https://www.dealordie.kr"),

  title: "DEAL or DIE",
  description: "운명을 건 서바이벌 게임.",
  other: { "admaven-placement": "BrHr5qHs4" },

  openGraph: {
    title: "DEAL or DIE",
    description: "지금 당신의 친구들이 탈락하고 있습니다. 참여하시겠습니까?",
    // 2. 여기도 구매하신 도메인으로 바꿔주세요
    url: "https://www.dealordie.kr",
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
  // 🔥 [수정] 본인 인스타그램 주소로 변경하세요!
  const INSTA_URL = "https://www.instagram.com/deal_or_die.kr";

  return (
    <html lang="ko">
      <GoogleTagManager gtmId="GTM-WP88WKDF" />
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

        {/* ✅ [추가됨] 인스타그램 고정 배지 버튼 */}
        <a
          href={INSTA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] group active:scale-95"
        >
          {/* 인스타 아이콘 (SVG) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-black transition-colors"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>

          {/* 텍스트 */}
          <div className="flex flex-col items-start leading-none">
            <span className="text-[8px] text-gray-400 group-hover:text-gray-600 font-bold uppercase tracking-widest mb-[2px]">
              DEAL_or_DIE.kr
            </span>
            <span className="text-xs font-black tracking-wider">
              OFFICIAL
            </span>
          </div>
        </a>

        <Analytics />
      </body>
    </html>
  );
}