"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatKRW } from "@/lib/format";
import { useCart, writeCart, cartSubtotal } from "@/lib/cart";

export default function CartPage() {
  const router = useRouter();
  const items = useCart();

  function changeQty(idx: number, delta: number) {
    const next = items.map((it, i) =>
      i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it,
    );
    writeCart(next);
  }

  function remove(idx: number) {
    writeCart(items.filter((_, i) => i !== idx));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 px-5 py-28 text-center">
        <h1 className="font-display text-3xl font-light italic text-dark">
          장바구니가 비어 있습니다
        </h1>
        <Link
          href="/collection"
          className="bg-dark px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-cream transition-colors hover:bg-gold hover:text-dark"
        >
          컬렉션 둘러보기
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">
      <h1 className="mb-10 font-display text-3xl font-light italic text-dark">
        Shopping Bag
      </h1>

      <ul className="flex flex-col divide-y divide-sand border-y border-sand">
        {items.map((it, idx) => (
          <li
            key={`${it.product_id}-${it.option_value_id ?? "x"}`}
            className="flex gap-4 py-5"
          >
            <Link
              href={`/product/${it.product_id}`}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden bg-sand"
            >
              {it.image ? (
                <Image
                  src={it.image}
                  alt={it.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center px-1 text-center font-display text-[10px] italic text-muted-foreground">
                  {it.name}
                </span>
              )}
            </Link>

            <div className="flex flex-1 flex-col">
              <Link
                href={`/product/${it.product_id}`}
                className="font-display text-lg text-dark hover:text-cherry"
              >
                {it.name}
              </Link>
              {it.option_label && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {it.option_label}
                </p>
              )}
              <p className="mt-1 text-sm text-gold">{formatKRW(it.unit_price)}</p>

              <div className="mt-auto flex items-center gap-3 pt-2">
                <div className="flex items-center border border-sand">
                  <button
                    type="button"
                    className="h-8 w-8 text-muted-foreground hover:bg-sand"
                    onClick={() => changeQty(idx, -1)}
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm">{it.qty}</span>
                  <button
                    type="button"
                    className="h-8 w-8 text-muted-foreground hover:bg-sand"
                    onClick={() => changeQty(idx, 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-cherry hover:underline"
                  onClick={() => remove(idx)}
                >
                  삭제
                </button>
              </div>
            </div>

            <div className="flex-shrink-0 text-right font-display text-lg text-dark">
              {formatKRW(it.unit_price * it.qty)}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-end gap-4">
        <div className="flex w-full max-w-xs items-baseline justify-between">
          <span className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
            예상 합계
          </span>
          <span className="font-display text-2xl text-dark">
            {formatKRW(subtotal)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          쿠폰 할인은 주문서에서 적용됩니다.
        </p>
        <Button size="lg" className="w-full max-w-xs" onClick={() => router.push("/checkout")}>
          주문하기
        </Button>
      </div>
    </div>
  );
}
