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

        {/* 🔥 [수정됨] 퀴즈 게임에도 선택 로직(onSelect) 연결 */}
        {roundData.game_type === 'QUIZ' && (
          <QuizGame
            config={roundData.config}
            onSelect={handleSelect}
            selectedAnswer={localSelection} // 현재 입력해서 대기 중인 값
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