"use client";

import CountUp from 'react-countup';

export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">

      {/* 화면 비네팅 (가장자리 어둡게) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>

      {/* 상단 상금 표시 */}
      <div className="absolute top-8 left-0 right-0 flex flex-col items-center z-10">

        {/* LIVE 배지 */}
        <div className="flex items-center gap-2 mb-3 bg-red-600/10 px-3 py-1 rounded border border-red-600/50 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-red-500 text-xs font-bold tracking-widest">LIVE</span>
        </div>

        <p className="text-gray-500 text-[10px] md:text-xs tracking-[0.2em] mb-1 uppercase">
          Current Prize Pool
        </p>

        {/* 상금: 화이트 & 레드 그림자 */}
        <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,0,0,0.4)] tracking-tighter">
          ₩ <CountUp start={950000} end={45600000000} duration={100000} separator="," />
        </div>
      </div>
    </div>
  );
}