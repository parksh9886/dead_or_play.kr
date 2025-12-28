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

  const [myVote, setMyVote] = useState<string | null>(null);
  const [isRoundUnlocked, setIsRoundUnlocked] = useState(false);

  // 🔥 [추가됨] 처리 중 상태 (광클 방지용)
  const [isProcessing, setIsProcessing] = useState(false);

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

    // 🔥 [추가됨] 처리 중이거나 이미 투표했으면 클릭 무시
    if (isProcessing) return;
    if (myVote) return toast.warning("이미 투표를 완료했습니다.");

    if (roundData.status === 'CLOSED' && !isRoundUnlocked) {
      toast.warning("🔒 접근 제한", { description: "잠금 해제 버튼을 눌러 미션을 수행하세요." });
      return;
    }

    // 처리 시작 (버튼 잠금)
    setIsProcessing(true);

    try {
        if (roundData.status === 'ACTIVE' || roundData.status === 'CLOSED') {
          const { error } = await supabase.from('user_votes').upsert({ ticket_nonce: nonce, round_id: roundData.id, choice });

          if (roundData.status === 'ACTIVE') {
             if (!error) {
                 toast.success("투표 완료", { description: "결과 발표를 기다려주세요." });
                 setMyVote(choice);
             }
             else toast.error("오류 발생");
          }
          else if (roundData.status === 'CLOSED') {
            if (choice === roundData.correct_answer) {
              toast.success("✅ 생존했습니다!", { description: "다음 라운드로 이동합니다." });
              await supabase.from('tickets').update({ current_stage: userState.stage + 1 }).eq('nonce', nonce);
              setIsRoundUnlocked(false);
              setMyVote(null);
              fetchGameData(nonce);
            } else {
              toast.error("❌ 탈락했습니다.", { description: "당신의 운명은 여기까지입니다." });
              await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
              fetchGameData(nonce);
            }
          }
        }
    } catch (e) {
        console.error(e);
        toast.error("처리 중 오류가 발생했습니다.");
    } finally {
        // 처리 끝 (버튼 해제) -> 약간의 딜레이를 주어 연타 방지
        setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleCheckResult = async () => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !myVote || !roundData || !userState) return;
    if (isProcessing) return; // 🔥 중복 클릭 방지

    setIsProcessing(true);
    try {
        if (myVote === roundData.correct_answer) {
             toast.success("🎉 생존 성공!", { description: "다음 라운드로 이동합니다." });
             await supabase.from('tickets').update({ current_stage: userState.stage + 1 }).eq('nonce', nonce);
             setIsRoundUnlocked(false);
             setMyVote(null);
             fetchGameData(nonce);
        } else {
             toast.error("💀 탈락했습니다.", { description: "아쉽지만 여기까지입니다." });
             await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
             fetchGameData(nonce);
        }
    } finally {
        setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const enterGameDirectly = () => { setStatus("INTRO"); };

  const handleRegister = async () => {
    if (isProcessing) return; // 🔥 중복 가입 방지

    const cleanId = instagramId.trim().toLowerCase();
    const cleanPw = password.trim().toLowerCase();
    let currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    setIsProcessing(true);

    if (!currentTicket) {
        try {
            const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });
            const data = await res.json();
            if (data.ticket_id) {
                currentTicket = data.ticket_id;
                sessionStorage.setItem("pending_ticket", data.ticket_id);
            }
        } catch(e) {
            setIsProcessing(false);
            return toast.error("서버 통신 오류");
        }
    }

    if (!cleanId) { setIsProcessing(false); return toast.warning("ID 입력 필요"); }
    if (cleanPw.length < 4) { setIsProcessing(false); return toast.warning("비밀번호 4자리 이상"); }
    if (cleanPw !== confirmPassword.trim().toLowerCase()) { setIsProcessing(false); return toast.warning("비밀번호 불일치"); }

    try {
      const { data: existingUser } = await supabase.from('tickets').select('instagram_id').eq('instagram_id', cleanId).maybeSingle();
      if (existingUser) { setIsProcessing(false); return toast.error("이미 사용 중인 ID입니다."); }

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
    finally { setIsProcessing(false); }
  };

  const handleLogin = async () => {
    if (isProcessing) return; // 🔥 중복 로그인 방지
    setIsProcessing(true);

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
    finally { setIsProcessing(false); }
  };

  const handleUnlock = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

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
    finally { setIsProcessing(false); }
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
                    myVote={myVote}
                    onCheckResult={handleCheckResult}
                    isProcessing={isProcessing} // 🔥 버튼 비활성화를 위해 전달
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