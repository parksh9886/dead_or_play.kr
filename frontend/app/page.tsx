"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GameContent() {
  const searchParams = useSearchParams();
  const click_id = searchParams.get("click_id");

  // 상태 관리
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN">("IDLE");
  const [playerNum, setPlayerNum] = useState("000");

  // 회원가입용 상태
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // 로그인용 상태
  const [loginNum, setLoginNum] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // ⚠️ 본인 Render 주소
  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // 1. [신규 입장] 참가하기 -> 무조건 신규 티켓 생성
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });

      // 혹시 서버 에러가 났을 경우 대비
      if (!res.ok) {
        throw new Error("서버 응답 오류");
      }

      const data = await res.json();

      if (data.lootlabs_url) {
        window.location.href = data.lootlabs_url;
      } else {
        alert("링크 생성 실패");
        setStatus("IDLE");
      }
    } catch (e) {
      console.error(e);
      alert("접속량이 많아 연결이 지연되고 있습니다. 잠시 후 다시 시도해주세요.");
      setStatus("IDLE");
    }
  };

  // 2. [페이지 로드 시] 티켓 검증
  useEffect(() => {
    if (click_id) {
      setStatus("LOADING");
      fetch(`${BACKEND_URL}/gate/callback?click_id=${click_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS") {
            setPlayerNum(data.player_num);
            if (data.has_password) setIsRegistered(true);
            setStatus("INTRO");
          } else {
            alert(data.message);
            window.location.href = "/";
          }
        })
        .catch(() => setStatus("IDLE"));
    }
  }, [click_id]);

  // 3. [회원가입]
  const handleRegister = async () => {
    if (password.length < 4) return alert("비밀번호는 4자리 이상이어야 합니다.");
    if (password !== confirmPassword) return alert("비밀번호가 서로 다릅니다.");
    if (instagramId.length < 2) return alert("인스타그램 ID를 입력해주세요.");

    try {
      const res = await fetch(`${BACKEND_URL}/gate/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          click_id: click_id,
          password: password,
          instagram_id: instagramId
        }),
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
        alert("등록 완료! 참가번호와 비밀번호를 꼭 기억하세요.");
        setIsRegistered(true);
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("등록 중 오류 발생");
    }
  };

  // 4. [로그인]
  const handleLogin = async () => {
    if (!loginNum || !loginPw) return alert("정보를 입력해주세요.");

    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_num: loginNum,
          password: loginPw
        }),
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
        window.location.href = `/?click_id=${data.ticket_id}`;
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("로그인 서버 오류");
    }
  };

  // --- 화면 렌더링 ---

  if (status === "LOADING") {
    return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold animate-pulse">LOADING...</div>;
  }

  // A. [로그인 화면]
  if (status === "LOGIN") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-3xl font-black text-pink-500 mb-8">참가자 로그인</h2>

        <div className="w-full max-w-sm space-y-4">
          <div>
            <label className="text-sm text-gray-400">참가번호 (예: 0056)</label>
            <input
              type="text"
              value={loginNum}
              onChange={(e) => setLoginNum(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-3 mt-1 focus:border-pink-500 outline-none"
              placeholder="번호 입력"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">비밀번호</label>
            <input
              type="password"
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-3 mt-1 focus:border-pink-500 outline-none"
              placeholder="비밀번호"
            />
          </div>

          <button onClick={handleLogin} className="w-full bg-pink-600 font-bold py-4 rounded hover:bg-pink-700 transition-colors">
            입장하기
          </button>

          <button onClick={() => setStatus("IDLE")} className="w-full text-gray-500 text-sm py-2">
            ← 뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  // B. [게임 대기실 / 등록 화면]
  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center font-sans border-8 border-pink-600 overflow-y-auto">
        <div className="bg-white text-black px-6 py-2 rounded-full font-black text-2xl mb-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          NO. {playerNum}
        </div>

        {!isRegistered ? (
          // [등록 폼]
          <div className="w-full max-w-sm bg-black p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-pink-500 mb-2 text-center">참가자 등록</h2>
            <p className="text-gray-400 text-xs mb-6 text-center">
              재입장 및 계정 복구를 위해<br/>정보를 입력해주세요.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={instagramId}
                onChange={(e) => setInstagramId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-pink-500 outline-none"
                placeholder="인스타그램 ID (@없이 입력)"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-pink-500 outline-none"
                placeholder="비밀번호 설정"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-pink-500 outline-none"
                placeholder="비밀번호 확인"
              />
              <button onClick={handleRegister} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded mt-2">
                등록 완료
              </button>
            </div>
          </div>
        ) : (
          // [대기실]
          <div className="text-center w-full max-w-sm animate-fade-in">
            <h1 className="text-3xl font-black text-green-400 mb-2">준비 완료</h1>
            <p className="text-gray-300 mb-10">게임 시작을 기다려주세요.</p>
            <div className="bg-black bg-opacity-50 p-6 rounded-lg border border-gray-600 mb-8">
              <p className="text-pink-500 font-bold text-xl">NO. {playerNum}</p>
              <p className="text-gray-500 text-sm mt-2">이 번호가 당신의 ID입니다.</p>
            </div>
            <button className="w-full bg-gray-700 text-gray-400 font-bold py-4 rounded cursor-not-allowed" disabled>
              게임 시작 대기 중...
            </button>
          </div>
        )}
      </div>
    );
  }

  // C. [메인 화면]
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-black text-pink-600 mb-4">DEAD OR PLAY</h1>
      <p className="text-gray-400 mb-12 text-sm">운명을 시험하시겠습니까?</p>

      <button onClick={createTicket} className="w-64 py-4 border-2 border-pink-600 text-pink-500 font-bold text-xl rounded hover:bg-pink-600 hover:text-white transition-all mb-4">
        참가하기
      </button>

      <button onClick={() => setStatus("LOGIN")} className="text-gray-500 text-sm hover:text-white underline transition-colors">
        이미 참가번호가 있으신가요? (로그인)
      </button>
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