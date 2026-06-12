"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { placeOrderAction, type OrderState } from "@/lib/actions/order";
import { useCart, clearCart, cartSubtotal, toOrderItems } from "@/lib/cart";
import { formatKRW } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui/reveal";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending || disabled}>
      {pending ? "주문 처리 중…" : "결제하기"}
    </Button>
  );
}

export function CheckoutForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const items = useCart();
  const [state, action] = useActionState<OrderState, FormData>(
    placeOrderAction,
    {},
  );

  // 주문 성공 → 장바구니 비우고 완료 페이지로
  useEffect(() => {
    if (state.orderId) {
      clearCart();
      router.push(`/order/${state.orderId}`);
    }
  }, [state.orderId, router]);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const itemsJson = useMemo(
    () => JSON.stringify(toOrderItems(items)),
    [items],
  );

  if (items.length === 0) {
    return (
      <Reveal
        as="div"
        direction="zoom"
        className="flex flex-col items-center gap-6 px-5 py-28 text-center"
      >
        <p className="font-display text-2xl italic text-dark">
          주문할 상품이 없습니다
        </p>
        <Link
          href="/collection"
          className="rounded-full bg-gold-sheen px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-cherry-esp shadow-gold-glow transition-transform duration-300 [transition-timing-function:var(--ease-spring)] hover:-translate-y-0.5"
        >
          컬렉션 둘러보기
        </Link>
      </Reveal>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
          Almost there
        </p>
        <h1 className="mb-10 mt-2 font-display text-3xl font-light italic text-dark md:text-4xl">
          Checkout
        </h1>
      </Reveal>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_320px]">
        {/* 배송/결제 폼 */}
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="items" value={itemsJson} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="recipient">받는 분</Label>
            <Input id="recipient" name="recipient" defaultValue={defaultName} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">연락처</Label>
            <Input id="phone" name="phone" defaultValue={defaultPhone} placeholder="010-0000-0000" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">배송지 주소</Label>
            <Input id="address" name="address" placeholder="도로명 주소 + 상세주소" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memo">배송 메모 (선택)</Label>
            <Input id="memo" name="memo" placeholder="부재 시 문 앞에 놓아주세요" />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">결제 수단</legend>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-sand py-3 text-sm transition-colors has-[:checked]:border-antique-gold has-[:checked]:bg-sand/60">
                <input type="radio" name="pay_method" value="bank" defaultChecked className="accent-cherry" />
                무통장 입금
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-sand py-3 text-sm transition-colors has-[:checked]:border-antique-gold has-[:checked]:bg-sand/60">
                <input type="radio" name="pay_method" value="card" className="accent-cherry" />
                카드 (준비중)
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="coupon_code">쿠폰 코드 (선택)</Label>
            <Input id="coupon_code" name="coupon_code" placeholder="보유한 쿠폰 코드" />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SubmitButton disabled={items.length === 0} />
        </form>

        {/* 주문 요약 */}
        <aside className="shadow-luxe h-fit rounded-2xl border border-sand bg-sand/40 p-6 md:sticky md:top-24">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            주문 요약
          </h2>
          <ul className="flex flex-col gap-3">
            {items.map((it) => (
              <li
                key={`${it.product_id}-${it.option_value_id ?? "x"}`}
                className="flex justify-between gap-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate text-dark">{it.name}</span>
                  {it.option_label && (
                    <span className="text-xs text-muted-foreground">
                      {it.option_label}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground"> × {it.qty}</span>
                </span>
                <span className="flex-shrink-0 text-dark">
                  {formatKRW(it.unit_price * it.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-sand pt-4">
            <span className="text-sm text-muted-foreground">상품 합계</span>
            <span className="font-display text-xl text-dark">
              {formatKRW(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            최종 결제 금액(쿠폰 할인 포함)은 서버에서 확정됩니다.
          </p>
        </aside>
      </div>
    </div>
  );
}
