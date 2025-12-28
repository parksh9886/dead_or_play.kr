"use client";

import GameRenderer from "./GameRenderer";

// 1. 탈락 화면
export function DeathView({ userState, roundData, eliminatedCount, handleShare }: any) {
  const isWinner = userState?.isAlive && !roundData;
  return (
    <div className="text-center p-6 bg-red-950/30 rounded-3xl border-2 border-red-600 backdrop-blur-md animate-pulse">
      <h2 className="text-5xl md:text-6xl font-black text-red-600 mb-4 tracking-tighter">YOU DIED</h2>
      <p className="text-xl text-white mb-2">당신은 {eliminatedCount}번째 탈락자입니다.</p>
      <p className="text-gray-400 mb-8">({userState?.stage}라운드 사망)</p>
      <button onClick={handleShare} className="bg-white text-red-900 font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform">
        🩸 유언장 남기기 (공유)
      </button>
    </div>
  );
}

// 2. 생존자 게임 화면 (잠금 기능 추가됨 🔥)
export function SurvivorView({ userState, roundData, handleGameAction, isRoundUnlocked, onUnlock }: any) {
  // 잠금 조건: 라운드가 종료되었는데(CLOSED) && 잠금해제가 안 됐다면(!unlocked)
  const isLocked = roundData.status === 'CLOSED' && !isRoundUnlocked;

  return (
    <div className="relative bg-black/70 p-6 md:p-8 rounded-3xl border-4 border-pink-600/50 shadow-[0_0_40px_rgba(236,72,153,0.4)] backdrop-blur-md w-full">

      {/* 🔒 잠금 오버레이 (광고 유도) */}
      {isLocked && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl p-6 text-center animate-in fade-in">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold text-red-500 mb-2">기록 보관소 잠금</h3>
          <p className="text-gray-300 mb-8 text-sm leading-relaxed">
            이미 종료된 라운드입니다.<br/>
            생존 결과를 확인하고 진행하려면<br/>
            <span className="text-white font-bold">보안 미션</span>을 통과해야 합니다.
          </p>
          <button
            onClick={onUnlock}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-95"
          >
            📺 미션 수행하고 잠금 해제
          </button>
          <p className="text-xs text-gray-600 mt-4">페널티 수행 후 게임이 재개됩니다.</p>
        </div>
      )}

      <div className={`transition-all ${isLocked ? 'blur-sm opacity-50' : ''}`}>
        <div className="text-center mb-8">
          <div className="inline-block bg-pink-600 px-4 py-1 rounded-full text-xs font-bold mb-4 shadow-lg">
            STAGE {userState?.stage}
          </div>
          <h2 className="text-2xl md:text-4xl font-black mb-2 text-white break-keep">
            {roundData.title}
          </h2>
          <p className="text-gray-300 text-xs md:text-sm break-keep">{roundData.description}</p>
        </div>

        <GameRenderer roundData={roundData} handleGameAction={isLocked ? () => {} : handleGameAction} />

        <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${roundData.status === 'ACTIVE' ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
          {roundData.status === 'ACTIVE' ? "LIVE: 진행 중" : "CLOSED: 집계 중"}
        </div>
      </div>
    </div>
  );
}

// 3. 메인 로비 (수정: 광고 없이 바로 진입)
export function MainLobbyView({ enterGame, setStatus }: any) {
  return (
    <div className="flex flex-col items-center text-center z-10 animate-fade-in max-w-md w-full">
      <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-pink-500 to-purple-900 mb-2 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] tracking-tighter">
        DEAD<br/><span className="text-white text-4xl md:text-6xl">OR</span><br/>PLAY
      </h1>
      <p className="text-gray-300 mb-12 text-lg font-light tracking-widest">운명을 건 서바이벌</p>

      <button
        onClick={enterGame}
        className="group relative px-12 py-5 bg-pink-600 hover:bg-pink-700 text-white font-black text-2xl rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(236,72,153,0.6)] overflow-hidden"
      >
        <span className="relative z-10">참가하기</span>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-gray-500">
        <div>💰 총 상금<br/><span className="text-white font-bold text-sm">?? 억원</span></div>
        <div>💀 탈락자<br/><span className="text-red-500 font-bold text-sm">집계 중</span></div>
        <div>⏳ 다음 라운드<br/><span className="text-green-400 font-bold text-sm">대기 중</span></div>
      </div>
    </div>
  );
}

// 4. 대기 화면
export function WaitingView() {
  const ADMIN_INSTA_URL = "https://www.instagram.com/YOUR_INSTAGRAM_ID"; // 🔥 본인 ID로 변경
  return (
    <div className="z-10 flex flex-col items-center text-center p-8 bg-black/70 rounded-3xl border-2 border-green-500/50 backdrop-blur-md max-w-md w-full animate-fade-in shadow-[0_0_30px_rgba(34,197,94,0.3)]">
      <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 tracking-tighter">MISSION COMPLETE</h2>
      <p className="text-white text-xl md:text-2xl font-bold mb-2">현재까지 모든 라운드 생존.</p>
      <div className="w-16 h-1 bg-green-500 rounded-full my-6 mx-auto"></div>
      <p className="text-gray-300 text-sm md:text-base mb-8 leading-relaxed">
        다음 라운드는 아직 공개되지 않았습니다.<br/>
        <span className="text-pink-500 font-bold">공식 인스타그램</span>을 팔로우하고<br/>가장 먼저 생존 알림을 받으세요.
      </p>
      <a href={ADMIN_INSTA_URL} target="_blank" rel="noopener noreferrer" className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xl rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg animate-pulse">
        📸 인스타 팔로우하고 대기하기
      </a>
    </div>
  );
}