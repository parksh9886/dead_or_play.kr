"use client";

// 1. 잠금 화면 (Locked)
export function LockedView({ displayId, unlockPw, setUnlockPw, handleUnlock }: any) {
  return (
    <div className="z-10 bg-black/70 p-8 rounded-2xl backdrop-blur-md border border-gray-800 flex flex-col items-center shadow-2xl w-full max-w-sm">
      <h2 className="text-xl md:text-2xl font-bold text-pink-500 mb-6">🔒 @{displayId}</h2>
      <input type="password" value={unlockPw} onChange={(e) => setUnlockPw(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-4 mb-4 rounded text-white text-center focus:border-pink-500 outline-none" placeholder="비밀번호" />
      <button onClick={handleUnlock} className="w-full bg-pink-600 font-bold py-4 rounded hover:bg-pink-700 transition-all">잠금 해제</button>
    </div>
  );
}

// 2. 로그인 화면 (Login)
export function LoginView({ loginId, setLoginId, loginPw, setLoginPw, handleLogin, setStatus }: any) {
  return (
    <div className="z-10 bg-black/70 p-6 md:p-8 rounded-2xl backdrop-blur-md border border-gray-800 flex flex-col items-center w-full max-w-md shadow-2xl">
      <h2 className="text-3xl md:text-4xl font-black text-pink-500 mb-8 tracking-tighter">LOGIN</h2>
      <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-4 mb-3 rounded text-white focus:border-pink-500 outline-none" placeholder="인스타 ID" />
      <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-4 mb-6 rounded text-white focus:border-pink-500 outline-none" placeholder="비밀번호" />
      <button onClick={handleLogin} className="w-full bg-pink-600 font-bold py-4 rounded hover:bg-pink-700 transition-all">입장하기</button>
      <button onClick={() => setStatus("IDLE")} className="mt-4 text-gray-400 text-sm hover:text-white underline">뒤로 가기</button>
    </div>
  );
}

// 3. 회원가입 화면 (Register)
export function RegisterView({ instagramId, setInstagramId, password, setPassword, confirmPassword, setConfirmPassword, handleRegister }: any) {
  return (
    <div className="w-full max-w-sm bg-black/70 p-6 rounded-xl border border-red-900/50 backdrop-blur-md shadow-2xl">
      <h2 className="text-xl font-bold text-pink-500 mb-4 text-center">참가자 등록</h2>
      <input type="text" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-3 mb-3 rounded text-white" placeholder="인스타 ID" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-3 mb-3 rounded text-white" placeholder="비밀번호" />
      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-3 mb-6 rounded text-white" placeholder="비밀번호 확인" />
      <button onClick={handleRegister} className="w-full bg-gradient-to-r from-pink-600 to-red-600 font-bold py-4 rounded hover:opacity-90 transition-all">등록 완료</button>
    </div>
  );
}