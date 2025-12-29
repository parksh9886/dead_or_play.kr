"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoteGame from "./games/VoteGame";
import QuizGame from "./games/QuizGame";

interface GameRendererProps {
  roundData: {
    game_type: string;
    config: any;
  };
  handleGameAction: (answer: string) => void;
  myVote?: string | null;
}

export default function GameRenderer({ roundData, handleGameAction, myVote }: GameRendererProps) {

  // 현재 선택(입력)한 값 (아직 제출 안 함)
  const [localSelection, setLocalSelection] = useState<string | null>(null);

  // 하위 게임에서 "나 이거 골랐어/입력했어" 라고 알려주는 함수
  const handleSelect = (value: string) => {
    setLocalSelection(value);
  };

  // 진짜 제출 (DEAL 버튼 클릭 시)
  const confirmDeal = () => {
    if (localSelection) {
      handleGameAction(localSelection);
      setLocalSelection(null);
    }
  };

  // ✅ [추가됨] 제출 완료(myVote) 시 보여줄 '대기 전광판'
  if (myVote) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* 상단 상태 메시지 */}
        <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/20 border border-green-500/30 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-500 text-[10px] font-bold tracking-widest uppercase">Signal Locked</span>
            </div>
            <p className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase mb-1">
                Your Selection
            </p>
            <h3 className="text-gray-400 text-sm">운명을 건 당신의 선택</h3>
        </div>

        {/* 선택한 정답 표시 (크게 강조) */}
        <div className="relative mb-10 group cursor-default">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative text-4xl md:text-5xl font-black text-white border-b-2 border-white/10 pb-2 px-6 tracking-tighter drop-shadow-2xl">
              {myVote}
            </div>
        </div>

        {/* 안내 문구 박스 */}
        <div className="bg-neutral-900/80 p-6 rounded-2xl border border-white/10 text-center w-full max-w-sm backdrop-blur-sm shadow-xl">
           <p className="text-white font-bold text-lg mb-2">제출이 완료되었습니다.</p>
           <p className="text-gray-400 text-xs leading-relaxed break-keep">
             운영자가 라운드를 종료하고<br/>
             결과를 발표할 때까지 대기하십시오.
           </p>
           <div className="mt-4 h-1 w-24 bg-gray-800 rounded-full mx-auto overflow-hidden">
             <div className="h-full bg-gray-500 w-1/2 animate-[loading_1.5s_ease-in-out_infinite]"></div>
           </div>
        </div>

      </div>
    );
  }

  // 아직 제출 안 했을 때 (게임 진행 화면)
  return (
    <>
      <div className="w-full relative z-0">
        {roundData.game_type === 'VOTE' && (
          <VoteGame
            config={roundData.config}
            onSelect={handleSelect}
            selectedOption={localSelection}
            myVote={myVote}
          />
        )}

        {roundData.game_type === 'QUIZ' && (
          <QuizGame
            config={roundData.config}
            onSelect={handleSelect}
            selectedAnswer={localSelection}
            myVote={myVote}
          />
        )}

        {!['VOTE', 'QUIZ'].includes(roundData.game_type) && (
          <div className="text-red-500 text-center">알 수 없는 게임 타입입니다.</div>
        )}
      </div>

      {/* 🔥 [DEAL 패널] 투표/퀴즈 모두 공통 적용 */}
      <AnimatePresence>
        {!myVote && localSelection && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-4 right-4 z-50"
          >
            <div className="bg-neutral-900/95 border-2 border-white/20 p-5 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">

              <p className="text-gray-400 text-xs mb-3 font-medium uppercase tracking-widest animate-pulse">
                {roundData.game_type === 'QUIZ' ? "이 정답을 전송하시겠습니까?" : "이 선택에 운명을 걸겠습니까?"}
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setLocalSelection(null)}
                  className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>

                <button
                  onClick={confirmDeal}
                  className="flex-[2] py-4 bg-red-600 text-white font-black text-xl rounded-xl hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 tracking-tighter"
                >
                  MAKE A DEAL
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}