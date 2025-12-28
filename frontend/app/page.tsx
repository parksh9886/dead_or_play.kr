"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CountUp from 'react-countup'; // npm install react-countup 필요

// 1. Supabase 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id");

  // --- 상태 관리 ---
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [displayId, setDisplayId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // 게임 데이터 상태
  const [userState, setUserState] = useState<{ stage: number; isAlive: boolean } | null>(null);
  const [roundData, setRoundData] = useState<any>(null);
  const [eliminatedCount, setEliminatedCount] = useState<number>(0);

  // 입력값
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // --- DB 데이터 로드 ---
  const fetchGameData = async (nonce: string) => {
    try {
      const { data: user } = await supabase
        .from('tickets')
        .select('current_stage, is_alive')
        .eq('nonce', nonce)
        .single();

      if (user) {
        setUserState({ stage: user.current_stage, isAlive: user.is_alive });

        const { data: round } = await supabase
          .from('game_rounds')
          .select('*')
          .eq('id', user.current_stage)
          .single();

        setRoundData(round);

        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('is_alive', false);

        setEliminatedCount(count || 0);
      }
    } catch (err) {
      console.error("Game Data Load Error:", err);
    }
  };

  // --- 스마트 공유하기 ---
  const handleShare = async () => {
    const link = "https://dead-or-play-kr.vercel.app/";
    const title = "DEAD OR PLAY";
    const text = `💀 [DEAD OR PLAY]\n\n저는 ${userState?.stage}라운드에서 사망했습니다.\n현재까지 총 ${eliminatedCount}명이 탈락했습니다.\n\n당신의 운명을 테스트해보세요.`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: link });
      } catch (err) { console.log("공유 취소"); }
    } else {
      const copyText = `${text}\n${link}`;
      navigator.clipboard.writeText(copyText).then(() => {
        alert("🩸 초대장이 복사되었습니다!\n친구에게 붙여넣기(Ctrl+V) 하세요.");
      });
    }
  };

  // --- 투표/퀴즈 액션 ---
  const handleGameAction = async (choice: 'A' | 'B') => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !roundData || !userState) return;

    if (roundData.status === 'ACTIVE') {
      const { error } = await supabase
        .from('user_votes')
        .upsert({ ticket_nonce: nonce, round_id: roundData.id, choice });
      if (!error) alert("투표 완료! 결과 발표를 기다려주세요.");
      else alert("오류가 발생했습니다.");
    }
    else if (roundData.status === 'CLOSED') {
      if (choice === roundData.correct_answer) {
        alert("✅ 정답! 생존했습니다.");
        await supabase.from('tickets').update({ current_stage: userState.stage + 1 }).eq('nonce', nonce);
        fetchGameData(nonce);
      } else {
        alert("❌ 오답! 탈락했습니다.");
        await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
        fetchGameData(nonce);
      }
    }
  };

  // --- 인증 로직 ---
  const createTicket = async () => { /* ... */ setStatus("LOADING"); try { const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" }); const data = await res.json(); if (res.ok && data.lootlabs_url) { sessionStorage.setItem("pending_ticket", data.ticket_id); window.location.replace(data.lootlabs_url); } else { setStatus("IDLE"); } } catch (e) { setStatus("IDLE"); } };
  useEffect(() => { let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket") || sessionStorage.getItem("my_ticket"); if (targetTicket) { setStatus("LOADING"); fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`).then(res => res.json()).then(data => { if (data.status === "SUCCESS") { setDisplayId(data.instagram_id || ""); if (data.has_password) { setIsRegistered(true); const storedTicket = sessionStorage.getItem("my_ticket"); if (storedTicket === targetTicket) { setStatus("INTRO"); fetchGameData(targetTicket); } else setStatus("LOCKED"); } else setStatus("INTRO"); } else window.location.href = "/"; }).catch(() => setStatus("IDLE")); } }, [urlClickId]);
  const handleRegister = async () => { const cleanId = instagramId.trim().toLowerCase(); const cleanPw = password.trim().toLowerCase(); const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket"); if (!cleanId || cleanPw.length < 4 || cleanPw !== confirmPassword.trim().toLowerCase()) return alert("입력 정보 확인 필요"); try { const res = await fetch(`${BACKEND_URL}/gate/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ click_id: currentTicket, password: cleanPw, instagram_id: cleanId }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", currentTicket!); setIsRegistered(true); setStatus("INTRO"); fetchGameData(currentTicket!); } else alert(data.message); } catch (e) { alert("오류 발생"); } };
  const handleLogin = async () => { const cleanId = loginId.trim().toLowerCase(); const cleanPw = loginPw.trim().toLowerCase(); try { const res = await fetch(`${BACKEND_URL}/gate/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: cleanId, password: cleanPw }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", data.ticket_id); window.location.href = `/?click_id=${data.ticket_id}`; } else alert("정보 불일치"); } catch (e) { alert("오류 발생"); } };
  const handleUnlock = async () => { const cleanPw = unlockPw.trim().toLowerCase(); try { const res = await fetch(`${BACKEND_URL}/gate/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: displayId.toLowerCase(), password: cleanPw }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", urlClickId || data.ticket_id); setStatus("INTRO"); fetchGameData(urlClickId || data.ticket_id); } else alert("비밀번호 불일치"); } catch (e) { alert("오류 발생"); } };

  // --- 🔥 [디자인 핵심] 배경 및 상금 전광판 컴포넌트 ---
  const BackgroundAndPrize = () => (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
      {/* 1. 배경: 깊은 어둠 속 붉은 안개 (심장 박동 애니메이션) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-black to-black animate-pulse"></div>

      {/* 2. 상금 전광판: 화면 최상단 고정 */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center z-0 opacity-90">
        <p className="text-red-500 text-[10px] md:text-xs font-bold tracking-[0.4em] mb-1 uppercase animate-pulse">TOTAL PRIZE POOL</p>
        <div className="font-mono text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-pink-800 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
          {/* 456억부터 시작해서 천천히 계속 올라가는 연출 */}
          ₩ <CountUp start={45600000000} end={45699999999} duration={80000} separator="," />
        </div>
      </div>
    </div>
  );

  // --- 렌더링 (배경 적용 + 투명도 처리) ---

  // 로딩 화면
  if (status === "LOADING") return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <BackgroundAndPrize />
      <div className="text-pink-600 font-bold text-2xl animate-pulse z-10">LOADING...</div>
    </div>
  );

  // 잠금 화면
  if (status === "LOCKED") return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <BackgroundAndPrize />
        <div className="z-10 bg-black/70 p-8 rounded-2xl backdrop-blur-md border border-gray-800 flex flex-col items-center shadow-2xl">
            <h2 className="text-xl font-bold text-pink-500 mb-6">🔒 @{displayId}</h2>
            <input type="password" value={unlockPw} onChange={(e) => setUnlockPw(e.target.value)} className="w-full max-w-xs bg-gray-900/80 border border-gray-700 p-4 mb-4 rounded text-white text-center focus:border-pink-500 outline-none" placeholder="비밀번호" />
            <button onClick={handleUnlock} className="w-full max-w-xs bg-pink-600 font-bold py-4 rounded hover:bg-pink-700 transition-all">잠금 해제</button>
        </div>
      </div>
  );

  // 로그인 화면
  if (status === "LOGIN") return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <BackgroundAndPrize />
        <div className="z-10 bg-black/70 p-8 rounded-2xl backdrop-blur-md border border-gray-800 flex flex-col items-center w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black text-pink-500 mb-8 tracking-tighter">LOGIN</h2>
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-4 mb-3 rounded text-white focus:border-pink-500 outline-none" placeholder="인스타 ID" />
            <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-4 mb-6 rounded text-white focus:border-pink-500 outline-none" placeholder="비밀번호" />
            <button onClick={handleLogin} className="w-full bg-pink-600 font-bold py-4 rounded hover:bg-pink-700 transition-all">입장하기</button>
            <button onClick={() => setStatus("IDLE")} className="mt-4 text-gray-400 text-sm hover:text-white underline">뒤로 가기</button>
        </div>
      </div>
  );

  // 게임 대기실 & 진행 화면
  if (status === "INTRO") {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center relative overflow-hidden pt-32">
        <BackgroundAndPrize />

        <div className="z-10 flex flex-col items-center w-full max-w-md">
            <div className="bg-white/90 backdrop-blur text-black px-6 py-2 rounded-full font-black text-xl mb-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
               {isRegistered ? `@${displayId}` : "GUEST"}
            </div>

            {!isRegistered ? (
            // 회원가입
            <div className="w-full bg-black/70 p-6 rounded-xl border border-red-900/50 backdrop-blur-md shadow-2xl">
                <h2 className="text-xl font-bold text-pink-500 mb-4 text-center">참가자 등록</h2>
                <input type="text" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-3 mb-3 rounded text-white" placeholder="인스타 ID" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-3 mb-3 rounded text-white" placeholder="비밀번호" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-900/80 border border-gray-700 p-3 mb-6 rounded text-white" placeholder="비밀번호 확인" />
                <button onClick={handleRegister} className="w-full bg-gradient-to-r from-pink-600 to-red-600 font-bold py-4 rounded hover:opacity-90 transition-all">등록 완료</button>
            </div>
            ) : (
            <div className="w-full">
                {/* 탈락자 화면 */}
                {userState && !userState.isAlive ? (
                <div className="text-center animate-fade-in bg-black/70 p-8 rounded-3xl border border-red-900/80 shadow-[0_0_50px_rgba(220,38,38,0.3)] backdrop-blur-md">
                    <h1 className="text-6xl font-black text-red-600 mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,1)]">YOU DIED</h1>
                    <p className="text-gray-300 text-sm mb-8 font-bold">
                      당신은 <span className="text-red-500 text-lg">{userState.stage}라운드</span>에서 희생되었습니다.
                    </p>

                    <div className="bg-gray-900/60 rounded-xl p-4 mb-8 border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">CURRENT STATUS</span>
                        <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
                      </div>
                      <p className="text-xl font-black text-white">{roundData?.title || "게임 진행 중"}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        현재까지 탈락자: <span className="text-red-600 font-black text-2xl">{eliminatedCount}명</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                        <button
                          onClick={handleShare}
                          className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xl rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 animate-pulse"
                        >
                          📤 초대장 전송하기
                        </button>
                        <p className="text-xs text-gray-500 mt-2">친구도 탈락할까요? 시험해보세요.</p>
                    </div>
                </div>
                ) : roundData ? (
                // 생존자 게임 화면
                <div className="bg-black/70 p-8 rounded-3xl border-4 border-pink-600/50 shadow-[0_0_40px_rgba(236,72,153,0.4)] backdrop-blur-md">
                     <div className="text-center mb-8">
                       <div className="inline-block bg-pink-600 px-4 py-1 rounded-full text-xs font-bold mb-4 shadow-lg">STAGE {userState?.stage}</div>
                       <h2 className="text-4xl font-black mb-2 text-white">{roundData.title}</h2>
                       <p className="text-gray-300 text-sm">{roundData.description}</p>
                    </div>
                    <div className="space-y-4">
                      <button onClick={() => handleGameAction('A')} className="w-full py-6 bg-gray-900/80 border-2 border-pink-500/50 rounded-2xl font-black text-2xl text-white hover:bg-pink-600 hover:border-pink-600 transition-all active:scale-95 shadow-lg">{roundData.choice_a}</button>
                      <button onClick={() => handleGameAction('B')} className="w-full py-6 bg-gray-900/80 border-2 border-pink-500/50 rounded-2xl font-black text-2xl text-white hover:bg-pink-600 hover:border-pink-600 transition-all active:scale-95 shadow-lg">{roundData.choice_b}</button>
                    </div>
                    <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${roundData.status === 'ACTIVE' ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
                       {roundData.status === 'ACTIVE' ? "LIVE: 투표 진행 중" : "CLOSED: 결과 확인"}
                    </div>
                </div>
                ) : (
                <div className="text-center z-10"><h2 className="text-2xl font-bold text-green-400">준비 중...</h2></div>
                )}
            </div>
            )}
        </div>
      </div>
    );
  }

  // 메인 로비 (IDLE)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden pt-32">
      <BackgroundAndPrize />
      <div className="z-10 flex flex-col items-center">
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-pink-500 to-red-600 mb-4 italic tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">DEAD OR PLAY</h1>
        <p className="text-gray-400 mb-16 font-medium tracking-[0.3em] text-xs uppercase">Survival Game Platform</p>
        <button onClick={createTicket} className="w-72 py-5 bg-gradient-to-r from-pink-600 to-red-600 text-white font-black text-2xl rounded-full hover:opacity-90 transition-all shadow-[0_0_30px_rgba(236,72,153,0.5)] animate-pulse-slow">참가하기</button>
        <button onClick={() => setStatus("LOGIN")} className="mt-8 text-gray-500 text-sm hover:text-white underline transition-colors">기존 참가자 로그인</button>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="bg-black min-h-screen"></div>}><GameContent /></Suspense>; }