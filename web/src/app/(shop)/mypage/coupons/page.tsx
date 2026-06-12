import type { Metadata } from "next";
import { getMyCoupons } from "@/lib/queries/account";
import { formatKRW } from "@/lib/format";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = { title: "쿠폰" };

function discountText(c: {
  discount_type: "amount" | "percent";
  discount_value: number;
}) {
  return c.discount_type === "amount"
    ? `${formatKRW(c.discount_value)} 할인`
    : `${c.discount_value}% 할인`;
}

export default async function MyCouponsPage() {
  const coupons = await getMyCoupons();
  const usable = coupons.filter(
    (c) => !c.used_at && c.coupon && c.coupon.is_active,
  );
  const others = coupons.filter((c) => c.used_at || !c.coupon?.is_active);

  if (coupons.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        보유한 쿠폰이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          사용 가능 ({usable.length})
        </h2>
        <div className="flex flex-col gap-3">
          {usable.length === 0 && (
            <p className="text-sm text-muted-foreground">
              사용 가능한 쿠폰이 없습니다.
            </p>
          )}
          {usable.map((c, i) => (
            <Reveal key={c.code} delay={i * 70}>
              <div className="shadow-luxe relative flex items-center justify-between overflow-hidden rounded-2xl border border-antique-gold/50 bg-sand/50 p-4">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-antique-gold/20 blur-2xl" />
                <div className="relative">
                  <p className="font-display text-lg text-dark">
                    {c.coupon!.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    코드 {c.code}
                    {c.coupon!.min_order > 0 &&
                      ` · ${formatKRW(c.coupon!.min_order)} 이상`}
                  </p>
                </div>
                <span className="relative font-display text-lg text-cherry">
                  {discountText(c.coupon!)}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            사용 완료 / 만료
          </h2>
          <div className="flex flex-col gap-2 opacity-50">
            {others.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between rounded-xl border border-sand p-3 text-sm"
              >
                <span>{c.coupon?.label ?? c.code}</span>
                <span>{c.used_at ? "사용 완료" : "만료"}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
