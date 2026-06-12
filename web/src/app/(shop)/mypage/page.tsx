import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/queries/account";
import { GRADE_LABEL, GRADE_KO, GRADE_EARN_RATE } from "@/lib/grade";
import { formatKRW } from "@/lib/format";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = { title: "내 정보" };

export default async function MypageHome() {
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* 프로필 카드 */}
      <Reveal>
        <section className="shadow-luxe relative overflow-hidden rounded-2xl border border-sand bg-luxe-radial p-6">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-antique-gold/15 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="font-display text-2xl text-dark">
                {profile.name || "회원"}님
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.email}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full border border-antique-gold px-3 py-1 text-xs uppercase tracking-[0.15em] text-antique-gold">
                {GRADE_LABEL[profile.grade]}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                {GRADE_KO[profile.grade]} 등급 · 적립{" "}
                {Math.round(GRADE_EARN_RATE[profile.grade] * 100)}%
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* 적립금 */}
      <Reveal delay={80}>
        <section className="flex items-center justify-between rounded-2xl border border-sand p-6">
          <span className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
            적립금
          </span>
          <span className="text-gold-gradient font-display text-2xl">
            {formatKRW(profile.points_balance)}
          </span>
        </section>
      </Reveal>

      {/* 바로가기 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: "/mypage/orders", label: "주문 내역" },
          { href: "/mypage/reviews", label: "리뷰" },
          { href: "/mypage/coupons", label: "쿠폰" },
          { href: "/mypage/wishlist", label: "찜한 상품" },
        ].map((l, i) => (
          <Reveal key={l.href} delay={160 + i * 80}>
            <Link
              href={l.href}
              className="flex h-20 items-center justify-center rounded-2xl border border-sand text-sm text-muted-foreground transition-all duration-300 [transition-timing-function:var(--ease-luxe)] hover:-translate-y-1 hover:border-antique-gold hover:text-dark hover:shadow-luxe"
            >
              {l.label}
            </Link>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
