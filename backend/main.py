import os
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. 환경변수 로드
load_dotenv(".env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("⚠️ 경고: Supabase 환경변수가 설정되지 않았습니다.")
    url = "https://placeholder.supabase.co"
    key = "placeholder"

supabase: Client = create_client(url, key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LootLabs 주소 (본인 것)
FIXED_LOOTLABS_URL = "https://loot-link.com/s?M6BOhyGL"


# --- [데이터 모델 정의] ---

class UserRegister(BaseModel):
    click_id: str
    password: str
    instagram_id: str  # [추가] 인스타 ID


class UserLogin(BaseModel):  # [추가] 로그인용 모델
    player_num: str  # 예: "0056"
    password: str


# --- [API 정의] ---

@app.post("/gate/create")
def create_ticket(request: Request):
    try:
        # IP 확인
        client_ip = request.headers.get("x-forwarded-for")
        if not client_ip:
            client_ip = request.client.host
        if "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

        print(f"🔎 접속 시도 IP: {client_ip}")

        # 중복 참여 검사
        check_res = supabase.table("tickets").select("*").eq("ip_address", client_ip).execute()

        if check_res.data:
            existing_user = check_res.data[0]
            print(f"🔄 기존 참가자 재접속: {client_ip}")
            return {
                "msg": "기존 참가자",
                "ticket_id": existing_user['nonce'],
                "lootlabs_url": None,
                "is_existing": True
            }

        # 신규 참가자 티켓 생성
        response = supabase.table("tickets").insert({
            "ip_address": client_ip
        }).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="DB 티켓 생성 실패")

        ticket_data = response.data[0]
        nonce = ticket_data['nonce']
        final_link = f"{FIXED_LOOTLABS_URL}&click_id={nonce}"

        return {
            "msg": "티켓 생성 완료",
            "ticket_id": nonce,
            "lootlabs_url": final_link,
            "is_existing": False
        }

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gate/callback")
def verify_ticket(click_id: str = Query(...)):
    try:
        res = supabase.table("tickets").select("*").eq("nonce", click_id).execute()

        if not res.data:
            raise HTTPException(status_code=400, detail="유효하지 않은 티켓")

        ticket = res.data[0]

        # 상태 업데이트 (USED)
        supabase.table("tickets").update({"status": "USED"}).eq("nonce", click_id).execute()

        real_id = ticket['id']
        formatted_num = f"{real_id:04d}"

        # 비밀번호 설정 여부 확인
        has_password = ticket.get('password') is not None

        return {
            "status": "SUCCESS",
            "player_num": formatted_num,
            "has_password": has_password,
            "message": "게임 대기실 입장"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gate/register")
def register_user(user: UserRegister):
    try:
        # 티켓 확인
        res = supabase.table("tickets").select("*").eq("nonce", user.click_id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="존재하지 않는 사용자입니다.")

        # 이미 등록된 경우
        if res.data[0].get('password'):
            return {"status": "FAIL", "message": "이미 등록된 사용자입니다."}

        # [수정] 비밀번호 + 인스타ID 함께 저장
        supabase.table("tickets").update({
            "password": user.password,
            "instagram_id": user.instagram_id
        }).eq("nonce", user.click_id).execute()

        return {"status": "SUCCESS", "message": "등록 완료"}

    except Exception as e:
        print(f"등록 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# [신규] 로그인 API
@app.post("/gate/login")
def login_user(user: UserLogin):
    try:
        # 1. 입력받은 "0056"을 숫자 56으로 변환
        try:
            target_id = int(user.player_num)
        except ValueError:
            return {"status": "FAIL", "message": "잘못된 참가번호 형식입니다."}

        # 2. DB에서 해당 ID 조회
        res = supabase.table("tickets").select("*").eq("id", target_id).execute()

        if not res.data:
            return {"status": "FAIL", "message": "존재하지 않는 참가번호입니다."}

        ticket = res.data[0]

        # 3. 비밀번호 검증
        if ticket['password'] != user.password:
            return {"status": "FAIL", "message": "비밀번호가 일치하지 않습니다."}

        # 4. 성공 시 티켓 ID(nonce) 반환 -> 프론트가 이걸로 이동함
        return {
            "status": "SUCCESS",
            "ticket_id": ticket['nonce'],
            "message": "로그인 성공"
        }

    except Exception as e:
        print(f"로그인 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))