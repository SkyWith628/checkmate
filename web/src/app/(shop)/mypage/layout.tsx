import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MypageNav } from "@/components/shop/mypage-nav";

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
      <h1 className="mb-8 font-display text-3xl font-light italic text-dark">
        My Page
      </h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
        <MypageNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
