"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase"; // 분리한 설정 불러오기

// 분리한 컴포넌트들 불러오기
import Background from "@/components/Background";
import { LockedView, LoginView, RegisterView } from "@/components/AuthViews";
import { DeathView, SurvivorView, MainLobbyView } from "@/components/GameViews";

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id");

  // --- 상태 관리 (그대로 유지) ---
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [displayId, setDisplayId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // 게임 데이터 상태
  const [userState, setUserState] = useState<{ stage: number; isAlive: boolean } | null>(null);
  const [roundData, setRoundData] = useState<any>(null);
  const [eliminatedCount, setEliminatedCount] = useState<number>(0);

  // 입력값들
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // --- 기능 로직들 (그대로 유지) ---
  const fetchGameData = async (nonce: string) => {
    try {
      const { data: user } = await supabase.from('tickets').select('current_stage, is_alive').eq('nonce', nonce).single();
      if (user) {
        setUserState({ stage: user.current_stage, isAlive: user.is_alive });
        const { data: round } = await supabase.from('game_rounds').select('*').eq('id', user.current_stage).single();
        setRoundData(round);
        const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_alive', false);
        setEliminatedCount(count || 0);
      }
    } catch (err) { console.error(err); }
  };

  const handleShare = async () => {
    const link = "https://dead-or-play-kr.vercel.app/";
    const title = "DEAD OR PLAY";
    const text = `💀 [DEAD OR PLAY]\n\n저는 ${userState?.stage}라운드에서 사망했습니다.\n현재까지 총 ${eliminatedCount}명이 탈락했습니다.\n\n당신의 운명을 테스트해보세요.`;
    if (navigator.share) {
      try { await navigator.share({ title, text, url: link }); } catch (err) { console.log("취소"); }
    } else {
      navigator.clipboard.writeText(`${text}\n${link}`).then(() => alert("🩸 초대장이 복사되었습니다!"));
    }
  };

  const handleGameAction = async (choice: 'A' | 'B') => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !roundData || !userState) return;
    if (roundData.status === 'ACTIVE') {
      const { error } = await supabase.from('user_votes').upsert({ ticket_nonce: nonce, round_id: roundData.id, choice });
      if (!error) alert("투표 완료! 결과 발표를 기다려주세요."); else alert("오류 발생");
    } else if (roundData.status === 'CLOSED') {
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

  const createTicket = async () => { setStatus("LOADING"); try { const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" }); const data = await res.json(); if (res.ok && data.lootlabs_url) { sessionStorage.setItem("pending_ticket", data.ticket_id); window.location.replace(data.lootlabs_url); } else { setStatus("IDLE"); } } catch (e) { setStatus("IDLE"); } };
  useEffect(() => { let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket") || sessionStorage.getItem("my_ticket"); if (targetTicket) { setStatus("LOADING"); fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`).then(res => res.json()).then(data => { if (data.status === "SUCCESS") { setDisplayId(data.instagram_id || ""); if (data.has_password) { setIsRegistered(true); const storedTicket = sessionStorage.getItem("my_ticket"); if (storedTicket === targetTicket) { setStatus("INTRO"); fetchGameData(targetTicket); } else setStatus("LOCKED"); } else setStatus("INTRO"); } else window.location.href = "/"; }).catch(() => setStatus("IDLE")); } }, [urlClickId]);
  const handleRegister = async () => { const cleanId = instagramId.trim().toLowerCase(); const cleanPw = password.trim().toLowerCase(); const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket"); if (!cleanId || cleanPw.length < 4 || cleanPw !== confirmPassword.trim().toLowerCase()) return alert("입력 정보 확인 필요"); try { const res = await fetch(`${BACKEND_URL}/gate/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ click_id: currentTicket, password: cleanPw, instagram_id: cleanId }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", currentTicket!); setIsRegistered(true); setStatus("INTRO"); fetchGameData(currentTicket!); } else alert(data.message); } catch (e) { alert("오류 발생"); } };
  const handleLogin = async () => { const cleanId = loginId.trim().toLowerCase(); const cleanPw = loginPw.trim().toLowerCase(); try { const res = await fetch(`${BACKEND_URL}/gate/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: cleanId, password: cleanPw }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", data.ticket_id); window.location.href = `/?click_id=${data.ticket_id}`; } else alert("정보 불일치"); } catch (e) { alert("오류 발생"); } };
  const handleUnlock = async () => { const cleanPw = unlockPw.trim().toLowerCase(); try { const res = await fetch(`${BACKEND_URL}/gate/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: displayId.toLowerCase(), password: cleanPw }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", urlClickId || data.ticket_id); setStatus("INTRO"); fetchGameData(urlClickId || data.ticket_id); } else alert("비밀번호 불일치"); } catch (e) { alert("오류 발생"); } };

  // --- 화면 렌더링 (매우 깔끔해짐!) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden pt-32">
      {/* 1. 배경 및 전광판 (항상 보임) */}
      <Background />

      {/* 2. 상태별 화면 분기 */}
      {status === "LOADING" && (
        <div className="text-pink-600 font-bold text-2xl animate-pulse z-10">LOADING...</div>
      )}

      {status === "LOCKED" && (
        <LockedView displayId={displayId} unlockPw={unlockPw} setUnlockPw={setUnlockPw} handleUnlock={handleUnlock} />
      )}

      {status === "LOGIN" && (
        <LoginView loginId={loginId} setLoginId={setLoginId} loginPw={loginPw} setLoginPw={setLoginPw} handleLogin={handleLogin} setStatus={setStatus} />
      )}

      {status === "IDLE" && (
        <MainLobbyView createTicket={createTicket} setStatus={setStatus} />
      )}

      {status === "INTRO" && (
        <div className="z-10 flex flex-col items-center w-full max-w-md">
           <div className="bg-white/90 backdrop-blur text-black px-6 py-2 rounded-full font-black text-xl mb-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
             {isRegistered ? `@${displayId}` : "GUEST"}
           </div>

           {!isRegistered ? (
             <RegisterView instagramId={instagramId} setInstagramId={setInstagramId} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} handleRegister={handleRegister} />
           ) : (
             <div className="w-full">
               {userState && !userState.isAlive ? (
                 <DeathView userState={userState} roundData={roundData} eliminatedCount={eliminatedCount} handleShare={handleShare} />
               ) : roundData ? (
                 <SurvivorView userState={userState} roundData={roundData} handleGameAction={handleGameAction} />
               ) : (
                 <div className="text-center z-10"><h2 className="text-2xl font-bold text-green-400">준비 중...</h2></div>
               )}
             </div>
           )}
        </div>
      )}
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="bg-black min-h-screen"></div>}><GameContent /></Suspense>; }