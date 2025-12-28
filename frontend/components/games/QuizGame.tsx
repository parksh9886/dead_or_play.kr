"use client";
import { useState } from "react";

export default function QuizGame({ config, handleAction }: any) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-6">
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={config.placeholder || "정답 입력"}
        className="w-full p-4 bg-gray-800 text-white text-center text-xl rounded-xl border border-gray-600 focus:border-red-500 outline-none"
      />
      <button
        onClick={() => handleAction(answer)} // 입력한 텍스트를 그대로 보냄
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-xl transition-all"
      >
        제출하기
      </button>
      <p className="text-gray-500 text-xs text-center">※ 오타, 띄어쓰기 주의</p>
    </div>
  );
}