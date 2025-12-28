"use client";

import CountUp from 'react-countup';

export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
      {/* 1. 배경: 붉은 안개와 심장 박동 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-black to-black animate-pulse"></div>

      {/* 2. 상금 전광판 (글리치 효과 적용) */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center z-0 opacity-90">
        <p className="text-red-600 text-[10px] md:text-xs font-bold tracking-[0.4em] mb-1 uppercase animate-pulse">
          Current Prize Pool
        </p>

        {/* 글리치 효과가 적용된 텍스트 컨테이너 */}
        <div className="relative font-mono font-black group">

          {/* 메인 텍스트 */}
          <div className="relative z-10 text-4xl md:text-7xl text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] glitch-text">
            ₩ <CountUp start={950000} end={99999999} duration={100000} separator="," />
          </div>

          {/* 잔상 효과 (파란색/빨간색이 번갈아 보임) */}
          <div className="absolute top-0 left-0 -z-10 text-4xl md:text-7xl text-blue-500 opacity-70 animate-glitch-1">
             ₩ <CountUp start={950000} end={99999999} duration={100000} separator="," />
          </div>
          <div className="absolute top-0 left-0 -z-10 text-4xl md:text-7xl text-green-500 opacity-70 animate-glitch-2">
             ₩ <CountUp start={950000} end={99999999} duration={100000} separator="," />
          </div>
        </div>
      </div>

      {/* 3. CSS 애니메이션 정의 (글리치 효과) */}
      <style jsx>{`
        .glitch-text {
          animation: glitch-skew 1s infinite linear alternate-reverse;
        }
        @keyframes glitch-skew {
          0% { transform: skew(0deg); }
          10% { transform: skew(-2deg); }
          20% { transform: skew(2deg); }
          30% { transform: skew(0deg); }
          40% { transform: skew(1deg); }
          50% { transform: skew(-1deg); }
          60% { transform: skew(0deg); }
          70% { transform: skew(0deg); }
          80% { transform: skew(2deg); }
          90% { transform: skew(-2deg); }
          100% { transform: skew(0deg); }
        }
        .animate-glitch-1 {
          animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
          transform: translate(-2px, -2px);
        }
        .animate-glitch-2 {
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
          clip-path: polygon(0 80%, 100% 20%, 100% 100%, 0 100%);
          transform: translate(2px, 2px);
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); }
          20% { clip-path: inset(60% 0 10% 0); }
          40% { clip-path: inset(40% 0 50% 0); }
          60% { clip-path: inset(80% 0 5% 0); }
          80% { clip-path: inset(10% 0 70% 0); }
          100% { clip-path: inset(30% 0 50% 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); }
          20% { clip-path: inset(30% 0 20% 0); }
          40% { clip-path: inset(70% 0 10% 0); }
          60% { clip-path: inset(20% 0 50% 0); }
          80% { clip-path: inset(50% 0 30% 0); }
          100% { clip-path: inset(5% 0 80% 0); }
        }
      `}</style>
    </div>
  );
}