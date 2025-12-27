"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GameContent() {
  const searchParams = useSearchParams();
  const click_id = searchParams.get("click_id");

  // 상태 관리
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO">("IDLE");
  const [playerNum, setPlayerNum] = useState("000");

  // 비밀번호 관련 상태
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistered, setIsRegistered] = useState(false); // 비밀번호 설정 완료 여부

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com"; // ⚠️ 본인 주소 확인

  // 1. 참가하기 (기존 동일)
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });
      const data = await res.json();
      if (data.lootlabs_url) window.location.href = data.lootlabs_url;
    } catch (e) {
      alert("서버 오류");
      setStatus("IDLE");
    }
  };

  // 2. 복귀 후 체크 (기존 동일)
  useEffect(() => {
    if (click_id) {
      setStatus("LOADING");
      fetch(`${BACKEND_URL}/gate/callback?click_id=${click_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS") {
            setPlayerNum(data.player_num);
            setStatus("INTRO");
          } else {
            alert(data.message);
            window.location.href = "/";
          }
        })
        .catch(() => setStatus("IDLE"));
    }
  }, [click_id]);

  // 3. [신규 기능] 비밀번호 저장 요청
  const handleRegister = async () => {
    if (password.length < 4) {
      alert("비밀번호는 4자리 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      alert("비밀번호가 서로 다릅니다.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/gate/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          click_id: click_id,
          password: password
        }),
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
        alert("등록이 완료되었습니다! 계정 정보를 잊지 마세요.");
        setIsRegistered(true); // 등록 완료 상태로 변경
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  // --- 화면 렌더링 ---

  if (status === "LOADING") {
    return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold animate-pulse">LOADING...</div>;
  }

  // 참가자 정보 등록 및 대기 화면
  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center font-sans border-8 border-pink-600 overflow-y-auto">

        {/* 참가번호 배지 */}
        <div className="bg-white text-black px-6 py-2 rounded-full font-black text-2xl mb-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          NO. {playerNum}
        </div>

        {/* --- [A] 아직 등록 안 함: 비밀번호 설정 화면 --- */}
        {!isRegistered ? (
          <div className="w-full max-w-sm bg-black p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-pink-500 mb-4 text-center">계정 등록</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              나중에 다시 입장하려면<br/>비밀번호가 필요합니다.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">비밀번호 설정</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-pink-500 outline-none"
                  placeholder="비밀번호 입력"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-pink-500 outline-none"
                  placeholder="한 번 더 입력"
                />
              </div>

              <button
                onClick={handleRegister}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded mt-4 transition-colors"
              >
                등록하고 입장하기
              </button>
            </div>
          </div>
        ) : (
          /* --- [B] 등록 완료: 게임 대기 화면 --- */
          <div className="text-center w-full max-w-sm animate-fade-in">
            <h1 className="text-3xl font-black text-green-400 mb-2">등록 완료</h1>
            <p className="text-gray-300 mb-10">잠시 후 게임이 시작됩니다.</p>

            <div className="bg-black bg-opacity-50 p-6 rounded-lg border border-gray-600 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">내 정보</h3>
              <p className="text-pink-500 font-bold text-xl">참가번호 : {playerNum}</p>
              <p className="text-gray-500 text-sm mt-2">* 번호와 비밀번호를 꼭 기억하세요.</p>
            </div>

            <button
              className="w-full bg-gray-700 text-gray-400 font-bold py-4 rounded cursor-not-allowed"
              disabled
            >
              게임 시작 대기 중...
            </button>
          </div>
        )}
      </div>
    );
  }

  // 메인 화면
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-black text-pink-600 mb-4">DEAD OR PLAY</h1>
      <button onClick={createTicket} className="px-10 py-4 border-2 border-pink-600 text-pink-500 font-bold rounded hover:bg-pink-600 hover:text-white transition-all">
        참가하기
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