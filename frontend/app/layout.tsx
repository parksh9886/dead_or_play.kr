import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  // 1. 사이트 이름과 설명 수정 (선택사항)
  title: "DEAD OR PLAY",
  description: "운명을 건 서바이벌 게임",

  // 2. AdMaven 인증 태그 추가 (필수) ✅
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
    // 3. 한국어 사이트이므로 언어 설정을 "ko"로 변경
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}