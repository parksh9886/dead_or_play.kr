// src/components/Background.tsx
"use client";

import CountUp from 'react-countup';

export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
      {/* 1. 배경: 붉은 안개와 심장 박동 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-black to-black animate-pulse"></div>

      {/* 2. 상금 전광판 */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center z-0 opacity-90">
        <p className="text-red-500 text-[10px] md:text-xs font-bold tracking-[0.4em] mb-1 uppercase animate-pulse">
          TOTAL PRIZE POOL
        </p>
        <div className="font-mono text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-pink-800 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
          {/* 상금 연출 */}
          ₩ <CountUp start={45600000000} end={45699999999} duration={80000} separator="," />
        </div>
      </div>
    </div>
  );
}