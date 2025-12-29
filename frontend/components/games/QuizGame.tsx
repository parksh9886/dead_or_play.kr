"use client";
import { useState, useEffect } from "react";

interface QuizGameProps {
  config: { placeholder?: string };
  onSelect: (value: string) => void;
  selectedAnswer: string | null;
  myVote?: string | null;
}

export default function QuizGame({ config, onSelect, selectedAnswer, myVote }: QuizGameProps) {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (myVote) setAnswer(myVote);
    else if (selectedAnswer) setAnswer(selectedAnswer);
  }, [myVote, selectedAnswer]);

  const handlePreSubmit = () => {
    if (!answer.trim()) return;
    onSelect(answer.trim());
  };

  const isLocked = !!myVote || !!selectedAnswer;

  return (
    <div className="flex flex-col gap-6 w-full">

      <div className="flex justify-center">
        <span className="bg-red-600/10 text-red-500 text-[10px] border border-red-600/50 px-2 py-1 rounded font-bold tracking-widest uppercase">
          QUIZ MISSION
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={answer}
          onChange={(e) => !isLocked && setAnswer(e.target.value)}
          disabled={isLocked}
          className={`
            w-full p-5 text-center text-xl font-bold rounded-xl outline-none border transition-all placeholder:text-gray-800
            ${myVote
              ? "bg-white text-black border-white"
              : selectedAnswer
                ? "bg-gray-800 text-white border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                : "bg-black text-white border-white/20 focus:border-white"
            }
          `}
          placeholder={config.placeholder || "정답을 입력하세요"}
        />

        {myVote && (
           <div className="text-center text-xs text-gray-500 mt-3 font-bold flex items-center justify-center gap-1">
             <span>🔒</span> 답안이 암호화되어 전송되었습니다.
           </div>
        )}
      </div>

      {!isLocked && (
        <button
          onClick={handlePreSubmit}
          className="w-full bg-white text-black font-black py-4 rounded-xl text-lg hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
        >
          입력 완료 (확인)
        </button>
      )}

      {!myVote && selectedAnswer && (
        <p className="text-center text-xs text-red-500 animate-pulse font-bold">
          하단의 [ MAKE A DEAL ] 버튼을 눌러 확정하세요.
        </p>
      )}
    </div>
  );
}