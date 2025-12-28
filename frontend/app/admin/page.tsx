"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  // 🚨 배포 전, 비밀번호를 꼭 복잡한 것으로 변경하세요!
  const ADMIN_PASS = "1234";

  const [rounds, setRounds] = useState<any[]>([]);

  // 입력 폼 상태
  const [gameType, setGameType] = useState("VOTE");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adUrl, setAdUrl] = useState(""); // 🔗 광고 링크 상태 추가

  // VOTE용 입력값
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  // QUIZ용 입력값
  const [quizPlaceholder, setQuizPlaceholder] = useState("");

  const checkLogin = () => { if (password === ADMIN_PASS) { setIsAdmin(true); fetchRounds(); } else alert("비번 틀림"); };
  const fetchRounds = async () => { const { data } = await supabase.from('game_rounds').select('*').order('id', { ascending: false }); if (data) setRounds(data); };

  // 라운드 종료
  const closeRound = async (id: number, type: string, answerInput: string) => {
    const confirmMsg = `정답을 [ ${answerInput} ]로 확정하고 종료하시겠습니까?`;
    if (!confirm(confirmMsg)) return;
    const { error } = await supabase.from('game_rounds').update({ status: 'CLOSED', correct_answer: answerInput }).eq('id', id);
    if (!error) { alert("종료됨"); fetchRounds(); }
  };

  // 다음 라운드 생성
  const createNextRound = async () => {
    if (!newTitle) return alert("제목을 입력하세요");

    let config = {};
    if (gameType === 'VOTE') {
      if (!optionA || !optionB) return alert("선택지를 모두 입력하세요");
      config = { options: [optionA, optionB] };
    } else if (gameType === 'QUIZ') {
      config = { placeholder: quizPlaceholder || "정답을 입력하세요" };
    }

    const nextId = rounds.length > 0 ? rounds[0].id + 1 : 1;

    const { error } = await supabase.from('game_rounds').insert({
      id: nextId,
      title: newTitle,
      description: newDesc,
      game_type: gameType,
      config: config,
      ad_url: adUrl, // 🔗 DB에 링크 저장
      status: 'ACTIVE'
    });

    if (!error) {
      alert("생성 완료!");
      setNewTitle(""); setOptionA(""); setOptionB(""); setQuizPlaceholder(""); setAdUrl("");
      fetchRounds();
    } else {
      alert(error.message);
    }
  };

  if (!isAdmin) return <div className="bg-black min-h-screen text-white p-10 text-center"><input type="password" onChange={e=>setPassword(e.target.value)} className="text-black p-2" /><button onClick={checkLogin} className="bg-red-500 p-2 ml-2">Login</button></div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 pb-32">
      <h1 className="text-3xl font-bold text-red-600 mb-8">컨트롤 타워</h1>

      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-12">
        <h2 className="text-xl font-bold mb-4 text-green-400">✅ 다음 라운드 설계</h2>

        <div className="flex gap-4 mb-4">
          <button onClick={() => setGameType("VOTE")} className={`px-4 py-2 rounded font-bold ${gameType === 'VOTE' ? 'bg-pink-600' : 'bg-gray-700'}`}>투표 (A/B)</button>
          <button onClick={() => setGameType("QUIZ")} className={`px-4 py-2 rounded font-bold ${gameType === 'QUIZ' ? 'bg-pink-600' : 'bg-gray-700'}`}>주관식 퀴즈</button>
        </div>

        <div className="grid gap-4">
          <input className="bg-gray-800 p-3 rounded" placeholder="라운드 제목" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
          <input className="bg-gray-800 p-3 rounded" placeholder="설명/힌트" value={newDesc} onChange={e=>setNewDesc(e.target.value)} />

          {/* 🔗 광고 링크 입력창 추가 */}
          <input className="bg-gray-800 p-3 rounded border border-yellow-600/50" placeholder="🔒 LootLabs 링크 (미입력시 잠금해제 무료)" value={adUrl} onChange={e=>setAdUrl(e.target.value)} />

          {gameType === 'VOTE' && (
            <div className="flex gap-4">
              <input className="bg-gray-800 p-3 rounded w-1/2" placeholder="선택지 A" value={optionA} onChange={e=>setOptionA(e.target.value)} />
              <input className="bg-gray-800 p-3 rounded w-1/2" placeholder="선택지 B" value={optionB} onChange={e=>setOptionB(e.target.value)} />
            </div>
          )}
          {gameType === 'QUIZ' && (
            <input className="bg-gray-800 p-3 rounded" placeholder="입력창 안내문구" value={quizPlaceholder} onChange={e=>setQuizPlaceholder(e.target.value)} />
          )}

          <button onClick={createNextRound} className="bg-green-600 py-3 rounded font-bold mt-2">게임 시작 (ACTIVE)</button>
        </div>
      </div>

      <div className="space-y-4">
        {rounds.map((round) => (
          <div key={round.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between">
               <h3 className="font-bold text-lg"><span className="text-pink-500">[{round.game_type}]</span> {round.title}</h3>
               <span className={round.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}>{round.status}</span>
            </div>
            {/* 링크 확인용 */}
            {round.ad_url && <p className="text-xs text-yellow-500 mt-1">🔗 Link: {round.ad_url}</p>}

            {round.status === 'ACTIVE' && (
               <div className="mt-4 flex gap-2">
                 {round.game_type === 'VOTE' ? (
                   <>
                    <button onClick={() => closeRound(round.id, 'VOTE', 'A')} className="px-3 py-1 bg-gray-600 hover:bg-pink-600 rounded">A 승리</button>
                    <button onClick={() => closeRound(round.id, 'VOTE', 'B')} className="px-3 py-1 bg-gray-600 hover:bg-purple-600 rounded">B 승리</button>
                   </>
                 ) : (
                   <div className="flex w-full gap-2">
                     <input id={`ans-${round.id}`} className="bg-black p-2 rounded flex-1" placeholder="정답 입력" />
                     <button onClick={() => {
                       const val = (document.getElementById(`ans-${round.id}`) as HTMLInputElement).value;
                       if(val) closeRound(round.id, 'QUIZ', val);
                     }} className="bg-red-600 px-4 rounded font-bold">종료</button>
                   </div>
                 )}
               </div>
            )}
            {round.status === 'CLOSED' && <p className="text-gray-500 mt-2">정답: {round.correct_answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}