"use client";

import { useState, useEffect, Suspense, useRef } from "react";
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

  // 🔥 [추가] 게임 전체 오픈 상태
  const [isGameOpen, setIsGameOpen] = useState(false);

  const [userState, setUserState] = useState<{ stage: number; isAlive: boolean } | null>(null);
  const [roundData, setRoundData] = useState<any>(null);
  const [eliminatedCount, setEliminatedCount] = useState<number>(0);

  const [myVote, setMyVote] = useState<string | null>(null);
  const [isRoundUnlocked, setIsRoundUnlocked] = useState(false);

  // 처리 중 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const clockRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (fileName: string, volume = 0.5, loop = false) => {
    try {
      const audio = new Audio(`/sounds/${fileName}`);
      audio.volume = volume;
      audio.loop = loop;
      audio.play().catch((e) => console.log("Sound play blocked:", e));
      return audio;
    } catch (e) {
      console.error("Audio error:", e);
      return null;
    }
  };

  const stopClockSound = () => {
    if (clockRef.current) {
      clockRef.current.pause();
      clockRef.current.currentTime = 0;
      clockRef.current = null;
    }
  };

  const playMainBgm = () => {
    if (!bgmRef.current) {
      bgmRef.current = playSound("Anxiety 2-Low.mp3", 0.4, true);
    }
  };

  useEffect(() => {
    if (myVote) stopClockSound();
  }, [myVote]);

  // 🔥 [추가] 게임 오픈 상태 체크
  useEffect(() => {
    const checkGameStatus = async () => {
      const { data } = await supabase.from('app_settings').select('is_game_open').single();
      if (data) setIsGameOpen(data.is_game_open);
    };
    checkGameStatus();
  }, []);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_alive', false);
      if (count !== null) setEliminatedCount(count);
    };
    fetchGlobalStats();
  }, []);

  const fetchGameData = async (nonce: string) => {
    setIsDataReady(false);
    try {
      const { data: user } = await supabase.from('tickets').select('current_stage, is_alive').eq('nonce', nonce).single();
      if (user) {
        setUserState({ stage: user.current_stage, isAlive: user.is_alive });

        // 🔥 게임이 닫혀있으면 라운드 데이터 로딩을 건너뛰어도 됨 (어차피 안 보여줌)
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
    finally { setIsDataReady(true); }
  };

  useEffect(() => {
    let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket") || sessionStorage.getItem("my_ticket");
    if (sessionStorage.getItem("pending_mission") === "true") {
       sessionStorage.removeItem("pending_mission");
       setIsRoundUnlocked(true);
       toast.success("잠금이 해제되었습니다!", { description: "이제 게임을 진행하세요." });
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
        toast.success("잠금이 해제되었습니다.");
        return;
    }
    toast.info("보안 미션 페이지로 이동합니다.", { description: "미션 완료 후 자동으로 돌아옵니다." });
    sessionStorage.setItem("pending_mission", "true");
    window.location.href = roundData.ad_url;
  };

  const handleGameAction = async (choice: string) => {
    stopClockSound();
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !roundData || !userState) return;
    if (isProcessing) return;
    if (myVote) return toast.warning("이미 투표를 완료했습니다.");
    if (roundData.status === 'CLOSED' && !isRoundUnlocked) {
      toast.warning("🔒 접근 제한", { description: "잠금 해제 버튼을 눌러 미션을 수행하세요." });
      return;
    }
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
              playSound("Correct 1.mp3", 0.6);
              toast.success("✅ 생존했습니다!", { description: "다음 라운드로 이동합니다." });
              await supabase.from('tickets').update({ current_stage: userState.stage + 1 }).eq('nonce', nonce);
              setIsRoundUnlocked(false);
              setMyVote(null);
              fetchGameData(nonce);
            } else {
              playSound("Gun Fire Sound.mp3", 0.8);
              setTimeout(() => playSound("TV Off Air Sound.mp3", 0.6), 1200);
              toast.error("❌ 사망했습니다.", { description: "당신의 운명은 여기까지입니다." });
              await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
              fetchGameData(nonce);
            }
          }
        }
    } catch (e) {
        console.error(e);
        toast.error("처리 중 오류가 발생했습니다.");
    } finally {
        setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleCheckResult = async () => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !myVote || !roundData || !userState) return;
    if (isProcessing) return;
    setIsProcessing(true);
    try {
        if (myVote === roundData.correct_answer) {
             playSound("Correct 1.mp3", 0.6);
             toast.success("🎉 생존 성공!", { description: "다음 라운드로 이동합니다." });
             await supabase.from('tickets').update({ current_stage: userState.stage + 1 }).eq('nonce', nonce);
             setIsRoundUnlocked(false);
             setMyVote(null);
             fetchGameData(nonce);
        } else {
             playSound("Gun Fire Sound.mp3", 0.8);
             setTimeout(() => playSound("TV Off Air Sound.mp3", 0.6), 1200);
             toast.error("💀 사망했습니다.", { description: "아쉽지만 여기까지입니다." });
             await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
             fetchGameData(nonce);
        }
    } finally {
        setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const enterGameDirectly = () => {
    playMainBgm();
    setStatus("INTRO");
  };

  const onOptionSelected = () => {
    if (!clockRef.current) {
        clockRef.current = playSound("Ticking Clock Sound.mp3", 0.4, true);
    }
  };

  const handleRegister = async () => {
    if (isProcessing) return;
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
    if (isProcessing) return;
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

  const handleShare = async (customMessage?: string) => {
    const link = "https://www.dealordie.kr";
    let text = `💀 [DEAL OR DIE]\n\n저는 ${eliminatedCount}번째 희생자입니다.\n(${userState?.stage}라운드 사망)\n\n`;
    if (customMessage) text += `❝ ${customMessage} ❞\n\n`;
    text += `당신의 운명을 테스트하고 상금을 받아가세요.`;
    const title = "DEAL or DIE";

    if (navigator.share) {
      try { await navigator.share({ title: title, text: text, url: link }); } catch (err) { console.log("공유 취소"); }
    } else {
      const copyText = `${text}\n${link}`;
      navigator.clipboard.writeText(copyText).then(() => { alert("🩸 유언장이 복사되었습니다!\n친구에게 붙여넣기(Ctrl+V) 하세요."); });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden pt-20 md:pt-32">
      <Background />
      {status === "LOADING" && <div className="text-red-600 font-bold text-2xl animate-pulse z-10">LOADING...</div>}
      {status === "LOCKED" && <LockedView displayId={displayId} unlockPw={unlockPw} setUnlockPw={setUnlockPw} handleUnlock={handleUnlock} />}
      {status === "LOGIN" && <LoginView loginId={loginId} setLoginId={setLoginId} loginPw={loginPw} setLoginPw={setLoginPw} handleLogin={handleLogin} setStatus={setStatus} />}

      {status === "IDLE" && <MainLobbyView enterGame={enterGameDirectly} setStatus={setStatus} eliminatedCount={eliminatedCount} />}

      {status === "INTRO" && (
        <div className="z-10 flex flex-col items-center w-full max-w-md">

           {/* 🔥 [추가됨] 메인 로고 이미지 */}
           <img
             src="/images/main-logo.png"
             alt="DEAL or DIE Logo"
             className="w-48 mb-8 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] animate-pulse-slow"
           />

           <div className="bg-black/50 backdrop-blur border border-white/30 text-white px-8 py-2 rounded-full font-bold text-lg mb-8 shadow-lg">
             {isRegistered ? `ID: ${displayId}` : "GUEST"}
           </div>

           {!isRegistered ? (
             <RegisterView instagramId={instagramId} setInstagramId={setInstagramId} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} handleRegister={handleRegister} setStatus={setStatus} />
           ) : (
             <div className="w-full">
               {!isDataReady ? (
                  <div className="text-gray-500 text-xs animate-pulse tracking-widest mt-10">LOADING DATA...</div>
               ) : (
                 !isGameOpen ? (
                    <div className="text-center p-8 bg-gray-900/80 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in-up">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">REGISTER COMPLETE</h2>
                        <div className="w-16 h-1 bg-red-600 mx-auto mb-6"></div>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            참가 등록이 완료되었습니다.<br/>
                            <span className="font-bold text-red-500">게임이 시작되면 인스타그램에서 공지를 드립니다.</span>
                            <br/>그때 다시 접속해주세요.
                        </p>
                        <div className="text-xs text-gray-500 font-mono">
                            USER_ID: {displayId}<br/>
                            STATUS: STANDBY
                        </div>
                    </div>
                 ) : (
                    userState && !userState.isAlive ? (
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
                            isProcessing={isProcessing}
                            onOptionSelect={onOptionSelected}
                        />
                    ) : <WaitingView />
                 )
               )}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
export default function Page() { return <Suspense fallback={<div className="bg-black min-h-screen"></div>}><GameContent /></Suspense>; }