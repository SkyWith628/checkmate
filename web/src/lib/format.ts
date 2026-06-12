/** 원화 포맷: 69000 → "69,000원" */
export function formatKRW(n: number | null | undefined): string {
  if (n == null) return "";
  return n.toLocaleString("ko-KR") + "원";
}

/** 세일/기본가에서 실제 판매가 반환 */
export function effectivePrice(p: {
  price: number;
  sale_price: number | null;
}): number {
  return p.sale_price ?? p.price;
}
