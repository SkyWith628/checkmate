"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { setTrackingAction, type ActionState } from "@/lib/actions/admin";
import { adminInputSm } from "@/components/admin/ui";

const inputCls = adminInputSm;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-[rgba(201,169,110,0.3)] px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-antique-gold hover:text-foreground disabled:opacity-50"
    >
      {pending ? "등록 중…" : "송장 등록"}
    </button>
  );
}

export function TrackingForm({ orderId }: { orderId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ActionState, FormData>(
    setTrackingAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("송장이 등록되어 배송중으로 변경되었습니다.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="order_id" value={orderId} />
      <input name="carrier" placeholder="택배사" className={inputCls + " w-24"} />
      <input name="tracking_no" placeholder="송장번호" className={inputCls + " w-36"} />
      <Submit />
    </form>
  );
}
