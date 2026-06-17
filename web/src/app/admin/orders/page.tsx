import { getAdminOrders } from "@/lib/queries/admin";
import { formatKRW } from "@/lib/format";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { TrackingForm } from "@/components/admin/tracking-form";
import { PageHeader, Panel, tableHead, tableRow } from "@/components/admin/ui";

function summarizeItems(items: { product_name: string; qty: number }[]) {
  if (items.length === 0) return "-";
  const first = `${items[0].product_name} ×${items[0].qty}`;
  return items.length > 1 ? `${first} 외 ${items.length - 1}건` : first;
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Orders" title="주문" count={`${orders.length}건`} />

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={tableHead}>
            <tr>
              <th className="px-5 py-3.5">주문일</th>
              <th className="px-5 py-3.5">주문자</th>
              <th className="px-5 py-3.5">상품</th>
              <th className="px-5 py-3.5 text-right">결제금액</th>
              <th className="px-5 py-3.5">상태</th>
              <th className="px-5 py-3.5">송장</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className={tableRow}>
                <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-foreground">{o.recipient}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {summarizeItems(o.order_items)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  {formatKRW(o.total)}
                  {o.discount > 0 && (
                    <div className="text-xs text-cherry-light">
                      -{formatKRW(o.discount)}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                </td>
                <td className="px-5 py-3.5">
                  <TrackingForm orderId={o.id} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  주문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
