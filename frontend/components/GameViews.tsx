"use client";

import { useState } from "react";
import GameRenderer from "./GameRenderer";

// 1. 탈락 화면 (다잉 메시지 기능 포함)
export function DeathView({ userState, roundData, eliminatedCount, handleShare }: any) {
  const [isWriting, setIsWriting] = useState(false);
  const [message, setMessage] = useState("");

  const onFinalShare = () => {
    handleShare(message);
  };

  return (
    <div className="text-center p-8 bg-neutral-900/90 rounded-3xl border border-red-900/50 backdrop-blur-md w-full max-w-md mx-auto">

      {/* 깔끔한 타이틀 */}
      <h2 className="text-6xl font-black text-red-600 mb-4 tracking-tighter">YOU DIED</h2>
      <p className="text-xl text-white font-bold mb-2">{userState?.stage}라운드에서 사망했습니다.</p>
      <p className="text-gray-500 mb-8 text-sm">
        당신은 이 게임의 {eliminatedCount}번째 희생자 입니다.
      </p>

      {/* 입력창이 닫혀있을 때 */}
      {!isWriting ? (
        <button
          onClick={() => setIsWriting(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-red-900/30"
        >
          유언을 남기고 초대장을 보내세요.
        </button>
      ) : (
        /* 입력창이 열렸을 때 */
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="유언을 입력하세요..."
                className="w-full h-24 bg-black border border-white/20 text-white p-4 rounded-xl focus:outline-none focus:border-white resize-none placeholder:text-gray-600"
                maxLength={50}
            />

            <button
                onClick={onFinalShare}
                className="w-full bg-white hover:bg-gray-200 text-black font-black px-6 py-4 rounded-xl transition-all shadow-lg"
            >
                초대장 전송
            </button>

            <button
                onClick={() => setIsWriting(false)}
                className="text-gray-500 text-xs underline underline-offset-4"
            >
                취소
            </button>
        </div>
      )}
    </div>
  );
}

// 2. 생존자 게임 화면 (메인)
export function SurvivorView({ userState, roundData, handleGameAction, isRoundUnlocked, onUnlock, myVote, onCheckResult, isProcessing }: any) {

  const isLocked = roundData.status === 'CLOSED' && !isRoundUnlocked && !myVote;
  const showResultButton = roundData.status === 'CLOSED' && myVote;

  return (
    <div className="relative bg-neutral-900/80 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md w-full max-w-lg mx-auto">

      {/* 🔒 잠금 오버레이 */}
      {isLocked && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl p-6 text-center animate-in fade-in">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold text-white mb-2">라운드 종료</h3>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            이미 종료된 라운드입니다.<br/>
            게임에 합류하려면 미션을 수행하세요.
          </p>
          <button
            onClick={onUnlock}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:opacity-90 transition-all"
          >
            시선을 대가로 지불하고 합류
          </button>
        </div>
      )}

      {/* 메인 게임 UI */}
      <div className={`transition-all ${isLocked || isProcessing ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
        <div className="text-center mb-8">
          <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-black mb-4 uppercase tracking-wider">
            Round {userState?.stage}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white break-keep leading-tight">
            {roundData.title}
          </h2>
          <p className="text-gray-400 text-sm break-keep">{roundData.description}</p>
        </div>

        <GameRenderer roundData={roundData} handleGameAction={isLocked ? () => {} : handleGameAction} myVote={myVote} />

        {showResultButton && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
             <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <p className="text-green-400 font-bold mb-1">라운드 종료</p>
                <p className="text-xs text-gray-500 mb-4">결과가 집계되었습니다.</p>

                <button
                  onClick={onCheckResult}
                  disabled={isProcessing}
                  className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? "로딩 중..." : "결과 확인하기"}
                </button>
             </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2 font-mono">
          <span className={`w-2 h-2 rounded-full ${roundData.status === 'ACTIVE' ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
          {roundData.status === 'ACTIVE' ? "LIVE" : "CLOSED"}
        </div>
      </div>
    </div>
  );
}

// 3. 메인 로비 (대문)
// 🔥 [수정됨] eliminatedCount props가 빠져있어서 추가했습니다!
export function MainLobbyView({ enterGame, setStatus, eliminatedCount }: any) {
  return (
    <div className="flex flex-col items-center text-center z-10 animate-fade-in max-w-md w-full px-6">

      {/* 타이틀: 정적 글리치 효과 (흰색) */}
      <div className="mb-16 mt-8">
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-4 select-none">
          <span className="static-glitch block">DEAL</span>
          <span className="static-glitch-red text-5xl md:text-6xl block my-[-10px]">OR</span>
          <span className="static-glitch block">DIE</span>
        </h1>
        <p className="text-gray-500 mt-4 text-sm font-medium tracking-[0.4em] uppercase">
          Survival Game
        </p>
      </div>

      <button
        onClick={enterGame}
        className="group relative w-full max-w-xs py-5 bg-white text-black font-black text-2xl rounded-2xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-4"
      >
        참가하기
      </button>

      <button
        onClick={() => setStatus("LOGIN")}
        className="text-gray-500 hover:text-white text-sm underline decoration-gray-600 underline-offset-4 transition-colors p-2"
      >
        이미 계정이 있나요? 로그인
      </button>

      {/* 하단 정보창 */}
      <div className="mt-20 flex gap-8 text-xs text-gray-600 font-mono border-t border-gray-900 pt-8 w-full justify-center">
        <div>
            사망자<br/>
            <span className="text-red-500 font-bold text-lg animate-pulse">
                {eliminatedCount ? eliminatedCount.toLocaleString() : 0}
            </span>
        </div>
      </div>
    </div>
  );
}

// 4. 대기 화면
export function WaitingView() {
  const ADMIN_INSTA_URL = "https://www.instagram.com/deal_or_die.kr"; // 본인 ID로 변경
  return (
    <div className="z-10 flex flex-col items-center text-center p-8 bg-neutral-900/90 rounded-3xl border border-white/10 backdrop-blur-md max-w-md w-full animate-fade-in">
      <div className="text-green-500 text-6xl mb-4">✓</div>
      <h2 className="text-3xl font-bold text-white mb-2">생존 확인</h2>
      <div className="w-12 h-1 bg-green-500 rounded-full my-6 mx-auto"></div>
      <p className="text-gray-400 text-sm mb-8 leading-relaxed">
        생존했습니다.<br/>
        다음 라운드가 공개될 때까지 대기하세요.
      </p>
      <a href={ADMIN_INSTA_URL} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
        인스타그램에서 소식 확인
      </a>
    </div>
  );
}