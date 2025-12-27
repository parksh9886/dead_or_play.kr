import os
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Query
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

# LootLabs 주소
FIXED_LOOTLABS_URL = "https://lootdest.org/s?SW5bOAzX"


# --- [데이터 모델] ---

class UserRegister(BaseModel):
    click_id: str
    password: str
    instagram_id: str


class UserLogin(BaseModel):
    player_num: str
    password: str


# --- [API 정의] ---

@app.post("/gate/create")
def create_ticket():
    try:
        # 1. 티켓 생성 (빈 객체 삽입 -> ID/Nonce 자동생성)
        response = supabase.table("tickets").insert({}).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="DB 티켓 생성 실패")

        ticket_data = response.data[0]

        # [안전장치] nonce가 없으면 에러
        nonce = ticket_data.get('nonce')
        if not nonce:
            raise HTTPException(status_code=500, detail="티켓 번호(nonce) 생성 실패")

        # 2. 링크 생성
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
        # 1. 유효성 검사
        if not click_id or click_id == "{CLICK_ID}" or click_id == "undefined":
            raise HTTPException(status_code=400, detail="티켓 정보가 없습니다.")

        # 2. DB 조회
        res = supabase.table("tickets").select("*").eq("nonce", click_id).execute()

        if not res.data:
            raise HTTPException(status_code=400, detail="유효하지 않은 티켓")

        ticket = res.data[0]

        # 3. 상태 업데이트 (에러 무시)
        try:
            current_status = ticket.get('status')
            if current_status != 'USED':
                supabase.table("tickets").update({"status": "USED"}).eq("nonce", click_id).execute()
        except Exception as e:
            print(f"⚠️ 상태 업데이트 경고: {e}")

        # 4. 참가번호 가져오기 (여기가 에러 원인이었음!)
        # [수정] id가 없으면 0으로 처리해서 에러 방지
        real_id = ticket.get('id', 0)
        formatted_num = f"{real_id:04d}"

        # 5. 비밀번호 유무 확인
        has_password = ticket.get('password') is not None

        return {
            "status": "SUCCESS",
            "player_num": formatted_num,
            "has_password": has_password,
            "message": "입장 성공"
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ 검증 에러: {e}")
        # 에러 메시지를 그대로 보내서 원인 파악 용이하게 함
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gate/register")
def register_user(user: UserRegister):
    try:
        res = supabase.table("tickets").select("*").eq("nonce", user.click_id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="존재하지 않는 사용자입니다.")

        # 이미 비밀번호가 있는지 체크 (안전하게 .get 사용)
        if res.data[0].get('password'):
            return {"status": "FAIL", "message": "이미 등록된 사용자입니다."}

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
        # "0056" -> 56 변환
        try:
            target_id = int(user.player_num)
        except ValueError:
            return {"status": "FAIL", "message": "잘못된 참가번호 형식입니다."}

        # DB 조회
        res = supabase.table("tickets").select("*").eq("id", target_id).execute()

        if not res.data:
            return {"status": "FAIL", "message": "존재하지 않는 참가번호입니다."}

        ticket = res.data[0]

        # 비밀번호 비교 (안전하게 .get 사용)
        db_password = ticket.get('password')
        if not db_password or db_password != user.password:
            return {"status": "FAIL", "message": "비밀번호가 일치하지 않습니다."}

        return {
            "status": "SUCCESS",
            "ticket_id": ticket['nonce'],
            "message": "로그인 성공"
        }

    except Exception as e:
        print(f"로그인 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))