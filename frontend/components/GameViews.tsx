"use client";

// 1. 탈락 화면 (You Died) - 멘트 수정됨
export function DeathView({ userState, roundData, eliminatedCount, handleShare }: any) {
  return (
    <div className="text-center animate-fade-in bg-black/70 p-6 md:p-8 rounded-3xl border border-red-900/80 shadow-[0_0_50px_rgba(220,38,38,0.3)] backdrop-blur-md w-full">
      <h1 className="text-5xl md:text-7xl font-black text-red-600 mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,1)]">
        YOU DIED
      </h1>

      {/* 🔥 여기가 변경되었습니다: 몇 번째 희생자인지 강조 */}
      <div className="mb-8">
        <p className="text-gray-400 text-sm font-bold mb-1">
          GAME OVER : STAGE {userState.stage}
        </p>
        <p className="text-white text-lg md:text-2xl font-bold mt-4">
          당신은 <span className="text-red-600 text-4xl md:text-5xl font-black underline decoration-red-900 decoration-4 underline-offset-4">{eliminatedCount}번째</span>
        </p>
        <p className="text-white text-lg md:text-2xl font-bold">
          희생자입니다.
        </p>
      </div>

      <div className="bg-gray-900/60 rounded-xl p-4 mb-8 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500">CURRENT STATUS</span>
          <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
        </div>
        <p className="text-lg md:text-xl font-black text-white">{roundData?.title || "게임 진행 중"}</p>
      </div>

      <div className="space-y-3">
        <button onClick={handleShare} className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-lg md:text-xl rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 animate-pulse">
          📤 유언장 남기기 (공유)
        </button>
        <p className="text-xs text-gray-500 mt-2">친구도 당신의 뒤를 따를까요?</p>
      </div>
    </div>
  );
}

// 2. 생존자 게임 화면 (Alive) - 기존과 동일
export function SurvivorView({ userState, roundData, handleGameAction }: any) {
  return (
    <div className="bg-black/70 p-6 md:p-8 rounded-3xl border-4 border-pink-600/50 shadow-[0_0_40px_rgba(236,72,153,0.4)] backdrop-blur-md w-full">
      <div className="text-center mb-8">
        <div className="inline-block bg-pink-600 px-4 py-1 rounded-full text-xs font-bold mb-4 shadow-lg">
          STAGE {userState?.stage}
        </div>
        <h2 className="text-2xl md:text-4xl font-black mb-2 text-white break-keep">
          {roundData.title}
        </h2>
        <p className="text-gray-300 text-xs md:text-sm break-keep">{roundData.description}</p>
      </div>
      <div className="space-y-4">
        <button onClick={() => handleGameAction('A')} className="w-full py-5 md:py-6 bg-gray-900/80 border-2 border-pink-500/50 rounded-2xl font-black text-xl md:text-2xl text-white hover:bg-pink-600 hover:border-pink-600 transition-all active:scale-95 shadow-lg">
          {roundData.choice_a}
        </button>
        <button onClick={() => handleGameAction('B')} className="w-full py-5 md:py-6 bg-gray-900/80 border-2 border-pink-500/50 rounded-2xl font-black text-xl md:text-2xl text-white hover:bg-pink-600 hover:border-pink-600 transition-all active:scale-95 shadow-lg">
          {roundData.choice_b}
        </button>
      </div>
      <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
        <span className={`w-2 h-2 rounded-full ${roundData.status === 'ACTIVE' ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
        {roundData.status === 'ACTIVE' ? "LIVE: 투표 진행 중" : "CLOSED: 결과 확인"}
      </div>
    </div>
  );
}

// 3. 메인 로비 화면 (Intro/Main) - 기존과 동일
export function MainLobbyView({ createTicket, setStatus }: any) {
  return (
    <div className="z-10 flex flex-col items-center text-center px-4">
      <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-pink-500 to-red-600 mb-4 italic tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">
        DEAD OR PLAY
      </h1>
      <p className="text-gray-400 mb-12 md:mb-16 font-medium tracking-[0.3em] text-[10px] md:text-xs uppercase">
        Survival Game Platform
      </p>
      <button onClick={createTicket} className="w-64 md:w-72 py-4 md:py-5 bg-gradient-to-r from-pink-600 to-red-600 text-white font-black text-xl md:text-2xl rounded-full hover:opacity-90 transition-all shadow-[0_0_30px_rgba(236,72,153,0.5)] animate-pulse-slow">
        참가하기
      </button>
      <button onClick={() => setStatus("LOGIN")} className="mt-8 text-gray-500 text-sm hover:text-white underline transition-colors">
        기존 참가자 로그인
      </button>
    </div>
  );
}