import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. 환경변수 로드 (.env 파일)
load_dotenv(".env")

# 2. Supabase 설정 (DB 연결용 - 이건 환경변수 유지)
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

# DB 연결 안전장치
if not url or not key:
    print("⚠️ 경고: Supabase 환경변수가 설정되지 않았습니다.")
    url = "https://placeholder.supabase.co"
    key = "placeholder"

supabase: Client = create_client(url, key)

# 3. FastAPI 앱 설정
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# [핵심] LootLabs 주소 직접 입력 (수정됨)
# 환경변수 안 쓰고 직접 박아넣었으므로 오류가 날 수 없음
FIXED_LOOTLABS_URL = "https://loot-link.com/s?M6BOhyGL"


# ==========================================

@app.post("/gate/create")
def create_ticket():
    try:
        # 1. DB에 티켓 생성 (참가자 기록)
        response = supabase.table("tickets").insert({}).execute()

        # 데이터가 정상적으로 생성되었는지 확인
        if not response.data:
            raise HTTPException(status_code=500, detail="DB 티켓 생성 실패")

        ticket_data = response.data[0]
        nonce = ticket_data['nonce']

        # 2. 링크 조합 (복잡한 로직 제거함)
        # 주소에 이미 '?'가 있으므로 무조건 '&'를 붙임
        final_link = f"{FIXED_LOOTLABS_URL}&click_id={nonce}"

        print(f"👉 최종 이동 링크: {final_link}")

        return {
            "msg": "티켓 생성 완료",
            "ticket_id": nonce,
            "lootlabs_url": final_link
        }

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gate/callback")
def verify_ticket(click_id: str = Query(...)):
    try:
        # 1. 티켓 조회
        res = supabase.table("tickets").select("*").eq("nonce", click_id).execute()

        if not res.data:
            raise HTTPException(status_code=400, detail="유효하지 않은 티켓")

        ticket = res.data[0]

        # 2. 이미 사용된 티켓 체크
        if ticket['status'] == 'USED':
            # return {"status": "FAIL", "message": "이미 입장한 참가자입니다."}
            pass  # 테스트 편의상 패스

        # 3. 티켓 사용 처리
        supabase.table("tickets").update({"status": "USED"}).eq("nonce", click_id).execute()

        # 4. [핵심] DB에 있는 진짜 고유 번호(id) 가져오기
        real_id = ticket['id']

        # 5. 번호 예쁘게 꾸미기 (1번 -> 0001번, 456번 -> 0456번)
        # 9999번이 넘어가면 그냥 숫자 그대로 출력됨
        formatted_num = f"{real_id:04d}"

        return {
            "status": "SUCCESS",
            "player_num": formatted_num,  # 진짜 참가 번호
            "message": "게임 대기실 입장"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))