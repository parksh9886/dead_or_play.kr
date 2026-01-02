// app/api/game/vote/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ⚠️ 환경변수에 SUPABASE_SERVICE_ROLE_KEY가 꼭 있어야 합니다.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticket_id, round_id, choice } = body;

    // 1. 라운드 정보 가져오기 (정답 확인용)
    const { data: round } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('id', round_id)
      .single();

    if (!round) return NextResponse.json({ status: 'ERROR', message: '라운드 정보 없음' });

    // 2. 이미 투표했는지 확인 (중복 방지 및 기존 투표 검증)
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('choice')
      .eq('ticket_nonce', ticket_id)
      .eq('round_id', round_id)
      .maybeSingle();

    let finalChoice = choice;

    // 라운드가 닫혀있다면, 새로 투표할 수 없고 기존 투표로만 채점해야 함
    if (round.status === 'CLOSED') {
      if (existingVote) {
        finalChoice = existingVote.choice; // 유저가 보낸 값 무시하고 DB 값 사용
      } else {
        // 닫혔는데 투표 기록도 없으면 에러
        return NextResponse.json({ status: 'ERROR', message: '투표 기록이 없습니다.' });
      }
    } else {
      // 진행 중이면 투표 저장/업데이트
      await supabase.from('user_votes').upsert({
        ticket_nonce: ticket_id,
        round_id: round_id,
        choice: finalChoice
      });
    }

    // 3. 정답 채점 (서버에서만 수행)
    const isCorrect = round.correct_answer === finalChoice;

    // 4. 생존 여부 DB 업데이트 (유저는 권한 없음, 서버가 대신 수행)
    if (round.status === 'CLOSED') {
      if (isCorrect) {
        // 정답 -> 다음 스테이지로 레벨업
        // (현재 스테이지가 round.id와 같을 때만 +1 해주는 것이 안전)
        await supabase.from('tickets')
          .update({ current_stage: round.id + 1 })
          .eq('nonce', ticket_id)
          .eq('current_stage', round.id); // 건너뛰기 방지
      } else {
        // 오답 -> 사망 처리
        await supabase.from('tickets')
          .update({ is_alive: false })
          .eq('nonce', ticket_id);
      }
    }

    // 5. 결과 반환 (클라이언트는 이 결과만 믿고 애니메이션 재생)
    return NextResponse.json({
      status: 'SUCCESS',
      is_alive: isCorrect,
      correct_answer: isCorrect ? finalChoice : null // 정답 맞췄을 때만 알려줌 (선택사항)
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ status: 'ERROR', message: '서버 내부 오류' }, { status: 500 });
  }
}