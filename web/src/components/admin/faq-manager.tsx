"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  upsertFaqAction,
  deleteFaqAction,
  type ActionState,
} from "@/lib/actions/admin";
import type { Tables } from "@/lib/types/database";
import {
  panelClass,
  adminInput,
  adminBtnPrimary,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Faq = Tables<"faqs">;

const inputCls = cn(adminInput, "w-full");

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={adminBtnPrimary}>
      {pending ? "추가 중…" : "FAQ 추가"}
    </button>
  );
}

function AddForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ActionState, FormData>(
    upsertFaqAction,
    {},
  );
  useEffect(() => {
    if (state.ok) {
      toast.success("FAQ가 추가되었습니다.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className={cn(panelClass, "flex flex-col gap-3 p-6")}
    >
      <h2 className="font-display text-xl">새 FAQ</h2>
      <input name="question" required placeholder="질문" className={inputCls} />
      <textarea name="answer" required rows={3} placeholder="답변" className={inputCls + " resize-none"} />
      <div className="flex items-center gap-3">
        <input
          name="sort_order"
          type="number"
          defaultValue={0}
          className={inputCls + " w-28"}
          aria-label="정렬 순서"
        />
        <Submit />
      </div>
    </form>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("이 FAQ를 삭제할까요?")) start(() => deleteFaqAction(id));
      }}
      className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      삭제
    </button>
  );
}

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="flex flex-col gap-6">
      <AddForm />

      <ul className="flex flex-col gap-3">
        {faqs.map((f) => (
          <li
            key={f.id}
            className={cn(
              panelClass,
              "flex items-start justify-between gap-4 p-5",
            )}
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                <span className="mr-2 text-xs text-antique-gold/70">
                  #{f.sort_order}
                </span>
                {f.question}
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {f.answer}
              </p>
            </div>
            <DeleteButton id={f.id} />
          </li>
        ))}
        {faqs.length === 0 && (
          <li
            className={cn(
              panelClass,
              "px-5 py-12 text-center text-muted-foreground",
            )}
          >
            등록된 FAQ가 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}
