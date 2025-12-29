"use client";
import { useState } from "react";

export default function QuizGame({ config, handleAction, myVote }: any) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!answer.trim()) return;
    handleAction(answer.trim());
  };

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* 미션 배지 (선택 사항) */}
      <div className="flex justify-center">
        <span className="bg-red-600/10 text-red-500 text-[10px] border border-red-600/50 px-2 py-1 rounded font-bold tracking-widest uppercase">
          QUIZ MISSION
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={myVote || answer}
          onChange={(e) => !myVote && setAnswer(e.target.value)}
          disabled={!!myVote}
          className={`
            w-full p-5 text-center text-xl font-bold rounded-xl outline-none border transition-all placeholder:text-gray-800
            ${myVote
              ? "bg-white text-black border-white" // 제출 완료 시: 화이트 배경
              : "bg-black text-white border-white/20 focus:border-white" // 입력 중: 블랙 배경
            }
          `}
          placeholder={config.placeholder || "정답을 입력하세요"}
        />

        {/* 제출 완료 메시지 */}
        {myVote && (
           <div className="text-center text-xs text-gray-500 mt-3 font-bold flex items-center justify-center gap-1">
             <span>🔒</span> 답안이 암호화되어 전송되었습니다.
           </div>
        )}
      </div>

      {/* 제출 버튼 (아직 제출 안 했을 때만 보임) */}
      {!myVote && (
        <button
          onClick={handleSubmit}
          className="w-full bg-white text-black font-black py-4 rounded-xl text-lg hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
        >
          정답 제출하기
        </button>
      )}
    </div>
  );
}