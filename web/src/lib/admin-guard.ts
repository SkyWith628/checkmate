import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type AdminContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

/**
 * 현재 요청이 관리자면 컨텍스트를 반환, 아니면 null.
 * 페이지는 proxy.ts가 1차 가드하지만, Server Action은 직접 재검증해야 한다.
 */
export async function getAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (data?.role !== "admin") return null;
  return { supabase, userId: user.id };
}
