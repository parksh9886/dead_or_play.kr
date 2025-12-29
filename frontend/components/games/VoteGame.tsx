"use client";

import { motion } from "framer-motion";

interface VoteGameProps {
  config: {
    options: string[];
  };
  onSelect: (option: string) => void; // 바로 제출 안 하고 선택만 함
  selectedOption: string | null;      // 현재 선택 중인 옵션 (DEAL 대기 중)
  myVote?: string | null;             // (이미 제출한 경우) 내 진짜 투표
}

export default function VoteGame({ config, onSelect, selectedOption, myVote }: VoteGameProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {config.options.map((option: string, idx: number) => {
        // 1. 이미 제출된 투표인가? (과거의 선택)
        const isConfirmed = myVote === option;

        // 2. 지금 막 눌러서 DEAL 대기 중인가? (현재 선택)
        const isSelected = selectedOption === option;

        // 3. 버튼 잠금 여부 (이미 제출했거나 결과가 나왔으면 잠금)
        const isDisabled = !!myVote;

        return (
          <motion.button
            key={idx}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            onClick={() => !isDisabled && onSelect(option)}
            disabled={isDisabled}
            className={`
              relative w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group
              ${isDisabled
                ? 'cursor-not-allowed opacity-50 border-gray-800'
                : 'cursor-pointer'
              }
              ${isConfirmed
                ? "bg-green-900/40 border-green-500 text-green-500" // ✅ 이미 확정됨
                : isSelected
                  ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-[1.02] z-10" // ✨ 선택됨 (DEAL 대기)
                  : "bg-transparent border-white/20 text-white hover:border-white/50" // 기본 상태
              }
            `}
          >
            <div className="flex items-center gap-4">
              {/* 왼쪽: A, B 인덱스 */}
              <span className={`text-xl font-black ${isSelected || isConfirmed ? "opacity-100" : "text-gray-600"}`}>
                {String.fromCharCode(65 + idx)}
              </span>

              {/* 가운데: 텍스트 */}
              <span className="text-lg font-bold break-keep text-left">
                {option}
              </span>
            </div>

            {/* 오른쪽: 상태 아이콘 */}
            <span className="text-xl font-black">
               {isConfirmed && "✓"}
               {!isConfirmed && isSelected && "●"}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}