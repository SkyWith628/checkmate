import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MypageNav } from "@/components/shop/mypage-nav";
import { Reveal } from "@/components/ui/reveal";

export default async function MypageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage");

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:py-16">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
          Account
        </p>
        <h1 className="mb-8 mt-2 font-display text-3xl font-light italic text-dark md:text-4xl">
          My Page
        </h1>
      </Reveal>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
        <MypageNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
