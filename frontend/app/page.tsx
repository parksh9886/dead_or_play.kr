"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js"; // 설치 필요: npm install @supabase/supabase-js

// Supabase 설정 (환경변수나 실제 값으로 대체하세요)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id");

  // 상태 관리
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [displayId, setDisplayId] = useState("");
  const [userState, setUserState] = useState<{ stage: number; isAlive: boolean } | null>(null);
  const [roundData, setRoundData] = useState<any>(null);

  // 입력값 관리
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // --- 1. 유저 및 라운드 데이터 로드 함수 ---
  const fetchGameData = async (nonce: string) => {
    // 1. 유저 정보 (tickets) 가져오기
    const { data: user, error: userError } = await supabase
      .from('tickets')
      .select('current_stage, is_alive')
      .eq('nonce', nonce)
      .single();

    if (user) {
      setUserState({ stage: user.current_stage, isAlive: user.is_alive });

      // 2. 해당 유저의 현재 라운드 정보 (game_rounds) 가져오기
      const { data: round } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('id', user.current_stage)
        .single();

      setRoundData(round);
    }
  };

  // --- 2. 투표/퀴즈 제출 함수 ---
  const handleVote = async (choice: 'A' | 'B') => {
    const nonce = sessionStorage.getItem("my_ticket");
    if (!nonce || !roundData) return;

    if (roundData.status === 'ACTIVE') {
      // 투표 로직
      const { error } = await supabase
        .from('user_votes')
        .upsert({ ticket_nonce: nonce, round_id: roundData.id, choice });

      if (!error) alert("투표가 완료되었습니다. 결과 발표를 기다려주세요!");
      else alert("이미 참여하셨거나 오류가 발생했습니다.");
    }
    else if (roundData.status === 'CLOSED') {
      // 퀴즈 로직 (정답 체크)
      if (choice === roundData.correct_answer) {
        alert("✅ 정답입니다! 다음 라운드로 진출합니다.");
        // 다음 단계로 업데이트
        await supabase
          .from('tickets')
          .update({ current_stage: userState!.stage + 1 })
          .eq('nonce', nonce);
        fetchGameData(nonce); // 화면 갱신
      } else {
        alert("❌ 오답입니다. 생존에 실패하셨습니다.");
        await supabase
          .from('tickets')
          .update({ is_alive: false })
          .eq('nonce', nonce);
        fetchGameData(nonce);
      }
    }
  };

  const handleError = (data: any) => {
    console.error("Server Error:", data);
    alert(data.detail || data.message || "오류가 발생했습니다.");
  };

  // 티켓 생성
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`);
      const data = await res.json();
      if (res.ok && data.lootlabs_url) {
        sessionStorage.setItem("pending_ticket", data.ticket_id);
        window.location.replace(data.lootlabs_url);
      } else {
        handleError(data);
        setStatus("IDLE");
      }
    } catch (e) {
      alert("서버 연결 실패");
      setStatus("IDLE");
    }
  };

  // 티켓 검증 및 자동 로드
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
                fetchGameData(targetTicket); // 유저가 이미 가입되어 있다면 게임 정보 로드
              } else {
                setStatus("LOCKED");
              }
            } else {
              setStatus("INTRO");
            }
          } else {
            setStatus("IDLE");
          }
        })
        .catch(() => setStatus("IDLE"));
    }
  }, [urlClickId]);

  // 회원가입
  const handleRegister = async () => {
    const cleanId = instagramId.trim().toLowerCase();
    const cleanPw = password.trim().toLowerCase();
    const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    if (cleanPw !== confirmPassword.trim().toLowerCase()) return alert("비밀번호 불일치");

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
      } else handleError(data);
    } catch (e) { alert("등록 오류"); }
  };

  // 로그인/잠금해제 로직은 기존과 동일하되 성공 시 fetchGameData(data.ticket_id) 호출 추가
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
      } else handleError(data);
    } catch (e) { alert("로그인 오류"); }
  };

  // --- UI 컴포넌트 분리 ---

  if (status === "LOADING") return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold">LOADING...</div>;

  if (status === "LOCKED") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold text-pink-500 mb-6">🔒 @{displayId} 본인 확인</h2>
        <input type="password" value={unlockPw} onChange={(e) => setUnlockPw(e.target.value)} className="w-full max-w-xs bg-gray-800 border p-3 mb-4 rounded" placeholder="비밀번호" />
        <button onClick={() => { /* 기존 handleUnlock 호출 */ }} className="w-full max-w-xs bg-pink-600 py-3 rounded font-bold">잠금 해제</button>
      </div>
    );
  }

  // 게임 진행/대기실 통합 UI (INTRO)
  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center border-8 border-pink-600">
        <div className="bg-white text-black px-6 py-2 rounded-full font-black text-xl mb-6 shadow-lg">
          {isRegistered ? `@${displayId}` : "GUEST"}
        </div>

        {!isRegistered ? (
          <div className="w-full max-w-sm bg-black p-6 rounded-lg border border-gray-700">
             <h2 className="text-xl font-bold text-pink-500 mb-4 text-center">참가자 등록</h2>
             <input type="text" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="w-full bg-gray-800 p-3 mb-3 rounded" placeholder="인스타 ID" />
             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 p-3 mb-3 rounded" placeholder="비밀번호" />
             <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-800 p-3 mb-3 rounded" placeholder="비밀번호 확인" />
             <button onClick={handleRegister} className="w-full bg-pink-600 font-bold py-4 rounded">등록 완료</button>
          </div>
        ) : (
          <div className="w-full max-w-md text-center">
            {/* 탈락 상태 */}
            {userState && !userState.isAlive ? (
              <div className="animate-bounce">
                <h1 className="text-5xl font-black text-red-600 mb-4">YOU DIED</h1>
                <p className="text-gray-400">당신은 서바이벌에서 탈락했습니다.</p>
              </div>
            ) : roundData ? (
              <div className="bg-black p-8 rounded-2xl border-2 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                <p className="text-pink-500 font-bold mb-2">STAGE {userState?.stage}</p>
                <h2 className="text-3xl font-black mb-4">{roundData.title}</h2>
                <p className="text-gray-400 mb-8">{roundData.description}</p>

                {/* 라운드 상태에 따른 버튼 */}
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleVote('A')} className="py-6 bg-gray-800 border-2 border-pink-500 rounded-xl font-bold hover:bg-pink-500 transition-all text-xl">
                    {roundData.choice_a}
                  </button>
                  <button onClick={() => handleVote('B')} className="py-6 bg-gray-800 border-2 border-pink-500 rounded-xl font-bold hover:bg-pink-500 transition-all text-xl">
                    {roundData.choice_b}
                  </button>
                </div>

                <p className="mt-6 text-xs text-gray-500">
                  {roundData.status === 'ACTIVE' ? "🔥 현재 투표 진행 중!" : "⚠️ 종료된 라운드입니다. 정답을 맞춰야 생존합니다."}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-black text-green-400 mb-2">다음 게임 대기 중</h1>
                <p className="text-gray-400">곧 새로운 라운드가 시작됩니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-black text-pink-600 mb-4 tracking-tighter italic">DEAD OR PLAY</h1>
      <button onClick={createTicket} className="w-64 py-4 border-2 border-pink-600 text-pink-500 font-bold text-xl rounded hover:bg-pink-600 hover:text-white transition-all">참가하기</button>
      <button onClick={() => setStatus("LOGIN")} className="mt-4 text-gray-500 underline">로그인</button>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}