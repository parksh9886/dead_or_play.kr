"use client";

import CountUp from 'react-countup';

export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
      {/* 1. 배경: 붉은 안개와 심장 박동 (분위기용) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-black to-black animate-pulse"></div>

      {/* 2. 상금 전광판 (깔끔한 버전) */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center z-0 opacity-90">
        <p className="text-red-600 text-[10px] md:text-xs font-bold tracking-[0.4em] mb-1 uppercase animate-pulse">
          Current Prize Pool
        </p>

        {/* - 깔끔한 폰트 (font-mono)
           - 붉은색 그라데이션 (from-red-500 to-pink-800)
           - 은은한 붉은 그림자 (drop-shadow)
           - 95만원부터 천천히 올라감
        */}
        <div className="font-mono text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-pink-800 drop-shadow-[0_0_25px_rgba(220,38,38,0.6)]">
          ₩ <CountUp start={950000} end={99999999} duration={100000} separator="," />
        </div>
      </div>
    </div>
  );
}