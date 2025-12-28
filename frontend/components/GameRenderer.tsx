"use client";
import VoteGame from "./games/VoteGame";
import QuizGame from "./games/QuizGame";

// 🔥 myVote 추가됨
export default function GameRenderer({ roundData, handleGameAction, myVote }: any) {
  switch (roundData.game_type) {
    case 'VOTE':
      return <VoteGame config={roundData.config} handleAction={handleGameAction} myVote={myVote} />;
    case 'QUIZ':
      return <QuizGame config={roundData.config} handleAction={handleGameAction} myVote={myVote} />;
    default:
      return <div className="text-red-500">알 수 없는 게임 타입입니다.</div>;
  }
}