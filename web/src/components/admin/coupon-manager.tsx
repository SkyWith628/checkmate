"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  upsertCouponAction,
  deleteCouponAction,
  issueCouponAction,
  type ActionState,
} from "@/lib/actions/admin";
import { formatKRW } from "@/lib/format";
import type { Tables } from "@/lib/types/database";

type Coupon = Tables<"coupons">;

const inputCls =
  "rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground";
const labelCls = "flex flex-col gap-1 text-sm text-muted-foreground";

function Submit({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}

function CouponCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ActionState, FormData>(
    upsertCouponAction,
    {},
  );
  useEffect(() => {
    if (state.ok) {
      toast.success("쿠폰이 저장되었습니다.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid gap-4 rounded-md border border-border p-5 sm:grid-cols-2"
    >
      <h2 className="font-display text-lg sm:col-span-2">쿠폰 생성 / 수정</h2>
      <label className={labelCls}>
        코드 *
        <input name="code" required placeholder="WELCOME10" className={inputCls} />
      </label>
      <label className={labelCls}>
        이름 *
        <input name="label" required placeholder="신규 가입 쿠폰" className={inputCls} />
      </label>
      <label className={labelCls}>
        할인 유형
        <select name="discount_type" defaultValue="amount" className={inputCls}>
          <option value="amount">정액 (원)</option>
          <option value="percent">정률 (%)</option>
        </select>
      </label>
      <label className={labelCls}>
        할인값 *
        <input name="discount_value" type="number" min={0} required className={inputCls} />
      </label>
      <label className={labelCls}>
        최소 주문금액
        <input name="min_order" type="number" min={0} defaultValue={0} className={inputCls} />
      </label>
      <label className="flex items-center gap-2 self-end text-sm text-foreground">
        <input type="checkbox" name="is_active" defaultChecked className="size-4 accent-primary" />
        활성
      </label>
      <div className="sm:col-span-2">
        <Submit>저장</Submit>
      </div>
    </form>
  );
}

function IssueForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ActionState, FormData>(
    issueCouponAction,
    {},
  );
  useEffect(() => {
    if (state.ok) {
      toast.success("쿠폰이 지급되었습니다.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-md border border-border p-5"
    >
      <h2 className="font-display text-lg basis-full">회원에게 쿠폰 지급</h2>
      <label className={labelCls}>
        쿠폰 코드
        <input name="code" required placeholder="WELCOME10" className={inputCls} />
      </label>
      <label className={labelCls}>
        회원 이메일
        <input name="email" type="email" required placeholder="user@example.com" className={inputCls} />
      </label>
      <Submit>지급</Submit>
    </form>
  );
}

function DeleteButton({ code }: { code: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`쿠폰 ${code}을(를) 삭제할까요?`))
          start(() => deleteCouponAction(code));
      }}
      className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      삭제
    </button>
  );
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  return (
    <div className="flex flex-col gap-6">
      <CouponCreateForm />
      <IssueForm />

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">코드</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">할인</th>
              <th className="px-4 py-3 text-right">최소주문</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => (
              <tr key={c.code} className="hover:bg-card/50">
                <td className="px-4 py-3 font-mono text-foreground">{c.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.label}</td>
                <td className="px-4 py-3">
                  {c.discount_type === "percent"
                    ? `${c.discount_value}%`
                    : formatKRW(c.discount_value)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {c.min_order ? formatKRW(c.min_order) : "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "rounded px-2 py-0.5 text-xs " +
                      (c.is_active
                        ? "bg-emerald-900/40 text-emerald-400"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {c.is_active ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton code={c.code} />
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  쿠폰이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
