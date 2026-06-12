/** 장바구니 (localStorage 'cm_cart') 공통 모듈 — 클라이언트 전용 */

import { useSyncExternalStore } from "react";

export type CartItem = {
  product_id: string;
  option_value_id: string | null;
  name: string;
  option_label: string | null;
  unit_price: number; // 표시용(서버가 최종 확정). 신뢰 대상 아님.
  qty: number;
  image: string | null;
};

const KEY = "cm_cart";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeCart(cart: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("storage"));
}

export function clearCart(): void {
  writeCart([]);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.qty, 0);
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.unit_price * i.qty, 0);
}

/** place_order RPC에 보낼 최소 형태 (가격은 서버가 재확정) */
export function toOrderItems(cart: CartItem[]) {
  return cart.map((i) => ({
    product_id: i.product_id,
    option_value_id: i.option_value_id,
    qty: i.qty,
  }));
}

/* ── useCart: localStorage를 외부 스토어로 구독 ── */
const EMPTY: CartItem[] = [];
let cachedRaw: string | null = null;
let cachedCart: CartItem[] = EMPTY;

function getSnapshot(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(KEY) || "[]";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedCart = JSON.parse(raw);
    } catch {
      cachedCart = EMPTY;
    }
  }
  return cachedCart;
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

/** 장바구니를 구독하는 훅 (useEffect+setState 없이 안전하게 동기화) */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
