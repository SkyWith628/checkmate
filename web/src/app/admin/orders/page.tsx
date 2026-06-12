import { getAdminOrders } from "@/lib/queries/admin";
import { formatKRW } from "@/lib/format";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { TrackingForm } from "@/components/admin/tracking-form";

function summarizeItems(items: { product_name: string; qty: number }[]) {
  if (items.length === 0) return "-";
  const first = `${items[0].product_name} ×${items[0].qty}`;
  return items.length > 1 ? `${first} 외 ${items.length - 1}건` : first;
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">주문 ({orders.length})</h1>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">주문일</th>
              <th className="px-4 py-3">주문자</th>
              <th className="px-4 py-3">상품</th>
              <th className="px-4 py-3 text-right">결제금액</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">송장</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="align-top hover:bg-card/50">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{o.recipient}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {summarizeItems(o.order_items)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {formatKRW(o.total)}
                  {o.discount > 0 && (
                    <div className="text-xs text-cherry">
                      -{formatKRW(o.discount)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <TrackingForm orderId={o.id} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  주문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
