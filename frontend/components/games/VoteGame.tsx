"use client";

import { motion } from "framer-motion";

export default function VoteGame({ config, handleAction, myVote }: any) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {config.options.map((option: string, idx: number) => {
        const isSelected = myVote === option;
        const isDisabled = !!myVote; // 투표했으면 버튼 잠금

        return (
          <motion.button
            key={idx}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            onClick={() => !isDisabled && handleAction(option)}
            disabled={isDisabled}
            className={`
              relative w-full p-5 rounded-xl border transition-all flex items-center justify-between group
              ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white'}
              ${isSelected
                ? "bg-white border-white" // 선택됨: 화이트 배경
                : "bg-transparent border-white/20" // 기본: 투명 + 얇은 테두리
              }
            `}
          >
            <div className={`flex items-center gap-4 ${isSelected ? "text-black" : "text-white"}`}>
              {/* 왼쪽: A, B, C... 인덱스 */}
              <span className={`text-xl font-black ${isSelected ? "text-black" : "text-gray-600 group-hover:text-gray-400"}`}>
                {String.fromCharCode(65 + idx)}
              </span>

              {/* 가운데: 선택지 텍스트 */}
              <span className="text-lg font-bold break-keep text-left">
                {option}
              </span>
            </div>

            {/* 오른쪽: 체크 아이콘 (선택 시만 보임) */}
            {isSelected && (
              <span className="text-black font-black text-xl">✓</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}