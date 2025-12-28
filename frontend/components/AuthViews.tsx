"use client";

import { useEffect, useState } from "react";

// 1. 잠금 화면 (비밀번호 입력)
export function LockedView({ displayId, unlockPw, setUnlockPw, handleUnlock }: any) {
  return (
    <div className="flex flex-col items-center justify-center z-10 w-full max-w-sm">
      <div className="text-6xl mb-4 animate-bounce">🔒</div>
      <h2 className="text-2xl font-bold text-white mb-2">@{displayId}</h2>
      <p className="text-gray-400 mb-6 text-sm">계정이 잠겨있습니다. 비밀번호를 입력하세요.</p>

      <input
        type="password"
        value={unlockPw}
        onChange={(e) => setUnlockPw(e.target.value)}
        className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-center mb-4 focus:border-pink-500 outline-none transition-colors"
        placeholder="비밀번호 4자리"
      />

      <button
        onClick={handleUnlock}
        className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
      >
        잠금 해제
      </button>
    </div>
  );
}

// 2. 로그인 화면
export function LoginView({ loginId, setLoginId, loginPw, setLoginPw, handleLogin, setStatus }: any) {
  return (
    <div className="flex flex-col items-center justify-center z-10 w-full max-w-sm animate-fade-in p-6 bg-black/80 backdrop-blur-md rounded-3xl border border-gray-800">
      <h2 className="text-3xl font-black text-white mb-8">생존자 로그인</h2>

      <div className="w-full space-y-4">
        <div>
          <label className="text-xs text-gray-500 ml-2 mb-1 block">인스타그램 ID</label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-pink-500 outline-none"
            placeholder="아이디 입력 (예: zuck)"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 ml-2 mb-1 block">비밀번호</label>
          <input
            type="password"
            value={loginPw}
            onChange={(e) => setLoginPw(e.target.value)}
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-pink-500 outline-none"
            placeholder="비밀번호 입력"
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        className="w-full mt-8 py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.4)]"
      >
        로그인하고 생존하기
      </button>

      <button
        onClick={() => setStatus("IDLE")}
        className="mt-4 text-gray-500 text-sm hover:text-white underline"
      >
        ← 뒤로 가기
      </button>
    </div>
  );
}

// 3. 회원가입 화면 (🔥 경고 문구 추가됨)
export function RegisterView({ instagramId, setInstagramId, password, setPassword, confirmPassword, setConfirmPassword, handleRegister }: any) {
  return (
    <div className="w-full bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-gray-800 shadow-2xl animate-fade-in">
      <h2 className="text-2xl font-black text-center text-white mb-2">신규 참가자 등록</h2>
      <p className="text-center text-gray-400 text-xs mb-6">생존 게임에 오신 것을 환영합니다.</p>

      {/* 🚨 중요 경고 박스 */}
      <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl mb-6">
        <h3 className="text-red-500 font-bold text-sm mb-1 flex items-center gap-2">
          <span>🚨</span> 중요 규칙 필독
        </h3>
        <ul className="text-xs text-red-200/80 list-disc list-inside space-y-1">
          <li>본인의 <strong>실제 인스타그램 ID</strong>로만 가입하세요.</li>
          <li>우승 시 <strong>DM 인증</strong>을 거쳐야 상금이 지급됩니다.</li>
          <li>가계정이나 타인 계정 적발 시 <strong>즉시 탈락</strong>됩니다.</li>
        </ul>
      </div>

      <div className="space-y-4">
        {/* ID 입력 */}
        <div>
          <label className="block text-gray-500 text-xs ml-2 mb-1">인스타그램 ID (본인 계정)</label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-gray-500">@</span>
            <input
              type="text"
              value={instagramId}
              onChange={(e) => setInstagramId(e.target.value)}
              className="w-full p-4 pl-8 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-green-500 outline-none transition-colors"
              placeholder="instagram_id"
            />
          </div>
        </div>

        {/* 비밀번호 입력 */}
        <div className="space-y-2">
           <div>
            <label className="block text-gray-500 text-xs ml-2 mb-1">게임용 비밀번호 설정</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-green-500 outline-none transition-colors"
              placeholder="4자리 이상 입력"
            />
            {/* 🔒 비밀번호 경고 문구 */}
            <p className="text-[11px] text-blue-400 mt-1 ml-2 flex items-center gap-1">
              <span>🔒</span> 실제 인스타 비밀번호를 입력하지 마세요!
            </p>
          </div>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-green-500 outline-none transition-colors"
            placeholder="비밀번호 재확인"
          />
        </div>
      </div>

      <button
        onClick={handleRegister}
        className="w-full mt-8 py-4 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all active:scale-95"
      >
        서약하고 참가하기
      </button>

      <p className="text-center text-[10px] text-gray-600 mt-4">
        참가 버튼을 누르면 위 규칙에 동의하는 것으로 간주합니다.
      </p>
    </div>
  );
}