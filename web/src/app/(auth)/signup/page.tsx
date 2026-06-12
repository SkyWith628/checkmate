import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "회원가입" };

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-light italic text-dark">
          회원가입
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Join CHECKMATE
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
