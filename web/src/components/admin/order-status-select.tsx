"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "@/lib/actions/admin";
import type { OrderStatus } from "@/lib/types/database";
import { adminInputSm } from "@/components/admin/ui";

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "결제대기" },
  { value: "paid", label: "결제완료" },
  { value: "preparing", label: "배송준비" },
  { value: "shipped", label: "배송중" },
  { value: "delivered", label: "배송완료" },
  { value: "cancelled", label: "취소" },
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) =>
        start(() =>
          updateOrderStatusAction(orderId, e.target.value as OrderStatus),
        )
      }
      className={adminInputSm}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
