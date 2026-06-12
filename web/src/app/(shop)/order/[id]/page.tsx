import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/format";
import type { OrderStatus, Tables } from "@/lib/types/database";

type OrderWithItems = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
};

export const metadata: Metadata = { title: "주문 완료" };

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "주문 접수 (입금 대기)",
  paid: "결제 완료",
  preparing: "상품 준비중",
  shipped: "배송중",
  delivered: "배송 완료",
  cancelled: "주문 취소",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/order/${id}`);

  // RLS: 본인 주문만 조회 가능
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  const order = data as unknown as OrderWithItems | null;
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:py-20">
      <div className="mb-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
          Order Complete ✦
        </p>
        <h1 className="mt-3 font-display text-3xl font-light italic text-dark">
          주문이 완료되었습니다
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          주문번호 <span className="text-dark">{order.order_no}</span>
        </p>
      </div>

      <div className="border border-sand">
        <div className="flex items-center justify-between border-b border-sand px-5 py-3">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            상태
          </span>
          <span className="text-sm text-cherry">
            {STATUS_LABEL[order.status]}
          </span>
        </div>

        <ul className="divide-y divide-sand">
          {order.order_items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 px-5 py-4">
              <span className="min-w-0">
                <span className="block truncate font-display text-base text-dark">
                  {it.product_name}
                </span>
                {it.option_label && (
                  <span className="text-xs text-muted-foreground">
                    {it.option_label}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {" "}
                  {formatKRW(it.unit_price)} × {it.qty}
                </span>
              </span>
              <span className="flex-shrink-0 text-sm text-dark">
                {formatKRW(it.unit_price * it.qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1.5 border-t border-sand px-5 py-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>상품 합계</span>
            <span>{formatKRW(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-cherry">
              <span>쿠폰 할인</span>
              <span>−{formatKRW(order.discount)}</span>
            </div>
          )}
          <div className="mt-2 flex items-baseline justify-between border-t border-sand pt-3">
            <span className="font-medium text-dark">최종 결제 금액</span>
            <span className="font-display text-2xl text-dark">
              {formatKRW(order.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-sand px-5 py-4 text-sm text-muted-foreground">
        <p>
          <span className="text-dark">{order.recipient}</span> · {order.phone}
        </p>
        <p className="mt-1">{order.address}</p>
        {order.memo && <p className="mt-1 text-xs">메모: {order.memo}</p>}
        {order.pay_method === "bank" && (
          <p className="mt-3 text-xs leading-relaxed text-cherry">
            무통장 입금 안내: 입금 확인 후 상품이 준비됩니다.
          </p>
        )}
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          href="/collection"
          className="bg-dark px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-cream transition-colors hover:bg-gold hover:text-dark"
        >
          쇼핑 계속하기
        </Link>
        <Link
          href="/mypage/orders"
          className="border border-dark px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-dark transition-colors hover:bg-dark hover:text-cream"
        >
          주문 내역
        </Link>
      </div>
    </div>
  );
}
