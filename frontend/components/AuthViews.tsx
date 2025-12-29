"use client";

// 1. 잠금 화면 (비밀번호 입력)
export function LockedView({ displayId, unlockPw, setUnlockPw, handleUnlock }: any) {
  return (
    <div className="flex flex-col items-center justify-center z-10 w-full max-w-sm p-6 bg-neutral-900/80 border border-white/10 rounded-2xl backdrop-blur-md">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-white mb-1">@{displayId}</h2>
      <p className="text-gray-400 mb-6 text-sm">잠금 해제 비밀번호를 입력하세요.</p>

      <input
        type="password"
        value={unlockPw}
        onChange={(e) => setUnlockPw(e.target.value)}
        className="w-full p-4 bg-black border border-white/20 rounded-xl text-white text-center mb-4 focus:border-white outline-none transition-colors"
        placeholder="비밀번호 4자리"
      />

      <button
        onClick={handleUnlock}
        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all"
      >
        확인
      </button>
    </div>
  );
}

// 2. 로그인 화면
export function LoginView({ loginId, setLoginId, loginPw, setLoginPw, handleLogin, setStatus }: any) {
  return (
    <div className="flex flex-col items-center justify-center z-10 w-full max-w-sm animate-fade-in p-8 bg-neutral-900/90 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
      <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">로그인</h2>

      <div className="w-full space-y-4">
        <div>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full p-4 bg-black border border-white/20 rounded-xl text-white focus:border-white outline-none placeholder:text-gray-600"
            placeholder="인스타그램 ID"
          />
        </div>
        <div>
          <input
            type="password"
            value={loginPw}
            onChange={(e) => setLoginPw(e.target.value)}
            className="w-full p-4 bg-black border border-white/20 rounded-xl text-white focus:border-white outline-none placeholder:text-gray-600"
            placeholder="비밀번호"
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        className="w-full mt-8 py-4 bg-white hover:bg-gray-200 text-black font-black text-lg rounded-xl transition-all"
      >
        입장하기
      </button>

      <button
        onClick={() => setStatus("IDLE")}
        className="mt-4 text-gray-500 text-sm hover:text-white underline underline-offset-4"
      >
        ← 처음으로
      </button>
    </div>
  );
}

// 3. 회원가입 화면
export function RegisterView({ instagramId, setInstagramId, password, setPassword, confirmPassword, setConfirmPassword, handleRegister, setStatus }: any) {
  return (
    <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
      <h2 className="text-2xl font-black text-center text-white mb-2">참가자 등록</h2>
      <p className="text-center text-gray-400 text-xs mb-6">DEAL or DIE에 오신 것을 환영합니다.</p>

      {/* 🚨 중요 경고 박스 (레드 포인트) */}
      <div className="bg-red-600/10 border border-red-600/40 p-4 rounded-xl mb-6">
        <h3 className="text-red-500 font-bold text-sm mb-1 flex items-center gap-2">
          ⚠ 필수 확인
        </h3>
        <ul className="text-xs text-red-300/80 list-disc list-inside space-y-1">
          <li>반드시 <strong>본인 인스타그램 ID</strong>를 사용하세요.</li>
          <li>우승 시 DM으로 본인 인증을 진행합니다.</li>
          <li>가계정 적발 시 <strong>즉시 탈락</strong> 처리됩니다.</li>
        </ul>
      </div>

      <div className="space-y-4">
        {/* ID 입력 */}
        <div>
          <label className="block text-gray-500 text-xs ml-2 mb-1">인스타그램 ID</label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-gray-500">@</span>
            <input
              type="text"
              value={instagramId}
              onChange={(e) => setInstagramId(e.target.value)}
              className="w-full p-4 pl-8 bg-black border border-white/20 rounded-xl text-white focus:border-white outline-none transition-colors"
              placeholder="instagram_id"
            />
          </div>
        </div>

        {/* 비밀번호 입력 */}
        <div className="space-y-2">
           <div>
            <label className="block text-gray-500 text-xs ml-2 mb-1">게임용 비밀번호 (4자리 이상)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-black border border-white/20 rounded-xl text-white focus:border-white outline-none transition-colors"
              placeholder="비밀번호 설정"
            />
            <p className="text-[11px] text-gray-600 mt-1 ml-2">
              * 실제 인스타 비밀번호를 입력하지 마세요.
            </p>
          </div>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-4 bg-black border border-white/20 rounded-xl text-white focus:border-white outline-none transition-colors"
            placeholder="비밀번호 확인"
          />
        </div>
      </div>

      <button
        onClick={handleRegister}
        className="w-full mt-8 py-4 bg-white hover:bg-gray-200 text-black font-black text-lg rounded-xl transition-all active:scale-95"
      >
        동의하고 참가하기
      </button>

      <button
        onClick={() => setStatus("IDLE")}
        className="w-full mt-4 py-3 text-gray-500 text-sm hover:text-white rounded-xl transition-all"
      >
        취소 (뒤로 가기)
      </button>
    </div>
  );
}