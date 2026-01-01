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
      <h2 className="text-6xl font-black text-red-600 mb-4 tracking-tighter">YOU DIED</h2>
      <p className="text-xl text-white font-bold mb-2">{userState?.stage}라운드에서 사망했습니다.</p>
      <p className="text-gray-500 mb-8 text-sm">
        당신은 이 게임의 {eliminatedCount}번째 희생자 입니다.
      </p>

      {!isWriting ? (
        <button
          onClick={() => setIsWriting(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-red-900/30"
        >
          유언을 남기고 초대장을 보내세요.
        </button>
      ) : (
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
export function SurvivorView({ userState, roundData, handleGameAction, isRoundUnlocked, onUnlock, myVote, onCheckResult, isProcessing, onOptionSelect }: any) {

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

        <GameRenderer
            roundData={roundData}
            handleGameAction={isLocked ? () => {} : handleGameAction}
            myVote={myVote}
            onOptionSelect={onOptionSelect}
        />

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

// 3. 메인 로비 (대문) - 🔥 로고 이미지 적용됨
export function MainLobbyView({ enterGame, setStatus, eliminatedCount }: any) {
  return (
    <div className="z-10 flex flex-col items-center justify-center text-center animate-fade-in px-4">

      {/* 🩸 텍스트 대신 로고 이미지 적용 */}
      <img
        src="/images/main-logo.png"
        alt="DEAL or DIE Title"
        className="w-72 md:w-[500px] mb-6 drop-shadow-[0_0_35px_rgba(220,38,38,0.5)] animate-pulse-slow"
      />

      <p className="text-lg md:text-2xl text-gray-400 mb-12 tracking-widest uppercase font-bold">
        당신의 운명을 시험하세요.
      </p>

      <div className="relative group w-full max-w-xs md:max-w-sm">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <button
          onClick={enterGame}
          className="relative w-full px-8 py-6 bg-black rounded-lg leading-none flex items-center justify-center divide-x divide-gray-600"
        >
          <span className="flex items-center space-x-5">
            <span className="text-gray-100 font-black text-2xl md:text-3xl tracking-tighter">CLICK TO START</span>
          </span>
        </button>
      </div>

      <button
        onClick={() => setStatus("LOGIN")}
        className="mt-6 text-gray-500 hover:text-white text-sm underline decoration-gray-600 underline-offset-4 transition-colors p-2"
      >
        이미 계정이 있나요? 로그인
      </button>

      <div className="mt-16 text-gray-600 font-mono text-xs md:text-sm">
        <p>CURRENT DEATH COUNT</p>
        <p className="text-4xl font-black text-red-900/80 mt-2">{eliminatedCount?.toLocaleString() || 0}</p>
      </div>

      <div className="mt-8 text-[10px] text-gray-700">
        WARNING: This game contains psychological horror elements.
      </div>
    </div>
  );
}

// 4. 대기 화면
export function WaitingView() {
  const ADMIN_INSTA_URL = "https://www.instagram.com/deal_or_die.kr";
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