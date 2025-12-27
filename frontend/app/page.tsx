"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id"); // URL에 있는 티켓 (혹시 있으면 사용)

  // 상태 관리: LOCKED(잠김) 상태 포함
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");
  const [playerNum, setPlayerNum] = useState("000");

  // 회원가입용 상태
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // 로그인 및 잠금해제용 상태
  const [loginNum, setLoginNum] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  // ⚠️ 백엔드 주소 (본인 Render 주소 확인)
  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // 1. [신규 입장] 참가하기 (세션 저장 방식 적용 🍪)
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });

      if (!res.ok) {
        throw new Error("서버 응답 오류");
      }

      const data = await res.json();

      if (data.lootlabs_url && data.ticket_id) {
        // [핵심] 떠나기 전에 티켓 번호를 브라우저에 임시 저장!
        // LootLabs가 티켓을 잃어버리고 보내줘도, 이걸로 기억할 수 있음.
        sessionStorage.setItem("pending_ticket", data.ticket_id);

        // 광고 페이지로 이동
        window.location.href = data.lootlabs_url;
      } else {
        alert("티켓 생성에 실패했습니다.");
        setStatus("IDLE");
      }
    } catch (e) {
      console.error(e);
      alert("접속량이 많아 연결이 지연되고 있습니다. 잠시 후 다시 시도해주세요.");
      setStatus("IDLE");
    }
  };

  // 2. [페이지 로드 시] 티켓 검증 (URL 파라미터 or 저장된 티켓 확인)
  useEffect(() => {
    // 1순위: URL에 있는 click_id 사용
    // 2순위: URL에 없으면 아까 저장해둔 pending_ticket 사용
    let targetTicket = urlClickId;

    if (!targetTicket) {
      targetTicket = sessionStorage.getItem("pending_ticket");
    }

    if (targetTicket) {
      setStatus("LOADING");

      // 사용한 임시 티켓은 삭제 (재사용 방지)
      if (!urlClickId) {
        sessionStorage.removeItem("pending_ticket");
      }

      fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS") {
            setPlayerNum(data.player_num);

            // 비밀번호가 있는 기존 유저인지 확인
            if (data.has_password) {
              setIsRegistered(true);

              // 내 기기인지 인증 확인 (자동 로그인)
              const storedTicket = sessionStorage.getItem("my_ticket");

              if (storedTicket === targetTicket) {
                setStatus("INTRO"); // 내 폰이면 바로 통과
              } else {
                setStatus("LOCKED"); // 남의 폰이나 공유 링크면 잠금 🔒
              }
            } else {
              // 비밀번호 없는 신규 유저 -> 회원가입 화면
              setStatus("INTRO");
            }
          } else {
            // [수정] 에러 메시지 확실하게 보여주기 (undefined 방지)
            alert(data.message || data.detail || "알 수 없는 오류가 발생했습니다.");
            window.location.href = "/"; // 메인으로 쫓아내기
          }
        })
        .catch((e) => {
          console.error(e);
          setStatus("IDLE");
        });
    }
  }, [urlClickId]);

  // 3. [회원가입]
  const handleRegister = async () => {
    if (password.length < 4) return alert("비밀번호는 4자리 이상이어야 합니다.");
    if (password !== confirmPassword) return alert("비밀번호가 서로 다릅니다.");
    if (instagramId.length < 2) return alert("인스타그램 ID를 입력해주세요.");

    // 현재 사용 중인 티켓 ID 찾기
    const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

    try {
      const res = await fetch(`${BACKEND_URL}/gate/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          click_id: currentTicket, // 현재 티켓으로 등록
          password: password,
          instagram_id: instagramId
        }),
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
        alert("등록 완료! 참가번호와 비밀번호를 꼭 기억하세요.");
        // 내 브라우저에 인증키 저장 (자동 로그인용)
        if (currentTicket) sessionStorage.setItem("my_ticket", currentTicket);
        setIsRegistered(true);
        setStatus("INTRO");
      } else {
        alert(data.message || data.detail);
      }
    } catch (e) {
      alert("등록 중 오류 발생");
    }
  };

  // 4. [메인화면 로그인]
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
        // 로그인 성공 시 인증키 저장 후 이동
        sessionStorage.setItem("my_ticket", data.ticket_id);
        window.location.href = `/?click_id=${data.ticket_id}`;
      } else {
        alert(data.message || data.detail);
      }
    } catch (e) {
      alert("로그인 서버 오류");
    }
  };

  // 5. [잠금 해제] 공유된 링크로 들어왔을 때 수행
  const handleUnlock = async () => {
    if (!unlockPw) return alert("비밀번호를 입력하세요.");

    try {
      const res = await fetch(`${BACKEND_URL}/gate/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_num: playerNum, // 이미 알고 있는 번호
          password: unlockPw
        }),
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
        // 인증 성공!
        // 티켓 ID를 찾아서 저장 (URL에 있으면 URL 것, 없으면 login 응답 것 사용)
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

  // --- 화면 렌더링 ---

  if (status === "LOADING") {
    return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold animate-pulse">LOADING...</div>;
  }

  // A. [잠금 화면 (보안)]
  if (status === "LOCKED") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-black text-pink-500 mb-2">접근 제한</h2>
        <p className="text-gray-400 text-sm mb-8 text-center">
          참가번호 <b>{playerNum}번</b>의 계정입니다.<br/>
          본인 확인을 위해 비밀번호를 입력하세요.
        </p>

        <div className="w-full max-w-xs space-y-4">
          <input
            type="password"
            value={unlockPw}
            onChange={(e) => setUnlockPw(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded p-3 focus:border-pink-500 outline-none text-white"
            placeholder="비밀번호"
          />
          <button onClick={handleUnlock} className="w-full bg-pink-600 font-bold py-4 rounded hover:bg-pink-700 transition-colors">
            잠금 해제
          </button>
          <button onClick={() => window.location.href = "/"} className="w-full text-gray-500 text-sm py-2">
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // B. [로그인 화면]
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

  // C. [게임 대기실 / 등록 화면]
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

  // D. [메인 화면]
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