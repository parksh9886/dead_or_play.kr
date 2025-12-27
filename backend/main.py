import os
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
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

FIXED_LOOTLABS_URL = "https://lootdest.org/s?SW5bOAzX"


# --- 데이터 모델 (깔끔하게 정리됨) ---
class UserRegister(BaseModel):
    click_id: str
    password: str
    instagram_id: str


class UserLogin(BaseModel):
    instagram_id: str  # [핵심] 이제 아이디는 무조건 인스타ID
    password: str


# --- API ---

@app.post("/gate/create")
def create_ticket():
    try:
        # 티켓 생성 (참가번호는 내부적으로만 생성됨)
        response = supabase.table("tickets").insert({}).execute()
        ticket_data = response.data[0]
        nonce = ticket_data['nonce']

        # 광고 링크 생성
        final_link = f"{FIXED_LOOTLABS_URL}&click_id={nonce}"

        return {
            "msg": "티켓 생성 완료",
            "ticket_id": nonce,
            "lootlabs_url": final_link
        }
    except Exception as e:
        print(f"❌ 생성 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gate/callback")
def verify_ticket(click_id: str = Query(None)):
    try:
        # 티켓 유효성 검사
        if not click_id or "{" in click_id or "undefined" in click_id:
            raise HTTPException(status_code=400, detail="티켓 정보가 없습니다.")

        res = supabase.table("tickets").select("*").eq("nonce", click_id).execute()

        if not res.data:
            raise HTTPException(status_code=400, detail="유효하지 않은 티켓")

        ticket = res.data[0]

        # 상태 업데이트 (USED 처리)
        try:
            if ticket.get('status') != 'USED':
                supabase.table("tickets").update({"status": "USED"}).eq("nonce", click_id).execute()
        except:
            pass

        # 프론트엔드에 필요한 정보만 전달
        return {
            "status": "SUCCESS",
            "instagram_id": ticket.get('instagram_id'),  # 없으면 null (회원가입 필요)
            "has_password": ticket.get('password') is not None,
            "player_num": f"{ticket.get('id', 0):04d}",  # 내부는 숫자 유지 (배지용)
            "message": "입장 성공"
        }

    except Exception as e:
        print(f"검증 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gate/register")
def register_user(user: UserRegister):
    try:
        # 1. 인스타 ID 중복 체크 (다른 사람이 이미 쓰는지)
        check = supabase.table("tickets").select("*").eq("instagram_id", user.instagram_id).execute()
        if check.data:
            # 내 티켓이 아닌데 같은 아이디가 있다면?
            if check.data[0]['nonce'] != user.click_id:
                return {"status": "FAIL", "message": "이미 사용 중인 인스타 ID입니다."}

        # 2. 정보 저장
        supabase.table("tickets").update({
            "password": user.password,
            "instagram_id": user.instagram_id
        }).eq("nonce", user.click_id).execute()

        return {"status": "SUCCESS", "message": "등록 완료"}

    except Exception as e:
        print(f"등록 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gate/login")
def login_user(user: UserLogin):
    try:
        # [핵심] 인스타 ID로 유저 찾기
        res = supabase.table("tickets").select("*").eq("instagram_id", user.instagram_id).execute()

        if not res.data:
            return {"status": "FAIL", "message": "존재하지 않는 인스타 ID입니다."}

        ticket = res.data[0]

        # 비밀번호 확인
        if ticket.get('password') != user.password:
            return {"status": "FAIL", "message": "비밀번호가 일치하지 않습니다."}

        return {
            "status": "SUCCESS",
            "ticket_id": ticket['nonce'],  # 로그인 성공 시 티켓 ID 반환
            "message": "로그인 성공"
        }

    except Exception as e:
        print(f"로그인 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))