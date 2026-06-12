"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  upsertProductAction,
  deleteProductAction,
  type ActionState,
} from "@/lib/actions/admin";
import type { Tables } from "@/lib/types/database";

type Product = Tables<"products">;
type Category = Tables<"categories">;

const inputCls =
  "w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground";
const labelCls = "flex flex-col gap-1 text-sm text-muted-foreground";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
    >
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}

export function ProductForm({
  product,
  categories,
}: {
  product: Product | null;
  categories: Category[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    upsertProductAction,
    {},
  );
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-5">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls + " sm:col-span-2"}>
          상품명 *
          <input
            name="name"
            required
            defaultValue={product?.name ?? ""}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          카테고리
          <select
            name="category_slug"
            defaultValue={product?.category_slug ?? ""}
            className={inputCls}
          >
            <option value="">선택 안 함</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          소재
          <input
            name="material"
            defaultValue={product?.material ?? ""}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          가격 (원) *
          <input
            name="price"
            type="number"
            min={0}
            required
            defaultValue={product?.price ?? ""}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          할인가 (원)
          <input
            name="sale_price"
            type="number"
            min={0}
            defaultValue={product?.sale_price ?? ""}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          재고
          <input
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
            className={inputCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        설명
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className={inputCls + " resize-none"}
        />
      </label>

      <label className={labelCls}>
        이미지 URL (한 줄에 하나)
        <textarea
          name="images"
          rows={3}
          defaultValue={(product?.images ?? []).join("\n")}
          placeholder="https://…"
          className={inputCls + " resize-none font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        케어 가이드
        <textarea
          name="care_guide"
          rows={2}
          defaultValue={product?.care_guide ?? ""}
          className={inputCls + " resize-none"}
        />
      </label>

      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded border border-border p-4">
        <Check name="is_active" label="판매중" defaultChecked={product?.is_active ?? true} />
        <Check name="is_sold_out" label="품절" defaultChecked={product?.is_sold_out ?? false} />
        <Check name="allow_engraving" label="각인 가능" defaultChecked={product?.allow_engraving ?? false} />
        <Check name="needs_ring_size" label="반지 사이즈 필요" defaultChecked={product?.needs_ring_size ?? false} />
        <Check name="gift_wrap" label="선물 포장" defaultChecked={product?.gift_wrap ?? false} />
      </div>

      <div className="flex items-center justify-between">
        <Submit />
        {product && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (confirm("정말 삭제하시겠습니까?"))
                startDelete(() => deleteProductAction(product.id));
            }}
            className="text-sm text-destructive hover:underline disabled:opacity-50"
          >
            {deleting ? "삭제 중…" : "상품 삭제"}
          </button>
        )}
      </div>
    </form>
  );
}
