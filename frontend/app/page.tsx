"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleEntry = async () => {
    // 1. 버튼 비활성화 (중복 클릭 방지)
    setLoading(true);

    try {
      const res = await fetch("https://dead-or-play-kr.onrender.com/gate/create", {
        method: "POST",
      });
      const data = await res.json();

      if (data.lootlabs_url) {
        // [여기가 핵심 변경점!]
        // 현재 탭 이동(href) 대신 새 탭(open)을 사용합니다.
        // 이러면 브라우저 차단을 99% 우회합니다.
        window.open(data.lootlabs_url, "_blank");

        // 새 탭이 열렸으니, 현재 버튼은 다시 눌러도 되게 풀어줍니다.
        setLoading(false);
      } else {
        alert("링크 생성 실패");
        setLoading(false);
      }

    } catch (error) {
      console.error(error);
      alert("서버 연결 실패");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-10 text-pink-600 tracking-widest">
        PROJECT S
      </h1>

      <p className="mb-8 text-gray-400">
        참가하시겠습니까?
      </p>

      {/* Form 태그 제거 -> 순수 버튼으로 변경 */}
      <button
        onClick={handleEntry}
        disabled={loading}
        className="px-10 py-4 bg-green-600 hover:bg-green-500 rounded-xl text-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "접속 중..." : "입장하기 (Enter)"}
      </button>
    </div>
  );
}