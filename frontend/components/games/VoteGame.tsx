"use client";

import { motion } from "framer-motion";

interface VoteGameProps {
  config: {
    options: string[];
  };
  onSelect: (option: string) => void;
  selectedOption: string | null;
  myVote?: string | null;
}

export default function VoteGame({ config, onSelect, selectedOption, myVote }: VoteGameProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {config.options.map((option: string, idx: number) => {
        const isConfirmed = myVote === option;
        const isSelected = selectedOption === option;
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
                ? "bg-green-900/40 border-green-500 text-green-500"
                : isSelected
                  ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-[1.02] z-10"
                  : "bg-transparent border-white/20 text-white hover:border-white/50"
              }
            `}
          >
            <div className="flex items-center gap-4">
              <span className={`text-xl font-black ${isSelected || isConfirmed ? "opacity-100" : "text-gray-600"}`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-lg font-bold break-keep text-left">
                {option}
              </span>
            </div>
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