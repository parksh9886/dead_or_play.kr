"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

import Background from "../components/Background";
import { LockedView, LoginView, RegisterView } from "../components/AuthViews";
import { DeathView, SurvivorView, MainLobbyView } from "../components/GameViews";

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

  // 입력값들
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // --- 기능 로직들 ---
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

  // 🔥 여기가 수정되었습니다: 공유 멘트 변경
  const handleShare = async () => {
    const link = "https://dead-or-play-kr.vercel.app/";
    const title = "DEAD OR PLAY";
    const text = `💀 [DEAD OR PLAY]\n\n저는 ${eliminatedCount}번째 희생자입니다.\n(${userState?.stage}라운드 사망)\n\n당신의 운명을 테스트해보세요.`;

    if (navigator.share) {
      try { await navigator.share({ title, text, url: link }); } catch (err) { console.log("취소"); }
    } else {
      navigator.clipboard.writeText(`${text}\n${link}`).then(() => alert("🩸 유언장이 복사되었습니다!"));
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
  const handleRegister = async () => {
    // 공백 제거 및 소문자 변환
    const cleanId = instagramId.trim().toLowerCase();
    const cleanPw = password.trim().toLowerCase();
    const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    // 1. 기본 입력값 검사 (아이디 비어있음, 비번 길이, 비번 확인 등)
    if (!cleanId) return alert("인스타 ID를 입력해주세요.");
    if (cleanPw.length < 4) return alert("비밀번호는 4자리 이상이어야 합니다.");
    if (cleanPw !== confirmPassword.trim().toLowerCase()) return alert("비밀번호 확인이 일치하지 않습니다.");

    try {
      // 🔍 [새로 추가된 부분] 2. Supabase에서 ID 중복 확인
      const { data: existingUser, error } = await supabase
        .from('tickets')
        .select('instagram_id')
        .eq('instagram_id', cleanId)
        .maybeSingle(); // 결과가 없으면 null 반환

      if (error) {
        console.error("중복 확인 에러:", error);
        return alert("중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }

      if (existingUser) {
        // 이미 아이디가 존재하면 여기서 멈춤 (백엔드 요청 안 보냄)
        return alert("이미 사용 중인 ID입니다. 다른 ID를 입력해주세요.");
      }

      // 3. 중복이 아니면 백엔드에 등록 요청 (기존 로직 실행)
      const res = await fetch(`${BACKEND_URL}/gate/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ click_id: currentTicket, password: cleanPw, instagram_id: cleanId }),
      });

      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        sessionStorage.setItem("my_ticket", currentTicket!);
        setIsRegistered(true);
        setStatus("INTRO");
        fetchGameData(currentTicket!);
        alert("등록 완료! 생존 게임에 오신 것을 환영합니다.");
      } else {
        alert(data.message);
      }

    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };
  const handleLogin = async () => { const cleanId = loginId.trim().toLowerCase(); const cleanPw = loginPw.trim().toLowerCase(); try { const res = await fetch(`${BACKEND_URL}/gate/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: cleanId, password: cleanPw }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", data.ticket_id); window.location.href = `/?click_id=${data.ticket_id}`; } else alert("정보 불일치"); } catch (e) { alert("오류 발생"); } };
  const handleUnlock = async () => { const cleanPw = unlockPw.trim().toLowerCase(); try { const res = await fetch(`${BACKEND_URL}/gate/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: displayId.toLowerCase(), password: cleanPw }), }); const data = await res.json(); if (res.ok && data.status === "SUCCESS") { sessionStorage.setItem("my_ticket", urlClickId || data.ticket_id); setStatus("INTRO"); fetchGameData(urlClickId || data.ticket_id); } else alert("비밀번호 불일치"); } catch (e) { alert("오류 발생"); } };

  // --- 화면 렌더링 ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden pt-20 md:pt-32">
      <Background />

      {status === "LOADING" && <div className="text-pink-600 font-bold text-2xl animate-pulse z-10">LOADING...</div>}
      {status === "LOCKED" && <LockedView displayId={displayId} unlockPw={unlockPw} setUnlockPw={setUnlockPw} handleUnlock={handleUnlock} />}
      {status === "LOGIN" && <LoginView loginId={loginId} setLoginId={setLoginId} loginPw={loginPw} setLoginPw={setLoginPw} handleLogin={handleLogin} setStatus={setStatus} />}
      {status === "IDLE" && <MainLobbyView createTicket={createTicket} setStatus={setStatus} />}

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