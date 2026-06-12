import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/lib/types/database";

/**
 * 서버(Server Component / Server Action / Route Handler)용 Supabase 클라이언트.
 * 쿠키 기반 세션을 읽고 갱신한다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component에서 호출되면 set이 불가 — middleware가 세션을 갱신하므로 무시 가능.
        }
      },
    },
  });
}
