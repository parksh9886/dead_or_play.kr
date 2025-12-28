"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const ADMIN_PASS = "1234";

  const [rounds, setRounds] = useState<any[]>([]);

  // 입력 폼 상태
  const [gameType, setGameType] = useState("VOTE");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [adUrl, setAdUrl] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [roundStatus, setRoundStatus] = useState("ACTIVE");

  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [quizPlaceholder, setQuizPlaceholder] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const checkLogin = () => { if (password === ADMIN_PASS) { setIsAdmin(true); fetchRounds(); } else alert("비번 틀림"); };

  const fetchRounds = async () => {
    const { data } = await supabase.from('game_rounds').select('*').order('id', { ascending: false });
    if (data) setRounds(data);
  };

  const closeRound = async (id: number, answerInput: string) => {
    if (!confirm(`정답을 [ ${answerInput} ]로 확정하고 종료하시겠습니까?`)) return;
    const { error } = await supabase.from('game_rounds').update({ status: 'CLOSED', correct_answer: answerInput }).eq('id', id);
    if (!error) { alert("종료됨"); fetchRounds(); }
  };

  const handleSaveRound = async () => {
    if (!title) return alert("제목을 입력하세요");

    let config = {};
    if (gameType === 'VOTE') {
      config = { options: [optionA, optionB] };
    } else if (gameType === 'QUIZ') {
      config = { placeholder: quizPlaceholder || "정답을 입력하세요" };
    }

    if (editingId) {
      // 🔄 수정 모드 (UPDATE)
      const updatePayload: any = {
        title,
        description: desc,
        ad_url: adUrl,
        config,
        game_type: gameType,
        status: roundStatus
      };

      if (correctAnswer) {
        updatePayload.correct_answer = correctAnswer;
      }

      const { error } = await supabase.from('game_rounds').update(updatePayload).eq('id', editingId);

      if (!error) {
        // 🔥 [수정됨] ACTIVE로 되돌릴 때: 탈락자 부활만 수행 (투표 기록 삭제는 위험하므로 제거)
        if (roundStatus === 'ACTIVE') {
           // 부활 (이 스테이지에 있는 탈락자들 살리기)
           await supabase.from('tickets').update({ is_alive: true }).eq('current_stage', editingId);

           alert(`수정 완료! (라운드 ${editingId}의 탈락자 전원 부활 처리됨)`);
        } else {
           alert("수정되었습니다.");
        }

        resetForm();
        fetchRounds();
      } else alert(error.message);

    } else {
      // 🆕 생성 모드 (INSERT)
      const nextId = rounds.length > 0 ? rounds[0].id + 1 : 1;
      const { error } = await supabase.from('game_rounds').insert({
        id: nextId,
        title,
        description: desc,
        game_type: gameType,
        config,
        ad_url: adUrl,
        status: 'ACTIVE'
      });

      if (!error) {
        alert("생성되었습니다.");
        resetForm();
        fetchRounds();
      } else alert(error.message);
    }
  };

  const startEdit = (round: any) => {
    setEditingId(round.id);
    setGameType(round.game_type);
    setTitle(round.title);
    setDesc(round.description);
    setAdUrl(round.ad_url || "");
    setCorrectAnswer(round.correct_answer || "");
    setRoundStatus(round.status);

    if (round.game_type === 'VOTE') {
      setOptionA(round.config.options ? round.config.options[0] : "");
      setOptionB(round.config.options ? round.config.options[1] : "");
    } else if (round.game_type === 'QUIZ') {
      setQuizPlaceholder(round.config.placeholder || "");
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(""); setDesc(""); setAdUrl(""); setOptionA(""); setOptionB(""); setQuizPlaceholder(""); setCorrectAnswer("");
    setRoundStatus("ACTIVE");
  };

  if (!isAdmin) return <div className="bg-black min-h-screen text-white p-10 text-center"><input type="password" onChange={e=>setPassword(e.target.value)} className="text-black p-2" /><button onClick={checkLogin} className="bg-red-500 p-2 ml-2">Login</button></div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 pb-32">
      <h1 className="text-3xl font-bold text-red-600 mb-8">컨트롤 타워</h1>

      <div className={`p-6 rounded-xl border mb-12 ${editingId ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-900 border-gray-700'}`}>
        <h2 className="text-xl font-bold mb-4 flex justify-between">
          {editingId ? `🔄 ${editingId}라운드 수정 중...` : "✅ 새 라운드 생성"}
          {editingId && <button onClick={resetForm} className="text-sm text-gray-400 underline">취소하고 새 라운드 만들기</button>}
        </h2>

        <div className="flex gap-4 mb-4">
          <button onClick={() => setGameType("VOTE")} className={`px-4 py-2 rounded font-bold ${gameType === 'VOTE' ? 'bg-pink-600' : 'bg-gray-700'}`}>투표 (A/B)</button>
          <button onClick={() => setGameType("QUIZ")} className={`px-4 py-2 rounded font-bold ${gameType === 'QUIZ' ? 'bg-pink-600' : 'bg-gray-700'}`}>주관식 퀴즈</button>
        </div>

        <div className="grid gap-4">
          <input className="bg-gray-800 p-3 rounded" placeholder="제목" value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="bg-gray-800 p-3 rounded" placeholder="설명" value={desc} onChange={e=>setDesc(e.target.value)} />
          <input className="bg-gray-800 p-3 rounded border border-yellow-600/50" placeholder="🔒 LootLabs 링크 (수정 가능)" value={adUrl} onChange={e=>setAdUrl(e.target.value)} />

          {editingId && (
             <div className="grid grid-cols-2 gap-4 bg-gray-800/50 p-4 rounded border border-gray-600">
               <div>
                  <label className="text-xs text-gray-400 block mb-1">상태 변경 (부활/종료)</label>
                  <select
                    value={roundStatus}
                    onChange={(e) => setRoundStatus(e.target.value)}
                    className="w-full bg-black p-2 rounded text-white font-bold"
                  >
                    <option value="ACTIVE">🟢 ACTIVE (진행 중 - 부활)</option>
                    <option value="CLOSED">🔴 CLOSED (종료됨)</option>
                  </select>
               </div>
               <div>
                 <label className="text-xs text-red-400 block mb-1">정답 강제 수정</label>
                 <input className="bg-black p-2 rounded w-full text-white" placeholder="예: A" value={correctAnswer} onChange={e=>setCorrectAnswer(e.target.value)} />
               </div>
             </div>
          )}

          {gameType === 'VOTE' && (
            <div className="flex gap-4">
              <input className="bg-gray-800 p-3 rounded w-1/2" placeholder="선택지 A" value={optionA} onChange={e=>setOptionA(e.target.value)} />
              <input className="bg-gray-800 p-3 rounded w-1/2" placeholder="선택지 B" value={optionB} onChange={e=>setOptionB(e.target.value)} />
            </div>
          )}
          {gameType === 'QUIZ' && (
            <input className="bg-gray-800 p-3 rounded" placeholder="안내 문구" value={quizPlaceholder} onChange={e=>setQuizPlaceholder(e.target.value)} />
          )}

          <button onClick={handleSaveRound} className={`py-3 rounded font-bold mt-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {editingId ? "수정사항 저장" : "게임 생성"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {rounds.map((round) => (
          <div key={round.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative">
            <button onClick={() => startEdit(round)} className="absolute top-6 right-6 text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
              ✏️ 수정
            </button>

            <div className="pr-16">
               <h3 className="font-bold text-lg"><span className="text-pink-500">[{round.game_type}]</span> {round.title}</h3>
               <span className={round.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}>{round.status}</span>
            </div>
            {round.ad_url && <p className="text-xs text-yellow-500 mt-1 break-all">🔗 Link: {round.ad_url}</p>}

            {round.status === 'ACTIVE' && (
               <div className="mt-4 flex gap-2">
                 {round.game_type === 'VOTE' ? (
                   <>
                    <button onClick={() => closeRound(round.id, 'A')} className="px-3 py-1 bg-gray-600 hover:bg-pink-600 rounded">A 승리</button>
                    <button onClick={() => closeRound(round.id, 'B')} className="px-3 py-1 bg-gray-600 hover:bg-purple-600 rounded">B 승리</button>
                   </>
                 ) : (
                   <div className="flex w-full gap-2">
                     <input id={`ans-${round.id}`} className="bg-black p-2 rounded flex-1" placeholder="정답 입력" />
                     <button onClick={() => {
                       const val = (document.getElementById(`ans-${round.id}`) as HTMLInputElement).value;
                       if(val) closeRound(round.id, val);
                     }} className="bg-red-600 px-4 rounded font-bold">종료</button>
                   </div>
                 )}
               </div>
            )}
            {round.status === 'CLOSED' && (
                <div className="mt-2 text-sm">
                    <span className="text-gray-400">정답: </span>
                    <span className="text-white font-bold text-lg">{round.correct_answer}</span>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}