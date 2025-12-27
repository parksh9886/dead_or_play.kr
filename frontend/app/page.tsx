"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GameContent() {
  const searchParams = useSearchParams();
  const urlClickId = searchParams.get("click_id");

  // 상태: IDLE(메인), LOADING, INTRO(대기실), LOGIN(로그인창), LOCKED(잠금)
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "INTRO" | "LOGIN" | "LOCKED">("IDLE");

  // 사용자 정보
  const [displayId, setDisplayId] = useState(""); // 화면에 보여줄 인스타ID
  const [playerNum, setPlayerNum] = useState("0000"); // 뱃지용 번호

  // 입력 폼 상태
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // 로그인 입력값
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [unlockPw, setUnlockPw] = useState("");

  const BACKEND_URL = "https://dead-or-play-kr.onrender.com";

  // 1. [신규] 참가하기 (광고 보러 가기)
  const createTicket = async () => {
    setStatus("LOADING");
    try {
      const res = await fetch(`${BACKEND_URL}/gate/create`, { method: "POST" });
      const data = await res.json();

      if (data.lootlabs_url && data.ticket_id) {
        // 티켓 임시 저장 (광고 보고 돌아올 때 대비)
        sessionStorage.setItem("pending_ticket", data.ticket_id);
        window.location.href = data.lootlabs_url;
      } else {
        alert("오류: 티켓을 생성할 수 없습니다.");
        setStatus("IDLE");
      }
    } catch (e) {
      alert("서버 연결 실패");
      setStatus("IDLE");
    }
  };

  // 2. [검증] 광고 보고 돌아왔거나, 링크로 들어왔을 때
  useEffect(() => {
    let targetTicket = urlClickId;
    // URL에 없으면 저장해둔 티켓 확인
    if (!targetTicket) targetTicket = sessionStorage.getItem("pending_ticket");

    if (targetTicket) {
      setStatus("LOADING");
      // 일회용 임시 티켓 삭제
      if (!urlClickId) sessionStorage.removeItem("pending_ticket");

      fetch(`${BACKEND_URL}/gate/callback?click_id=${targetTicket}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS") {
            setPlayerNum(data.player_num);
            setDisplayId(data.instagram_id || "GUEST");

            if (data.has_password) {
              // 이미 가입된 유저
              setIsRegistered(true);
              const storedTicket = sessionStorage.getItem("my_ticket");

              // 내 브라우저면 통과, 아니면 잠금
              if (storedTicket === targetTicket) setStatus("INTRO");
              else setStatus("LOCKED");
            } else {
              // 신규 유저 -> 회원가입 폼 표시
              setStatus("INTRO");
            }
          } else {
            alert(data.message || "유효하지 않은 접근입니다.");
            window.location.href = "/";
          }
        })
        .catch(() => setStatus("IDLE"));
    }
  }, [urlClickId]);

  // 3. [회원가입] 인스타ID + 비밀번호 설정
  const handleRegister = async () => {
    if (password.length < 4) return alert("비밀번호는 4자리 이상이어야 합니다.");
    if (password !== confirmPassword) return alert("비밀번호가 일치하지 않습니다.");
    if (instagramId.length < 2) return alert("인스타 ID를 입력해주세요.");

    const currentTicket = urlClickId || sessionStorage.getItem("pending_ticket");

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

      if (data.status === "SUCCESS") {
        alert("가입 완료! 자동 로그인됩니다.");
        // 로그인 정보 저장
        if (currentTicket) sessionStorage.setItem("my_ticket", currentTicket);
        setDisplayId(instagramId);
        setIsRegistered(true);
        setStatus("INTRO"); // 바로 대기실로
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  // 4. [기존 유저 로그인] 인스타ID + 비밀번호
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

      if (data.status === "SUCCESS") {
        // 로그인 성공 -> 대기실로 이동 (광고 없음)
        sessionStorage.setItem("my_ticket", data.ticket_id);
        window.location.href = `/?click_id=${data.ticket_id}`;
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("로그인 서버 오류");
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
          instagram_id: displayId, // 현재 화면에 뜬 아이디로 검증
          password: unlockPw
        }),
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
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

  if (status === "LOADING") return <div className="min-h-screen bg-black text-pink-500 flex items-center justify-center font-bold animate-pulse">LOADING...</div>;

  // A. [잠금 화면]
  if (status === "LOCKED") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-pink-500 mb-2">@{displayId}</h2>
        <p className="text-gray-400 text-sm mb-6">계정 주인임을 확인해주세요.</p>
        <input
          type="password"
          value={unlockPw}
          onChange={(e) => setUnlockPw(e.target.value)}
          className="w-full max-w-xs bg-gray-800 border border-gray-600 rounded p-3 text-white mb-4 outline-none focus:border-pink-500"
          placeholder="비밀번호"
        />
        <button onClick={handleUnlock} className="w-full max-w-xs bg-pink-600 font-bold py-3 rounded hover:bg-pink-700">잠금 해제</button>
        <button onClick={() => window.location.href = "/"} className="w-full mt-4 text-gray-500 text-sm">메인으로