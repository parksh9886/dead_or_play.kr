"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
  const [eliminatedCount, setEliminatedCount] = useState<number>(0); // 💀 생존자 대신 탈락자 수 관리

  // 입력값
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // --- [핵심] DB 데이터 로드 ---
  const fetchGameData = async (nonce: string) => {
    try {
      // 1. 유저 정보 조회
      const { data: user } = await supabase
        .from('tickets')
        .select('current_stage, is_alive')
        .eq('nonce', nonce)
        .single();

      if (user) {
        setUserState({ stage: user.current_stage, isAlive: user.is_alive });

        // 2. 라운드 정보 조회
        // 유저가 죽었더라도 현재 진행 상황을 보여주기 위해 최신 라운드(혹은 본인 라운드) 노출
        const { data: round } = await supabase
          .from('game_rounds')
          .select('*')
          .eq('id', user.current_stage)
          .single();

        setRoundData(round);

        // 3. [수정됨] 전체 탈락자(희생자) 수 카운트 💀
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('is_alive', false); // false인 사람(죽은 사람)만 셉니다.

        setEliminatedCount(count || 0);
      }
    } catch (err) {
      console.error("Game Data Load Error:", err);
    }
  };

  // --- 공유하기 (물귀신 작전) ---
  const handleShare = () => {
    // 실제 배포된 사이트 주소로 변경해주세요
    const link = "https://dead-or-play-kr.vercel.app/";

    // 💀 문구 수정: 탈락자 수 강조
    const text = `💀 [DEAD OR PLAY]\n\n저는 ${userState?.stage}라운드에서 사망했습니다.\n현재까지 총 ${eliminatedCount}명이 탈락했습니다.\n\n당신은 살아남을 수 있을까요?\n지금 확인하기 👉 ${link}`;

    navigator.clipboard.writeText(text).then(() => {
      alert("🩸 초대장이 복사되었습니다!\n친구에게 이 공포를 전파하세요.");
    });
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
      else alert("이미 투표하셨거나 오류가 발생했습니다.");
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

  // --- 기존 로직들 (티켓생성, 검증, 회원가입, 로그인) ---
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.lootlabs_url) {
        sessionStorage.setItem("pending_ticket", data.ticket_id);
        window.location.replace(data.lootlabs_url);
      } else { setStatus("IDLE"); }
    } catch (e) { setStatus("IDLE"); }
  };

  useEffect(() => {
    let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket") || sessionStorage.getItem("my_ticket");
    if (targetTicket) {
      setStatus("LOADING");
      fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`)
        .then(res => res.json())
        .then(data => {
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

  const handleRegister = async () => {
    const cleanId = instagramId.trim().toLowerCase();
    const cleanPw = password.trim().toLowerCase();
    const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");
    if (!cleanId || cleanPw.length < 4 || cleanPw !== confirmPassword.trim().toLowerCase()) return alert("입력 정보 확인 필요");
    try {
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
      } else alert(data.message);
    } catch (e) { alert("오류 발생"); }
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
        window.location.href = `/?click_id=${data.ticket_id}`;
      } else alert("정보 불일치");
    } catch (e) { alert("오류 발생"); }
  };

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
        fetchGameData(urlClickId || data.ticket_id);
      } else alert("비밀번호 불일치");
    } catch (e) { alert("오류 발생"); }
  };

  // --- 화면 렌더링 ---
  if (status === "LOADING") return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold text-2xl animate-pulse">LOADING...</div>;

  if (status === "LOCKED") return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold text-pink-500 mb-6">🔒 @{displayId}</h2>
        <input type="password" value={unlockPw} onChange={(e) => setUnlockPw(e.target.value)} className="w-full max-w-xs bg-gray-800 border p-4 mb-4 rounded text-white" placeholder="비밀번호" />
        <button onClick={handleUnlock} className="w-full max-w-xs bg-pink-600 font-bold py-4 rounded">잠금 해제</button>
      </div>
  );

  if (status === "LOGIN") return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-3xl font-black text-pink-500 mb-8">LOGIN</h2>
        <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full max-w-sm bg-gray-800 border p-4 mb-3 rounded" placeholder="인스타 ID" />
        <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="w-full max-w-sm bg-gray-800 border p-4 mb-6 rounded" placeholder="비밀번호" />
        <button onClick={handleLogin} className="w-full max-w-sm bg-pink-600 font-bold py-4 rounded">입장하기</button>
        <button onClick={() => setStatus("IDLE")} className="mt-4 text-gray-500 underline">뒤로 가기</button>
      </div>
  );

  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center border-8 border-pink-600">
        <div className="bg-white text-black px-6 py-2 rounded-full font-black text-xl mb-8">
          {isRegistered ? `@${displayId}` : "GUEST"}
        </div>

        {!isRegistered ? (
          <div className="w-full max-w-sm bg-black p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-pink-500 mb-4 text-center">참가자 등록</h2>
            <input type="text" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="w-full bg-gray-800 p-3 mb-3 rounded" placeholder="인스타 ID" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 p-3 mb-3 rounded" placeholder="비밀번호" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-800 p-3 mb-6 rounded" placeholder="비밀번호 확인" />
            <button onClick={handleRegister} className="w-full bg-pink-600 font-bold py-4 rounded">등록 완료</button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {/* 🔥 [탈락자 화면] 탈락자 수 노출 🔥 */}
            {userState && !userState.isAlive ? (
              <div className="text-center animate-fade-in bg-black p-8 rounded-3xl border border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                <h1 className="text-6xl font-black text-red-600 mb-2 tracking-tighter">YOU DIED</h1>
                <p className="text-gray-400 text-sm mb-8 font-bold">
                  당신은 <span className="text-red-500 text-lg">{userState.stage}라운드</span>에서 희생되었습니다.
                </p>

                {/* 현재 게임 현황판 */}
                <div className="bg-gray-900 rounded-xl p-4 mb-8 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">CURRENT STATUS</span>
                    <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
                  </div>
                  <p className="text-xl font-black text-white">{roundData?.title || "게임 진행 중"}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    현재까지 탈락자: <span className="text-red-600 font-black text-2xl">{eliminatedCount}명</span>
                  </p>
                </div>

                {/* 물귀신 작전 (공유) */}
                <div className="space-y-3">
                    <p className="text-gray-300 text-sm font-medium">억울하다면 친구를 초대하세요.</p>
                    <button
                      onClick={handleShare}
                      className="w-full py-4 bg-[#FEE500] text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      💬 카카오톡 초대장 보내기
                    </button>
                    <button
                       onClick={handleShare}
                       className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      📸 인스타그램 링크 복사
                    </button>
                </div>
              </div>
            ) : roundData ? (
              // 생존자 게임 화면
              <div className="bg-black p-8 rounded-3xl border-4 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.4)]">
                 <div className="text-center mb-8">
                   <div className="inline-block bg-pink-600 px-4 py-1 rounded-full text-xs font-bold mb-4">STAGE {userState?.stage}</div>
                   <h2 className="text-4xl font-black mb-2">{roundData.title}</h2>
                   <p className="text-gray-400 text-sm">{roundData.description}</p>
                </div>
                <div className="space-y-4">
                  <button onClick={() => handleGameAction('A')} className="w-full py-6 bg-gray-800 border-2 border-pink-500 rounded-2xl font-black text-2xl hover:bg-pink-600 transition-all active:scale-95">{roundData.choice_a}</button>
                  <button onClick={() => handleGameAction('B')} className="w-full py-6 bg-gray-800 border-2 border-pink-500 rounded-2xl font-black text-2xl hover:bg-pink-600 transition-all active:scale-95">{roundData.choice_b}</button>
                </div>
                <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${roundData.status === 'ACTIVE' ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
                   {roundData.status === 'ACTIVE' ? "LIVE: 투표 진행 중" : "CLOSED: 결과 확인"}
                </div>
              </div>
            ) : (
              <div className="text-center"><h2 className="text-2xl font-bold text-green-400">준비 중...</h2></div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-7xl font-black text-pink-600 mb-4 italic tracking-tighter">DEAD OR PLAY</h1>
      <button onClick={createTicket} className="w-72 py-5 border-2 border-pink-600 text-pink-600 font-black text-2xl rounded-full hover:bg-pink-600 hover:text-white transition-all">참가하기</button>
      <button onClick={() => setStatus("LOGIN")} className="mt-6 text-gray-500 text-sm hover:text-white underline">로그인</button>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="bg-black min-h-screen"></div>}><GameContent /></Suspense>; }