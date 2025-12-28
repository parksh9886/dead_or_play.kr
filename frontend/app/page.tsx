"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// 1. Supabase 설정 (Vercel 환경변수에서 자동으로 읽어옵니다)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id");

  // --- 기존 상태 관리 ---
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [displayId, setDisplayId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // --- 신규 게임 데이터 상태 관리 ---
  const [userState, setUserState] = useState<{ stage: number; isAlive: boolean } | null>(null);
  const [roundData, setRoundData] = useState<any>(null);

  // 회원가입 입력값
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 로그인/잠금해제 입력값
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // --- [신규] DB에서 유저 진행도와 라운드 정보 불러오기 ---
  const fetchGameData = async (nonce: string) => {
    try {
      // 1. 유저 정보 (tickets) 조회
      const { data: user, error: userError } = await supabase
        .from('tickets')
        .select('current_stage, is_alive')
        .eq('nonce', nonce)
        .single();

      if (user) {
        setUserState({ stage: user.current_stage, isAlive: user.is_alive });

        // 2. 해당 스테이지의 라운드 정보 (game_rounds) 조회
        const { data: round } = await supabase
          .from('game_rounds')
          .select('*')
          .eq('id', user.current_stage)
          .single();

        setRoundData(round);
      }
    } catch (err) {
      console.error("Game Data Load Error:", err);
    }
  };

  // --- [신규] 투표 및 퀴즈 정답 제출 처리 ---
  const handleGameAction = async (choice: 'A' | 'B') => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !roundData || !userState) return;

    if (roundData.status === 'ACTIVE') {
      // 투표 모드: 다수결/소수결 등을 위해 DB에 기록만 함
      const { error } = await supabase
        .from('user_votes')
        .upsert({ ticket_nonce: nonce, round_id: roundData.id, choice });

      if (!error) alert("투표가 완료되었습니다! 결과 발표를 기다려주세요.");
      else alert("이미 투표하셨거나 오류가 발생했습니다.");
    }
    else if (roundData.status === 'CLOSED') {
      // 퀴즈 모드: 과거 라운드이므로 즉시 정답 체크
      if (choice === roundData.correct_answer) {
        alert("✅ 정답입니다! 다음 라운드로 진출합니다.");
        const nextStage = userState.stage + 1;
        await supabase.from('tickets').update({ current_stage: nextStage }).eq('nonce', nonce);
        fetchGameData(nonce); // 다음 단계 데이터로 갱신
      } else {
        alert("❌ 오답입니다. 생존에 실패하셨습니다.");
        await supabase.from('tickets').update({ is_alive: false }).eq('nonce', nonce);
        fetchGameData(nonce); // 탈락 화면으로 갱신
      }
    }
  };

  // --- 기존 로직 1: 티켓 생성 ---
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`, {
        method: "POST",
        headers: { "Cache-Control": "no-cache" }
      });
      const data = await res.json();

      if (res.ok && data.lootlabs_url) {
        sessionStorage.setItem("pending_ticket", data.ticket_id);
        window.location.replace(data.lootlabs_url);
      } else {
        alert(data.message || "오류 발생");
        setStatus("IDLE");
      }
    } catch (e) {
      alert("서버 연결 실패");
      setStatus("IDLE");
    }
  };

  // --- 기존 로직 2: 페이지 로드 시 티켓 검증 ---
  useEffect(() => {
    let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket") || sessionStorage.getItem("my_ticket");

    if (targetTicket) {
      setStatus("LOADING");
      fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS") {
            setDisplayId(data.instagram_id || "");

            if (data.has_password) {
              setIsRegistered(true);
              const storedTicket = sessionStorage.getItem("my_ticket");
              if (storedTicket === targetTicket) {
                setStatus("INTRO");
                fetchGameData(targetTicket); // 가입된 유저라면 게임 정보 불러오기 🔥
              } else {
                setStatus("LOCKED");
              }
            } else {
              setStatus("INTRO");
            }
          } else {
            window.location.href = "/";
          }
        })
        .catch(() => setStatus("IDLE"));
    }
  }, [urlClickId]);

  // --- 기존 로직 3: 회원가입 ---
  const handleRegister = async () => {
    const cleanId = instagramId.trim().toLowerCase();
    const cleanPw = password.trim().toLowerCase();
    const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    if (!cleanId || cleanPw.length < 4) return alert("정보를 정확히 입력하세요.");
    if (cleanPw !== confirmPassword.trim().toLowerCase()) return alert("비밀번호 불일치");

    try {
      const res = await fetch(`${BACKEND_URL}/gate/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          click_id: currentTicket,
          password: cleanPw,
          instagram_id: cleanId
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        alert("✅ 등록 완료!");
        sessionStorage.setItem("my_ticket", currentTicket!);
        setIsRegistered(true);
        setStatus("INTRO");
        fetchGameData(currentTicket!); // 등록 직후 게임 데이터 로드 🔥
      } else { alert(data.message); }
    } catch (e) { alert("네트워크 오류"); }
  };

  // --- 기존 로직 4: 로그인 ---
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
        window.location.href = `/?click_id=${data.ticket_id}`;
      } else { alert("로그인 정보가 틀립니다."); }
    } catch (e) { alert("서버 오류"); }
  };

  // --- 기존 로직 5: 잠금 해제 ---
  const handleUnlock = async () => {
    const cleanPw = unlockPw.trim().toLowerCase();
    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_id: displayId.toLowerCase(), password: cleanPw }),
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        sessionStorage.setItem("my_ticket", urlClickId || data.ticket_id);
        setStatus("INTRO");
        fetchGameData(urlClickId || data.ticket_id); // 잠금 해제 후 데이터 로드 🔥
      } else { alert("비밀번호가 틀립니다."); }
    } catch (e) { alert("서버 오류"); }
  };

  // --- UI 렌더링 시작 ---

  if (status === "LOADING") return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold animate-pulse text-2xl">LOADING...</div>;

  if (status === "LOCKED") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-pink-500 mb-6">@{displayId} 본인 확인</h2>
        <input type="password" value={unlockPw} onChange={(e) => setUnlockPw(e.target.value)} className="w-full max-w-xs bg-gray-800 border border-gray-600 rounded p-4 mb-4 text-white" placeholder="비밀번호" />
        <button onClick={handleUnlock} className="w-full max-w-xs bg-pink-600 font-bold py-4 rounded">잠금 해제</button>
      </div>
    );
  }

  if (status === "LOGIN") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-3xl font-black text-pink-500 mb-8">LOGIN</h2>
        <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full max-w-sm bg-gray-800 border p-4 mb-3 rounded" placeholder="인스타 ID" />
        <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="w-full max-w-sm bg-gray-800 border p-4 mb-6 rounded" placeholder="비밀번호" />
        <button onClick={handleLogin} className="w-full max-w-sm bg-pink-600 font-bold py-4 rounded">입장하기</button>
        <button onClick={() => setStatus("IDLE")} className="mt-4 text-gray-500 underline">뒤로 가기</button>
      </div>
    );
  }

  // --- 게임실 & 회원가입 (INTRO) ---
  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center border-8 border-pink-600">
        <div className="bg-white text-black px-6 py-2 rounded-full font-black text-xl mb-8">
          {isRegistered ? `@${displayId}` : "GUEST"}
        </div>

        {!isRegistered ? (
          // 회원가입 화면
          <div className="w-full max-w-sm bg-black p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-pink-500 mb-4 text-center">참가자 등록</h2>
            <input type="text" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="w-full bg-gray-800 p-3 mb-3 rounded" placeholder="인스타 ID" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 p-3 mb-3 rounded" placeholder="비밀번호" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-800 p-3 mb-6 rounded" placeholder="비밀번호 확인" />
            <button onClick={handleRegister} className="w-full bg-pink-600 font-bold py-4 rounded">등록 완료</button>
          </div>
        ) : (
          // 실시간 게임 화면 🔥
          <div className="w-full max-w-md">
            {userState && !userState.isAlive ? (
              <div className="text-center animate-fade-in">
                <h1 className="text-7xl font-black text-red-600 mb-4">YOU DIED</h1>
                <p className="text-gray-400 text-lg italic">당신은 서바이벌에서 탈락했습니다.</p>
                <button onClick={() => window.location.href = "/"} className="mt-10 text-pink-500 underline">메인으로 이동</button>
              </div>
            ) : roundData ? (
              <div className="bg-black p-8 rounded-3xl border-4 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.4)]">
                <div className="text-center mb-8">
                   <div className="inline-block bg-pink-600 px-4 py-1 rounded-full text-xs font-bold mb-4">STAGE {userState?.stage}</div>
                   <h2 className="text-4xl font-black mb-2">{roundData.title}</h2>
                   <p className="text-gray-400 text-sm">{roundData.description}</p>
                </div>

                <div className="space-y-4">
                  <button onClick={() => handleGameAction('A')} className="w-full py-6 bg-gray-800 border-2 border-pink-500 rounded-2xl font-black text-2xl hover:bg-pink-600 transition-all active:scale-95">
                    {roundData.choice_a}
                  </button>
                  <button onClick={() => handleGameAction('B')} className="w-full py-6 bg-gray-800 border-2 border-pink-500 rounded-2xl font-black text-2xl hover:bg-pink-600 transition-all active:scale-95">
                    {roundData.choice_b}
                  </button>
                </div>

                <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${roundData.status === 'ACTIVE' ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
                  {roundData.status === 'ACTIVE' ? "LIVE: 지금 투표하세요" : "CLOSED: 정답 검증 단계"}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-400 mb-2">라운드 준비 중...</h2>
                <p className="text-gray-500">운영자가 다음 스테이지를 세팅하고 있습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 메인 로비
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-7xl font-black text-pink-600 mb-4 italic tracking-tighter">DEAD OR PLAY</h1>
      <p className="text-gray-500 mb-12 font-medium tracking-widest text-sm">SURVIVAL GAME PLATFORM</p>
      <button onClick={createTicket} className="w-72 py-5 border-2 border-pink-600 text-pink-600 font-black text-2xl rounded-full hover:bg-pink-600 hover:text-white transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)]">참가하기</button>
      <button onClick={() => setStatus("LOGIN")} className="mt-6 text-gray-500 text-sm hover:text-white underline">기존 참가자 로그인</button>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="bg-black min-h-screen"></div>}><GameContent /></Suspense>;
}