import type { Metadata } from "next";
import Link from "next/link";
import { getMyOrders } from "@/lib/queries/account";
import { formatKRW } from "@/lib/format";
import { Reveal } from "@/components/ui/reveal";
import type { OrderStatus } from "@/lib/types/database";

export const metadata: Metadata = { title: "주문 내역" };

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "입금 대기",
  paid: "결제 완료",
  preparing: "상품 준비중",
  shipped: "배송중",
  delivered: "배송 완료",
  cancelled: "취소",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function MyOrdersPage() {
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        주문 내역이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((o, i) => {
        const first = o.order_items[0];
        const more = o.order_items.length - 1;
        return (
          <Reveal key={o.id} delay={i * 70}>
          <Link
            href={`/order/${o.id}`}
            className="block rounded-2xl border border-sand p-5 transition-all duration-300 [transition-timing-function:var(--ease-luxe)] hover:-translate-y-0.5 hover:border-antique-gold hover:shadow-luxe"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{fmtDate(o.created_at)}</span>
              <span className="text-cherry">{STATUS_LABEL[o.status]}</span>
            </div>
            <p className="mt-2 text-[11px] tracking-[0.1em] text-muted-foreground">
              {o.order_no}
            </p>
            <p className="mt-1 font-display text-lg text-dark">
              {first?.product_name}
              {more > 0 && (
                <span className="text-sm text-muted-foreground">
                  {" "}
                  외 {more}건
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-gold">{formatKRW(o.total)}</p>
          </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
