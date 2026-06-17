"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addOptionGroupAction,
  deleteOptionGroupAction,
  addOptionValueAction,
  deleteOptionValueAction,
  type ActionState,
} from "@/lib/actions/admin";
import { formatKRW } from "@/lib/format";
import type { AdminProductDetail } from "@/lib/queries/admin";
import { panelClass, adminInputSm } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const inputCls = adminInputSm;

function AddGroup({ productId }: { productId: string }) {
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="새 옵션 그룹 (예: 컬러)"
        className={inputCls}
      />
      <button
        type="button"
        disabled={pending || !label.trim()}
        onClick={() =>
          start(async () => {
            await addOptionGroupAction(productId, label.trim());
            setLabel("");
          })
        }
        className="rounded-full bg-antique-gold px-4 py-1.5 text-sm font-medium text-dark transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        그룹 추가
      </button>
    </div>
  );
}

function AddValue({
  productId,
  optionId,
}: {
  productId: string;
  optionId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ActionState, FormData>(
    addOptionValueAction,
    {},
  );
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="option_id" value={optionId} />
      <input name="name" placeholder="값 (예: 골드)" className={inputCls} />
      <input name="price" type="number" placeholder="가격(선택)" className={inputCls + " w-28"} />
      <input name="stock" type="number" placeholder="재고(선택)" className={inputCls + " w-24"} />
      <button
        type="submit"
        className="rounded-full border border-[rgba(201,169,110,0.3)] px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-antique-gold hover:text-foreground"
      >
        값 추가
      </button>
    </form>
  );
}

export function OptionsManager({ product }: { product: AdminProductDetail }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {product.product_options.length === 0 && (
        <p className="text-sm text-muted-foreground">
          옵션이 없습니다. 단일 재고로 판매됩니다.
        </p>
      )}

      {product.product_options.map((group) => (
        <div key={group.id} className={cn(panelClass, "p-5")}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{group.label}</h3>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(() => deleteOptionGroupAction(product.id, group.id))
              }
              className="text-xs text-destructive hover:underline"
            >
              그룹 삭제
            </button>
          </div>

          <ul className="mb-3 flex flex-col gap-1">
            {group.product_option_values.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-lg bg-[rgba(201,169,110,0.06)] px-3 py-2 text-sm"
              >
                <span className="text-foreground">
                  {v.name}
                  {v.price != null && (
                    <span className="ml-2 text-muted-foreground">
                      {formatKRW(v.price)}
                    </span>
                  )}
                  {v.stock != null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      재고 {v.stock}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(() => deleteOptionValueAction(product.id, v.id))
                  }
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>

          <AddValue productId={product.id} optionId={group.id} />
        </div>
      ))}

      <AddGroup productId={product.id} />
    </div>
  );
}
