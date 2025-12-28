// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// 환경변수가 없으면 에러를 띄워 실수를 방지합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);