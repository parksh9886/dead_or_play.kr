"use client";
import { useState } from "react";

export default function QuizGame({ config, handleAction, myVote }: any) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!answer) return;
    handleAction(answer);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="text"
          value={myVote || answer} // 투표했으면 내 답안 보여주기
          onChange={(e) => !myVote && setAnswer(e.target.value)}
          disabled={!!myVote} // 투표했으면 잠금
          className={`
            w-full p-4 text-center text-xl font-bold rounded-xl outline-none border-2 transition-all
            ${myVote
              ? "bg-green-900/20 border-green-500 text-green-400"
              : "bg-gray-900 border-gray-700 text-white focus:border-pink-500"
            }
          `}
          placeholder={config.placeholder || "정답을 입력하세요"}
        />
        {myVote && (
           <div className="text-center text-xs text-green-500 mt-2 font-bold">
             ✅ 제출 완료된 답안입니다.
           </div>
        )}
      </div>

      {!myVote && (
        <button
          onClick={handleSubmit}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
        >
          정답 제출하기
        </button>
      )}
    </div>
  );
}