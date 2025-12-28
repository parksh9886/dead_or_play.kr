"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

import Background from "../components/Background";
import { LockedView, LoginView, RegisterView } from "../components/AuthViews";
import { DeathView, SurvivorView, MainLobbyView, WaitingView } from "../components/GameViews";

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id");
  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [displayId, setDisplayId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const [userState, setUserState] = useState<{ stage: number; isAlive: boolean } | null>(null);
  const [roundData, setRoundData] = useState<any>(null);
  const [eliminatedCount, setEliminatedCount] = useState<number>(0);

  // 🔥 [추가됨] 내가 이 라운드에 투표한 선택지 저장 (없으면 null)
  const [myVote, setMyVote] = useState<string | null>(null);

  const [isRoundUnlocked, setIsRoundUnlocked] = useState(false);

  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const fetchGameData = async (nonce: string) => {
    try {
      const { data: user } = await supabase.from('tickets').select('current_stage, is_alive').eq('nonce', nonce).single();
      if (user) {
        setUserState({ stage: user.current_stage, isAlive: user.is_alive });

        const { data: round } = await supabase.from('game_rounds').select('*').eq('id', user.current_stage).single();
        setRoundData(round);

        const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_alive', false);
        setEliminatedCount(count || 0);

        // 🔥 [추가됨] 내 투표 기록 가져오기
        if (round) {
            const { data: vote } = await supabase.from('user_votes').select('choice').eq('ticket_nonce', nonce).eq('round_id', round.id).maybeSingle();
            setMyVote(vote ? vote.choice : null);
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket") || sessionStorage.getItem("my_ticket");

    if (sessionStorage.getItem("pending_mission") === "true") {
       sessionStorage.removeItem("pending_mission");
       setIsRoundUnlocked(true);
       toast.success("잠금이 해제되었습니다!", { description: "이제 생존 투표를 진행하세요." });
       targetTicket = sessionStorage.getItem("my_ticket");
    }

    if (targetTicket) {
      setStatus("LOADING");
      fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`).then(res => res.json()).then(data => {
        if (data.status === "SUCCESS") {
          setDisplayId(data.instagram_id || "");
          if (data.has_password) {
            setIsRegistered(true);
            const storedTicket = sessionStorage.getItem("my_ticket");
            if (storedTicket === targetTicket) {
              setStatus("INTRO");
              fetchGameData(targetTicket);
            } else setStatus("LOCKED");
          } else setStatus("INTRO");
        } else window.location.href = "/";
      }).catch(() => setStatus("IDLE"));
    }
  }, [urlClickId]);

  const startLootLabsMission = () => {
    if (!roundData?.ad_url) {
        setIsRoundUnlocked(true);
        toast.success("무료로 잠금이 해제되었습니다.");
        return;
    }
    toast.info("보안 미션 페이지로 이동합니다.", { description: "미션 완료 후 자동으로 돌아옵니다." });
    sessionStorage.setItem("pending_mission", "true");
    window.location.href = roundData.ad_url;
  };

  const handleGameAction = async (choice: string) => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !roundData || !userState) return;

    // 🔥 이미 투표했다면 중단 (더블 클릭 방지)
    if (myVote) return toast.warning("이미 투표를 완료했습니다.");

    if (roundData.status === 'CLOSED' && !isRoundUnlocked) {
      toast.warning("🔒 접근 제한", { description: "잠금 해제 버튼을 눌러 미션을 수행하세요." });
      return;
    }

    if (roundData.status === 'ACTIVE' || roundData.status === 'CLOSED') {
      const { error } = await supabase.from('user_votes').upsert({ ticket_nonce: nonce, round_id: roundData.id, choice });

      if (roundData.status === 'ACTIVE') {
         if (!error) {
             toast.success("투표 완료", { description: "결과 발표를 기다려주세요." });
             setMyVote(choice); // 🔥 화면 즉시 업데이트
         }
         else toast.error("오류 발생");
      }
      else if (roundData.status === 'CLOSED') {
        if (choice === roundData.correct_answer) {
          toast.success("✅ 생존했습니다!", { description: "다음 라운드로 이동합니다." });
          await supabase.from('tickets').update({ current_stage: userState.stage + 1 }).eq('nonce', nonce);
          setIsRoundUnlocked(false);
          setMyVote(null); // 다음 라운드니까 투표 초기화
          fetchGameData(nonce);
        } else {
          toast.error("❌ 탈락했습니다.", { description: "당신의 운명은 여기까지입니다." });
          await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
          fetchGameData(nonce);
        }
      }
    }
  };

  const enterGameDirectly = () => { setStatus("INTRO"); };

  const handleRegister = async () => {
    const cleanId = instagramId.trim().toLowerCase();
    const cleanPw = password.trim().toLowerCase();
    let currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    if (!currentTicket) {
        try {
            const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });
            const data = await res.json();
            if (data.ticket_id) {
                currentTicket = data.ticket_id;
                sessionStorage.setItem("pending_ticket", data.ticket_id);
            }
        } catch(e) { return toast.error("서버 통신 오류"); }
    }

    if (!cleanId) return toast.warning("ID 입력 필요");
    if (cleanPw.length < 4) return toast.warning("비밀번호 4자리 이상");
    if (cleanPw !== confirmPassword.trim().toLowerCase()) return toast.warning("비밀번호 불일치");

    try {
      const { data: existingUser } = await supabase.from('tickets').select('instagram_id').eq('instagram_id', cleanId).maybeSingle();
      if (existingUser) return toast.error("이미 사용 중인 ID입니다.");

      const res = await fetch(`${BACKEND_URL}/gate/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ click_id: currentTicket, password: cleanPw, instagram_id: cleanId }),
      });
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        sessionStorage.setItem("my_ticket", currentTicket!);
        setIsRegistered(true);
        setDisplayId(cleanId);
        setStatus("INTRO");

        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          if (ipData.ip) await supabase.from('tickets').update({ ip_address: ipData.ip }).eq('nonce', currentTicket);
        } catch (err) { console.error("IP Logging Failed", err); }

        fetchGameData(currentTicket!);
        toast.success("등록 완료!", { description: "환영합니다." });
      } else toast.error(data.message);
    } catch (e) { toast.error("오류 발생"); }
  };

  const handleLogin = async () => {
    const cleanId = loginId.trim().toLowerCase();
    const cleanPw = loginPw.trim().toLowerCase();
    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_id: cleanId, password: cleanPw }),
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        sessionStorage.setItem("my_ticket", data.ticket_id);
        setIsRegistered(true);
        setDisplayId(cleanId);
        setStatus("INTRO");
        fetchGameData(data.ticket_id);
        toast.success("로그인 성공", { description: "생존자님, 환영합니다." });
      } else toast.error("로그인 실패", { description: "ID 또는 비밀번호를 확인해주세요." });
    } catch (e) { toast.error("서버 오류가 발생했습니다."); }
  };

  const handleUnlock = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: displayId.toLowerCase(), password: unlockPw.trim().toLowerCase() }), });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        sessionStorage.setItem("my_ticket", urlClickId || data.ticket_id);
        setStatus("INTRO");
        fetchGameData(urlClickId || data.ticket_id);
        toast.success("잠금 해제됨");
      } else toast.error("비밀번호 불일치");
    } catch (e) { toast.error("오류 발생"); }
  };

  const handleShare = async () => {
    const link = "https://deadorplay.site";
    const text = `💀 [DEAD OR PLAY]\n${eliminatedCount}번째 탈락자 발생.\n(${userState?.stage}라운드 사망)`;
    if (navigator.share) navigator.share({ title: "DEAD OR PLAY", text, url: link });
    else { navigator.clipboard.writeText(`${text}\n${link}`); toast.success("링크 복사됨"); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden pt-20 md:pt-32">
      <Background />
      {status === "LOADING" && <div className="text-pink-600 font-bold text-2xl animate-pulse z-10">LOADING...</div>}
      {status === "LOCKED" && <LockedView displayId={displayId} unlockPw={unlockPw} setUnlockPw={setUnlockPw} handleUnlock={handleUnlock} />}
      {status === "LOGIN" && <LoginView loginId={loginId} setLoginId={setLoginId} loginPw={loginPw} setLoginPw={setLoginPw} handleLogin={handleLogin} setStatus={setStatus} />}
      {status === "IDLE" && <MainLobbyView enterGame={enterGameDirectly} setStatus={setStatus} />}
      {status === "INTRO" && (
        <div className="z-10 flex flex-col items-center w-full max-w-md">
           <div className="bg-white/90 backdrop-blur text-black px-6 py-2 rounded-full font-black text-xl mb-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
             {isRegistered ? `@${displayId}` : "GUEST"}
           </div>
           {!isRegistered ? (
             <RegisterView instagramId={instagramId} setInstagramId={setInstagramId} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} handleRegister={handleRegister} setStatus={setStatus} />
           ) : (
             <div className="w-full">
               {userState && !userState.isAlive ? (
                 <DeathView userState={userState} roundData={roundData} eliminatedCount={eliminatedCount} handleShare={handleShare} />
               ) : roundData ? (
                 <SurvivorView
                    userState={userState}
                    roundData={roundData}
                    handleGameAction={handleGameAction}
                    isRoundUnlocked={isRoundUnlocked}
                    onUnlock={startLootLabsMission}
                    myVote={myVote} // 🔥 내 투표 정보 전달
                 />
               ) : <WaitingView />}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
export default function Page() { return <Suspense fallback={<div className="bg-black min-h-screen"></div>}><GameContent /></Suspense>; }