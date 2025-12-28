"use client";

export default function VoteGame({ config, handleAction, myVote }: any) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {config.options.map((option: string, idx: number) => {
        const isSelected = myVote === option;
        const isDisabled = !!myVote; // 투표했으면 버튼 잠금

        return (
          <button
            key={idx}
            onClick={() => !isDisabled && handleAction(option)}
            disabled={isDisabled}
            className={`
              relative p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center min-h-[150px]
              ${isSelected
                ? "bg-green-900/30 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105 z-10"
                : isDisabled
                  ? "bg-gray-900 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed"
                  : "bg-gray-800 border-gray-700 hover:border-pink-500 hover:bg-gray-700 text-white"
              }
            `}
          >
            {isSelected && (
              <div className="absolute -top-3 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                내가 선택함
              </div>
            )}
            <span className="text-2xl font-black break-keep">{option}</span>
          </button>
        );
      })}
    </div>
  );
}