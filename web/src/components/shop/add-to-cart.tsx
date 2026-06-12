"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatKRW, effectivePrice } from "@/lib/format";
import { readCart, writeCart, type CartItem } from "@/lib/cart";
import type { ProductWithOptions } from "@/lib/queries/catalog";

export function AddToCart({ product }: { product: ProductWithOptions }) {
  const router = useRouter();
  const groups = product.product_options ?? [];
  const hasOptions = groups.length > 0;

  // 그룹별 선택된 옵션값 id
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  // 선택된 옵션값(첫 그룹 기준 단순화)
  const selectedValue = (() => {
    for (const g of groups) {
      const vid = selected[g.id];
      const v = g.product_option_values.find((x) => x.id === vid);
      if (v) return v;
    }
    return null;
  })();

  const unitPrice =
    selectedValue?.price && selectedValue.price > 0
      ? selectedValue.price
      : effectivePrice(product);

  const stock = selectedValue
    ? (selectedValue.stock ?? product.stock)
    : product.stock;
  const soldOut = product.is_sold_out || stock <= 0;

  function addToCart() {
    if (hasOptions && !selectedValue) {
      toast.error("옵션을 선택해 주세요.");
      return;
    }
    if (soldOut) {
      toast.error("품절된 상품입니다.");
      return;
    }
    const item: CartItem = {
      product_id: product.id,
      option_value_id: selectedValue?.id ?? null,
      name: product.name,
      option_label: selectedValue
        ? `${groups.find((g) => g.product_option_values.some((v) => v.id === selectedValue.id))?.label ?? "옵션"} / ${selectedValue.name}`
        : null,
      unit_price: unitPrice,
      qty,
      image: product.images?.[0] ?? null,
    };

    try {
      const cart = readCart();
      const idx = cart.findIndex(
        (c) =>
          c.product_id === item.product_id &&
          c.option_value_id === item.option_value_id,
      );
      if (idx >= 0) cart[idx].qty += qty;
      else cart.push(item);
      writeCart(cart);
      toast.success("장바구니에 담았습니다.", {
        action: { label: "장바구니", onClick: () => router.push("/cart") },
      });
    } catch {
      toast.error("장바구니 담기에 실패했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 옵션 선택 */}
      {groups.map((g) => (
        <div key={g.id} className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {g.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {g.product_option_values
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((v) => {
                const vSold = (v.stock ?? 1) <= 0;
                const active = selected[g.id] === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={vSold}
                    onClick={() =>
                      setSelected((s) => ({ ...s, [g.id]: v.id }))
                    }
                    className={
                      "border px-4 py-2 text-sm transition-colors " +
                      (vSold
                        ? "cursor-not-allowed border-sand text-muted-foreground line-through"
                        : active
                          ? "border-dark text-dark"
                          : "border-sand text-muted-foreground hover:border-dark")
                    }
                  >
                    {v.name}
                    {v.price && v.price > 0
                      ? ` (${formatKRW(v.price)})`
                      : ""}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {/* 수량 */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          수량
        </span>
        <div className="flex items-center border border-sand">
          <button
            type="button"
            className="h-9 w-9 text-muted-foreground hover:bg-sand"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-12 text-center text-sm">{qty}</span>
          <button
            type="button"
            className="h-9 w-9 text-muted-foreground hover:bg-sand"
            onClick={() => setQty((q) => q + 1)}
          >
            +
          </button>
        </div>
      </div>

      {/* 합계 + 버튼 */}
      <div className="flex items-center justify-between border-t border-sand pt-4">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          합계
        </span>
        <span className="font-display text-2xl text-dark">
          {formatKRW(unitPrice * qty)}
        </span>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={soldOut}
        onClick={addToCart}
      >
        {soldOut ? "품절" : "장바구니 담기"}
      </Button>
    </div>
  );
}
