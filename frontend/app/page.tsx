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
  const BACKEND_URL = "https://dead-or-play-kr.onrender.com"; // 🔥 본인 백엔드 주소 확인

  // --- 상태 관리 ---
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [displayId, setDisplayId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // 게임 데이터 상태
  const [userState, setUserState] = useState<{ stage: number; isAlive: boolean } | null>(null);
  const [roundData, setRoundData] = useState<any>(null);
  const [eliminatedCount, setEliminatedCount] = useState<number>(0);

  // 🔒 라운드 잠금 해제 여부 (후발주자 페널티용)
  const [isRoundUnlocked, setIsRoundUnlocked] = useState(false);

  // 입력값들
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  // --- 1. 게임 데이터 불러오기 ---
  const fetchGameData = async (nonce: string) => {
    try {
      const { data: user } = await supabase.from('tickets').select('current_stage, is_alive').eq('nonce', nonce).single();
      if (user) {
        setUserState({ stage: user.current_stage, isAlive: user.is_alive });

        // 현재 라운드 정보 가져오기 (ad_url 포함)
        const { data: round } = await supabase.from('game_rounds').select('*').eq('id', user.current_stage).single();
        setRoundData(round);

        const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_alive', false);
        setEliminatedCount(count || 0);
      }
    } catch (err) { console.error(err); }
  };

  // --- 2. 초기 진입 및 라운드 잠금 해제 확인 ---
  useEffect(() => {
    // URL에 click_id가 없어도, 로컬스토리지에 티켓이 있으면 로드
    let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket") || sessionStorage.getItem("my_ticket");

    // 🔥 [복귀 유저 체크] 광고 보고 돌아왔는가?
    if (sessionStorage.getItem("pending_mission") === "true") {
       sessionStorage.removeItem("pending_mission"); // 플래그 삭제
       setIsRoundUnlocked(true); // 잠금 해제!
       toast.success("잠금이 해제되었습니다!", { description: "이제 생존 투표를 진행하세요." });

       // 돌아왔을 때는 URL 파라미터가 없을 수 있으므로 저장된 티켓 사용
       targetTicket = sessionStorage.getItem("my_ticket");
    }

    if (targetTicket) {
      setStatus("LOADING");
      // 티켓 유효성 검사 (기존 로직)
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


  // --- 3. 후발주자 페널티 미션 시작 (광고 이동) ---
  const startLootLabsMission = () => {
    if (!roundData?.ad_url) {
        // 광고 링크가 없으면 그냥 해제시켜줌 (관리자가 깜빡했을 때 대비)
        setIsRoundUnlocked(true);
        toast.success("무료로 잠금이 해제되었습니다.");
        return;
    }

    toast.info("보안 미션 페이지로 이동합니다.", { description: "미션 완료 후 자동으로 돌아옵니다." });

    // 갔다 와서 알기 위해 플래그 설정
    sessionStorage.setItem("pending_mission", "true");
    // 해당 라운드의 LootLabs 링크로 이동
    window.location.href = roundData.ad_url;
  };


  // --- 4. 게임 액션 (투표/퀴즈) ---
  const handleGameAction = async (choice: string) => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !roundData || !userState) return;

    // 🔒 [검문소] 종료된 라운드인데 잠겨있다면?
    if (roundData.status === 'CLOSED' && !isRoundUnlocked) {
      toast.warning("🔒 접근 제한", { description: "잠금 해제 버튼을 눌러 미션을 수행하세요." });
      return;
    }

    if (roundData.status === 'ACTIVE' || roundData.status === 'CLOSED') {
      // 투표 기록 저장
      const { error } = await supabase.from('user_votes').upsert({ ticket_nonce: nonce, round_id: roundData.id, choice });

      if (roundData.status === 'ACTIVE') {
         if (!error) toast.success("투표 완료", { description: "결과 발표를 기다려주세요." });
         else toast.error("오류 발생");
      }
      else if (roundData.status === 'CLOSED') {
        // 결과 확인 및 스테이지 이동
        if (choice === roundData.correct_answer) {
          toast.success("✅ 생존했습니다!", { description: "다음 라운드로 이동합니다." });
          await supabase.from('tickets').update({ current_stage: userState.stage + 1 }).eq('nonce', nonce);

          // 🔥 다음 라운드는 다시 잠겨야 함
          setIsRoundUnlocked(false);
          fetchGameData(nonce);
        } else {
          toast.error("❌ 탈락했습니다.", { description: "당신의 운명은 여기까지입니다." });
          await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
          fetchGameData(nonce);
        }
      }
    }
  };


  // --- 5. 가입 및 로그인 로직 ---

  // 수정됨: 광고 없이 바로 가입화면 진입
  const enterGameDirectly = () => {
    setStatus("INTRO");
  };

  const handleRegister = async () => {
    const cleanId = instagramId.trim().toLowerCase();
    const cleanPw = password.trim().toLowerCase();
    // 신규 가입시에는 click_id가 없을 수 있음 (바로 들어왔으므로)
    // 따라서 임시 티켓이 없으면 백엔드에서 생성해줘야 하는데,
    // 기존 로직 유지를 위해 '가입 전용 임시 티켓'을 백엔드 create 호출로 따오는게 안전함.
    // 하지만 LootLabs 없이 하려면, 여기서 바로 register 호출 시 click_id가 null이어도 받아주거나,
    // 화면 진입 시점에 백엔드에서 create를 한번 호출해서 pending_ticket을 쥐어주는게 좋음.

    // -> 간단한 해결책: enterGameDirectly 에서 create 호출해서 pending_ticket만 받아오기.
    // 하지만 복잡해지니, 백엔드 /gate/register 가 click_id 없이도 동작하도록 하거나,
    // 여기서 create를 호출하고 바로 register를 이어서 호출.

    let currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    if (!currentTicket) {
        // 티켓이 없으면 하나 발급받고 진행
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
        toast.success("등록 완료!", { description: "환영합니다." });
      } else toast.error(data.message);
    } catch (e) { toast.error("오류 발생"); }
  };

  const handleLogin = async () => {
    const cleanId = loginId.trim().toLowerCase();
    const cleanPw = loginPw.trim().toLowerCase();

    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_id: cleanId, password: cleanPw }),
      });
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        sessionStorage.setItem("my_ticket", data.ticket_id);

        // 🔥 [이 부분이 추가되었습니다!]
        setIsRegistered(true);      // "이 사람은 가입된 유저입니다"
        setDisplayId(cleanId);      // 화면에 아이디 표시 (@아이디)

        setStatus("INTRO");         // 게임 화면으로 이동
        fetchGameData(data.ticket_id);
        toast.success("로그인 성공", { description: "생존자님, 환영합니다." });
      } else {
        toast.error("로그인 실패", { description: "ID 또는 비밀번호를 확인해주세요." });
      }
    } catch (e) {
      toast.error("서버 오류가 발생했습니다.");
    }
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

  // 공유 기능
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
             <RegisterView instagramId={instagramId} setInstagramId={setInstagramId} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} handleRegister={handleRegister} />
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
                    onUnlock={startLootLabsMission} // 🔑 잠금 해제 함수 전달
                 />
               ) : (
                 <WaitingView />
               )}
             </div>
           )}
        </div>
      )}
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="bg-black min-h-screen"></div>}><GameContent /></Suspense>; }