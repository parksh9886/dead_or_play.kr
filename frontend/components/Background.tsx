"use client";

import CountUp from 'react-countup';

export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">

      {/* 1. TV 노이즈 (기존 유지) */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none z-0"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* 2. [NEW] 붉은 심장 박동 (Red Pulse) */}
      {/* 4초마다 천천히 붉은 기운이 올라왔다 사라짐 */}
      <div className="absolute inset-0 bg-red-900/10 animate-[pulse_4s_ease-in-out_infinite] pointer-events-none z-0 mix-blend-screen"></div>

      {/* 3. 화면 비네팅 (가장자리 어둡게) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)] z-0"></div>

      {/* 4. [NEW] 감시자 시점 (CCTV 코너 장식) */}
      {/* 왼쪽 위 */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg z-10"></div>
      {/* 오른쪽 위 */}
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg z-10"></div>
      {/* 왼쪽 아래 */}
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg z-10"></div>
      {/* 오른쪽 아래 */}
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-lg z-10"></div>

        {/* LIVE 배지 */}
        <div className="flex items-center gap-2 mb-3 bg-red-950/30 px-3 py-1 rounded border border-red-600/30 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]"></div>
            <span className="text-red-500 text-xs font-bold tracking-widest font-mono">ON AIR</span>
        </div>

        <p className="text-gray-600 text-[10px] md:text-xs tracking-[0.3em] mb-1 uppercase font-mono">
          Total Bounty
        </p>

        {/* 상금: 화이트 & 레드 그림자 */}
        <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] tracking-tighter">
          ₩ <CountUp start={45500000} end={45600000000} duration={500000} separator="," />
        </div>
      </div>
    </div>
  );
}