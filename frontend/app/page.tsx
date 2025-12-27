"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GameContent() {
  const searchParams = useSearchParams();
  const click_id = searchParams.get("click_id");

  // 상태: 대기(IDLE) -> 로딩(LOADING) -> 게임설명(INTRO) -> 게임시작(GAME)
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "GAME">("IDLE");
  const [playerNum, setPlayerNum] = useState("000");

  // ⚠️ 백엔드 주소 확인
  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // 1. [입장 전] 티켓 발급 및 광고 이동
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

  // 2. [복귀 후] 티켓 검증
  useEffect(() => {
    if (click_id) {
      setStatus("LOADING");
      fetch(`${BACKEND_URL}/gate/callback?click_id=${click_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS") {
            setPlayerNum(data.player_num); // 서버가 준 참가번호 저장
            setStatus("INTRO"); // 게임 설명 화면으로 이동!
          } else {
            alert(data.message);
            window.location.href = "/"; // 실패시 홈으로
          }
        })
        .catch(() => setStatus("IDLE"));
    }
  }, [click_id]);

  // --- 화면 렌더링 ---

  // A. 로딩 화면
  if (status === "LOADING") {
    return (
      <div className="min-h-screen bg-black text-pink-600 flex items-center justify-center">
        <div className="text-2xl font-bold animate-pulse">참가자 신원 확인 중...</div>
      </div>
    );
  }

  // B. [핵심] 게임 소개 페이지 (광고 보고 온 사람만 볼 수 있음)
  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center font-sans border-8 border-pink-600">

        {/* 상단 참가번호 */}
        <div className="bg-white text-black px-4 py-1 rounded-full font-bold text-lg mb-8 shadow-lg">
          참가번호 {playerNum}번
        </div>

        <h1 className="text-4xl font-black text-pink-500 mb-6 text-center">
          STAGE 1<br/>
          <span className="text-white text-2xl font-normal">미지의 게임</span>
        </h1>

        {/* 게임 규칙 박스 */}
        <div className="bg-black bg-opacity-50 p-6 rounded-lg border border-gray-600 mb-10 max-w-sm w-full">
          <h3 className="text-lg font-bold text-green-400 mb-4 border-b border-gray-600 pb-2">게임 규칙</h3>
          <ul className="space-y-3 text-sm text-gray-300 text-left">
            <li>1. 시작 버튼을 누르면 게임이 시작됩니다.</li>
            <li>2. 제한 시간 안에 미션을 완수하세요.</li>
            <li>3. 실패 시, 즉시 <b>탈락(차단)</b> 처리됩니다.</li>
            <li>4. 행운을 빕니다.</li>
          </ul>
        </div>

        {/* 게임 시작 버튼 (나중에 여기에 진짜 게임 연결) */}
        <button
          onClick={() => alert("🚧 게임 시스템 개발 중입니다! (곧 오픈 예정)")}
          className="w-full max-w-xs bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded text-xl shadow-[0_0_20px_rgba(219,39,119,0.6)] transition-all transform hover:scale-105"
        >
          게임 시작 (START)
        </button>
      </div>
    );
  }

  // C. 메인 화면 (처음 접속)
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-black text-pink-600 mb-2">DEAD OR PLAY</h1>
      <p className="text-gray-500 mb-12 text-sm">목숨을 건 게임에 참가하시겠습니까?</p>

      <button
        onClick={createTicket}
        className="px-12 py-5 border-2 border-white text-white font-bold text-xl rounded hover:bg-white hover:text-black transition-all"
      >
        참가 등록
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