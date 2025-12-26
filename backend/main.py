import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
lootlabs_base = os.environ.get("LOOTLABS_LINK")

# Supabase 연결
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


@app.post("/gate/create")
def create_ticket():
    try:
        # 1. 티켓 생성
        response = supabase.table("tickets").insert({}).execute()
        nonce = response.data[0]['nonce']

        # ==========================================
        # [개발 모드] LootLabs 차단 방지용 코드
        # 개발할 때는 네이버로 테스트하고, 나중에 배포할 때 이 줄만 지우세요!
        # base_link = "https://www.naver.com"
        # ==========================================

        # 2. 링크 조합 (시간 코드 제거함!)
        base_link = lootlabs_base if lootlabs_base else "https://google.com"

        if "?" in base_link:
            separator = "&"
        else:
            separator = "?"

        final_link = f"{base_link}{separator}click_id={nonce}"

        print(f"👉 생성된 링크: {final_link}")

        return {
            "msg": "티켓 생성 완료",
            "ticket_id": nonce,
            "lootlabs_url": final_link
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gate/callback")
def verify_ticket(click_id: str = Query(...)):
    try:
        res = supabase.table("tickets").select("*").eq("nonce", click_id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="유효하지 않은 티켓")

        if res.data[0]['status'] == 'USED':
            return {"status": "FAIL", "message": "이미 사용된 입장권입니다."}

        supabase.table("tickets").update({"status": "USED"}).eq("nonce", click_id).execute()

        return {"status": "SUCCESS", "message": "입장 성공!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))