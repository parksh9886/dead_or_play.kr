"use client";

export default function VoteGame({ config, handleAction }: any) {
  // config.options = ["짜장", "짬뽕"] 같은 배열이 들어옴
  return (
    <div className="space-y-4">
      {config.options.map((option: string, index: number) => (
        <button
          key={index}
          onClick={() => handleAction(index === 0 ? 'A' : 'B')} // 0번은 A, 1번은 B
          className="w-full py-5 md:py-6 bg-gray-900/80 border-2 border-pink-500/50 rounded-2xl font-black text-xl md:text-2xl text-white hover:bg-pink-600 hover:border-pink-600 transition-all active:scale-95 shadow-lg"
        >
          {option}
        </button>
      ))}
    </div>
  );
}