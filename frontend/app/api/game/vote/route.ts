import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  console.log("🚀 [API Start] 투표 API가 호출되었습니다.");

  try {
    const body = await request.json();
    const { ticket_id, round_id, choice } = body;
    console.log(`📡 요청 데이터: ticket=${ticket_id}, round=${round_id}, choice=${choice}`);

    // 1. 라운드 정보 확인
    const { data: round, error: roundError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('id', round_id)
      .single();

    if (roundError || !round) {
      console.error("❌ 라운드 조회 실패:", roundError);
      return NextResponse.json({ status: 'ERROR', message: '라운드 정보 없음' });
    }
    console.log(`✅ 라운드 상태: ${round.status} (정답: ${round.correct_answer})`);

    // 2. 기존 투표 확인
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('choice')
      .eq('ticket_nonce', ticket_id)
      .eq('round_id', round_id)
      .maybeSingle();

    console.log("👀 기존 투표 존재 여부:", existingVote ? "있음" : "없음");

    let finalChoice = choice;
    let shouldSaveVote = true;

    // 3. 로직 처리
    if (round.status === 'CLOSED') {
      if (existingVote) {
        console.log("🔒 닫힌 라운드 + 기존 투표 있음 -> 기존 답 유지");
        finalChoice = existingVote.choice;
        shouldSaveVote = false;
      } else {
        console.log("🔓 닫힌 라운드 + 신규 유저(광고) -> 투표 허용!");
        finalChoice = choice;
        shouldSaveVote = true;
      }
    }

    // 4. DB 저장
    if (shouldSaveVote) {
      console.log("💾 DB에 투표 저장 시도...");
      const { error: saveError } = await supabase.from('user_votes').upsert({
        ticket_nonce: ticket_id,
        round_id: round_id,
        choice: finalChoice
      });

      if (saveError) {
        console.error("❌ 투표 저장 실패 (DB 에러):", saveError);
        // 여기서 에러가 난다면 외래키(ticket_id가 tickets 테이블에 없음) 문제일 가능성이 높음
        return NextResponse.json({ status: 'ERROR', message: 'DB 저장 실패: ' + saveError.message });
      }
      console.log("✅ DB 저장 성공");
    }

    // 5. 채점 및 결과
    const isCorrect = round.correct_answer === finalChoice;
    console.log(`📝 채점 결과: ${isCorrect ? '정답' : '오답'} (제출: ${finalChoice})`);

    if (round.status === 'CLOSED') {
      if (isCorrect) {
        await supabase.from('tickets')
          .update({ current_stage: round.id + 1 })
          .eq('nonce', ticket_id)
          .eq('current_stage', round.id);
      } else {
        await supabase.from('tickets')
          .update({ is_alive: false })
          .eq('nonce', ticket_id);
      }
    }

    return NextResponse.json({
      status: 'SUCCESS',
      is_alive: isCorrect,
      correct_answer: round.status === 'CLOSED' ? round.correct_answer : null
    });

  } catch (error: any) {
    console.error("🔥 서버 내부 치명적 오류:", error);
    return NextResponse.json({ status: 'ERROR', message: '서버 에러: ' + error.message }, { status: 500 });
  }
}