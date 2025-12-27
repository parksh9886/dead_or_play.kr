"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id");

  // 상태 관리
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [displayId, setDisplayId] = useState("");

  // 회원가입 입력값
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // 로그인 입력값
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // 🛠️ [핵심] 에러 메시지 분석 함수 (object Object 해결사)
  const handleError = (data: any) => {
    console.error("Server Error:", data); // 개발자 도구 콘솔에서도 확인 가능하게 출력

    if (data.detail) {
      // Pydantic 유효성 검사 에러일 경우 (배열 형태)
      if (Array.isArray(data.detail)) {
        const msg = data.detail[0]?.msg || "입력값이 올바르지 않습니다.";
        alert(`오류: ${msg}`);
      } else {
        // 일반 에러 메시지
        alert(data.detail);
      }
    } else if (data.message) {
      alert(data.message);
    } else {
      alert("알 수 없는 오류가 발생했습니다.");
    }
  };

  // 1. [티켓 생성] 참가하기
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });
      const data = await res.json();

      if (res.ok && data.lootlabs_url) {
        sessionStorage.setItem("pending_ticket", data.ticket_id);
        window.location.href = data.lootlabs_url;
      } else {
        handleError(data);
        setStatus("IDLE");
      }
    } catch (e) {
      alert("서버와 연결할 수 없습니다.");
      setStatus("IDLE");
    }
  };

  // 2. [티켓 검증] 페이지 로드 시
  useEffect(() => {
    let targetTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    if (targetTicket) {
      setStatus("LOADING");
//       if (!urlClickId) sessionStorage.removeItem("pending_ticket");

      fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS") {
            setDisplayId(data.instagram_id || "");

            if (data.has_password) {
              // 이미 가입된 경우
              setIsRegistered(true);
              const storedTicket = sessionStorage.getItem("my_ticket");
              if (storedTicket === targetTicket) setStatus("INTRO");
              else setStatus("LOCKED");
            } else {
              // 신규 -> 회원가입
              setStatus("INTRO");
            }
          } else {
            handleError(data);
            window.location.href = "/";
          }
        })
        .catch(() => setStatus("IDLE"));
    }
  }, [urlClickId]);

  // 3. [회원가입] 강력한 검증 로직 추가 ✅
  const handleRegister = async () => {
    // A. 입력값 검증
    if (!instagramId || instagramId.length < 2) {
      return alert("인스타그램 ID를 정확히 입력해주세요.");
    }
    if (!password || password.length < 4) {
      return alert("비밀번호는 최소 4자리 이상이어야 합니다.");
    }

    // B. 비밀번호 일치 확인 (요청하신 기능)
    if (password !== confirmPassword) {
      return alert("❌ 비밀번호가 서로 다릅니다.\n다시 확인해주세요.");
    }

    // C. 티켓 ID 확인 (이게 없으면 무조건 실패함)
    const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");
    if (!currentTicket) {
      return alert("티켓 정보가 없습니다. 처음부터 다시 시도해주세요.");
    }

    try {
      const res = await fetch(`${BACKEND_URL}/gate/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          click_id: currentTicket,
          password: password,
          instagram_id: instagramId
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        alert("✅ 등록 완료! 환영합니다.");
        sessionStorage.removeItem("pending_ticket");
        sessionStorage.setItem("my_ticket", currentTicket);
        setDisplayId(instagramId);
        setIsRegistered(true);
        setStatus("INTRO");
      } else {
        handleError(data);
      }
    } catch (e) {
      alert("등록 중 네트워크 오류가 발생했습니다.");
    }
  };

  // 4. [로그인]
  const handleLogin = async () => {
    if (!loginId || !loginPw) return alert("아이디와 비밀번호를 입력하세요.");

    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram_id: loginId,
          password: loginPw
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        sessionStorage.setItem("my_ticket", data.ticket_id);
        window.location.href = `/?click_id=${data.ticket_id}`;
      } else {
        handleError(data);
      }
    } catch (e) {
      alert("로그인 오류");
    }
  };

  // 5. [잠금 해제]
  const handleUnlock = async () => {
    if (!unlockPw) return alert("비밀번호를 입력하세요.");

    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram_id: displayId,
          password: unlockPw
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        const ticketToSave = urlClickId || data.ticket_id;
        sessionStorage.setItem("my_ticket", ticketToSave);
        setStatus("INTRO");
      } else {
        alert("비밀번호가 일치하지 않습니다.");
      }
    } catch (e) {
      alert("서버 오류");
    }
  };

  // --- 렌더링 ---

  if (status === "LOADING") return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold animate-pulse">LOADING...</div>;

  // 잠금 화면
  if (status === "LOCKED") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-pink-500 mb-2">@{displayId}</h2>
        <p className="text-gray-400 text-sm mb-6">본인 확인이 필요합니다.</p>
        <input type="password" value={unlockPw} onChange={(e) => setUnlockPw(e.target.value)} className="w-full max-w-xs bg-gray-800 border border-gray-600 rounded p-3 text-white mb-4 outline-none focus:border-pink-500" placeholder="비밀번호" />
        <button onClick={handleUnlock} className="w-full max-w-xs bg-pink-600 font-bold py-3 rounded hover:bg-pink-700">잠금 해제</button>
        <button onClick={() => window.location.href = "/"} className="w-full mt-4 text-gray-500 text-sm">메인으로</button>
      </div>
    );
  }

  // 로그인 화면
  if (status === "LOGIN") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-3xl font-black text-pink-500 mb-8">LOGIN</h2>
        <div className="w-full max-w-sm space-y-4">
          <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white outline-none focus:border-pink-500" placeholder="인스타 ID (@없이 입력)" />
          <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white outline-none focus:border-pink-500" placeholder="비밀번호" />
          <button onClick={handleLogin} className="w-full bg-pink-600 font-bold py-4 rounded hover:bg-pink-700 transition-colors">입장하기</button>
          <button onClick={() => setStatus("IDLE")} className="w-full text-gray-500 text-sm py-2">← 뒤로 가기</button>
        </div>
      </div>
    );
  }

  // 대기실 & 회원가입
  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center border-8 border-pink-600 overflow-y-auto">
        <div className="bg-white text-black px-6 py-2 rounded-full font-black text-xl mb-8 shadow-lg">
          {isRegistered ? `@${displayId}` : "GUEST"}
        </div>

        {!isRegistered ? (
          // 회원가입 폼
          <div className="w-full max-w-sm bg-black p-6 rounded-lg border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold text-pink-500 mb-2 text-center">참가자 등록</h2>
            <p className="text-gray-400 text-xs mb-6 text-center">로그인에 사용할 정보를 입력해주세요.</p>

            <div className="space-y-3">
              <input type="text" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white outline-none focus:border-pink-500" placeholder="인스타 ID" />

              <div className="relative">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white outline-none focus:border-pink-500" placeholder="비밀번호 설정 (4자리 이상)" />
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-gray-800 border rounded p-3 text-white outline-none focus:border-pink-500 ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="비밀번호 확인"
                />
              </div>

              {/* 비밀번호 불일치 시 경고 메시지 표시 */}
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs text-right font-bold">비밀번호가 일치하지 않습니다!</p>
              )}

              <button onClick={handleRegister} className="w-full bg-pink-600 font-bold py-4 rounded mt-2 hover:bg-pink-700 transition-colors">등록 완료</button>
            </div>
          </div>
        ) : (
          // 대기실
          <div className="text-center w-full max-w-sm animate-fade-in">
            <h1 className="text-3xl font-black text-green-400 mb-2">준비 완료</h1>
            <p className="text-gray-300 mb-10">게임 시작을 기다려주세요.</p>
            <div className="bg-black bg-opacity-50 p-6 rounded-lg border border-gray-600">
              <p className="text-pink-500 font-bold text-lg">@{displayId}</p>
              <p className="text-gray-500 text-sm mt-2">접속 성공</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 메인 화면
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-black text-pink-600 mb-4">DEAD OR PLAY</h1>
      <p className="text-gray-400 mb-12 text-sm">운명을 시험하시겠습니까?</p>
      <button onClick={createTicket} className="w-64 py-4 border-2 border-pink-600 text-pink-500 font-bold text-xl rounded hover:bg-pink-600 hover:text-white mb-4 transition-all">참가하기</button>
      <button onClick={() => setStatus("LOGIN")} className="text-gray-500 text-sm underline hover:text-white transition-colors">기존 참가자 로그인</button>
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