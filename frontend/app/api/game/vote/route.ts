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

    // 1. 라운드 정보 가져오기
    const { data: round } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('id', round_id)
      .single();

    if (!round) return NextResponse.json({ status: 'ERROR', message: '라운드 정보 없음' });

    // 2. 이미 투표했는지 확인
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('choice')
      .eq('ticket_nonce', ticket_id)
      .eq('round_id', round_id)
      .maybeSingle();

    let finalChoice = choice;
    let shouldSaveVote = true; // DB에 저장할지 여부

    // 🔥 [수정된 로직] 라운드가 닫혀있을 때의 처리
    if (round.status === 'CLOSED') {
      if (existingVote) {
        // A. 이미 투표했던 사람 -> 절대 수정 불가, 기존 선택지 사용
        finalChoice = existingVote.choice;
        shouldSaveVote = false; // 이미 있으니 저장 안 함
      } else {
        // B. 투표 기록 없는 사람 -> "광고 보고 온 유저" (지각생) -> 투표 허용!
        finalChoice = choice;
        shouldSaveVote = true; // 신규 저장
      }
    }

    // 3. 투표 내용 DB 저장 (진행 중이거나, 지각생인 경우)
    if (shouldSaveVote) {
      const { error } = await supabase.from('user_votes').upsert({
        ticket_nonce: ticket_id,
        round_id: round_id,
        choice: finalChoice
      });

      if (error) {
        console.error("Vote Save Error:", error);
        return NextResponse.json({ status: 'ERROR', message: '투표 저장 실패' });
      }
    }

    // 4. 정답 채점 (서버 확인)
    const isCorrect = round.correct_answer === finalChoice;

    // 5. 생존 여부 업데이트 (라운드가 CLOSED일 때만 즉시 처리)
    // (ACTIVE일 때는 보통 결과 발표 때 일괄 처리하지만, 기획에 따라 여기서 미리 해도 됨)
    if (round.status === 'CLOSED') {
      if (isCorrect) {
        // 정답: 다음 단계로 이동
        await supabase.from('tickets')
          .update({ current_stage: round.id + 1 })
          .eq('nonce', ticket_id)
          .eq('current_stage', round.id); // 현재 단계일 때만 업그레이드 (중복 방지)
      } else {
        // 오답: 사망 처리
        await supabase.from('tickets')
          .update({ is_alive: false })
          .eq('nonce', ticket_id);
      }
    }

    // 6. 결과 반환
    return NextResponse.json({
      status: 'SUCCESS',
      is_alive: isCorrect,
      // 라운드가 끝났거나 지각생이면 정답을 알려줘서 결과를 바로 보여줌
      correct_answer: round.status === 'CLOSED' ? round.correct_answer : null
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ status: 'ERROR', message: '서버 내부 오류' }, { status: 500 });
  }
}