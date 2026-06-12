import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-light italic text-dark">
          로그인
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Welcome back
        </p>
      </div>

      {error === "oauth" && (
        <p className="text-center text-sm text-destructive">
          소셜 로그인에 실패했습니다. 다시 시도해 주세요.
        </p>
      )}

      <LoginForm next={next} />
    </div>
  );
}
