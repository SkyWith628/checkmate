"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "@/lib/actions/admin";
import type { OrderStatus } from "@/lib/types/database";

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
      className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-foreground disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
