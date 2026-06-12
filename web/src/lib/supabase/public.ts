import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/types/database";

/**
 * 쿠키/세션 없는 공개 읽기용 클라이언트.
 * 카탈로그처럼 정적 생성(SSG/ISR)되는 공개 데이터 조회에 사용.
 * (쿠키 기반 server client를 쓰면 라우트가 동적으로 강제되므로 분리)
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
