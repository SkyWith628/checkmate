import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { getServiceRoleKey } from "@/lib/env";
import type { Database } from "@/lib/types/database";

/**
 * service_role 권한 클라이언트. RLS를 우회하므로 **서버에서만**,
 * 신뢰된 관리/마이그레이션 작업에만 사용한다. 절대 클라이언트로 노출 금지.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
