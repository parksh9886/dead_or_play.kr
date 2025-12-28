"use client";
import VoteGame from "./games/VoteGame";
import QuizGame from "./games/QuizGame";

export default function GameRenderer({ roundData, handleGameAction }: any) {
  // DB의 game_type에 따라 다른 컴포넌트를 보여줌
  switch (roundData.game_type) {
    case 'VOTE':
      return <VoteGame config={roundData.config} handleAction={handleGameAction} />;

    case 'QUIZ':
      return <QuizGame config={roundData.config} handleAction={handleGameAction} />;

    // 나중에 'CLICK'(선착순), 'LUCK'(룰렛) 등 여기서 추가하면 됨

    default:
      return <div className="text-red-500">알 수 없는 게임 타입입니다.</div>;
  }
}