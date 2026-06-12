"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createReviewAction, type ReviewState } from "@/lib/actions/review";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "등록 중…" : "리뷰 등록"}
    </Button>
  );
}

export function ReviewForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [state, action] = useActionState<ReviewState, FormData>(
    createReviewAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("리뷰가 등록되었습니다.");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 border border-sand p-4"
    >
      <p className="font-display text-base text-dark">{productName}</p>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n}점`}
            className={
              "text-2xl leading-none " +
              (n <= rating ? "text-antique-gold" : "text-sand")
            }
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="content"
        rows={3}
        placeholder="상품은 어떠셨나요? (선택)"
        maxLength={1000}
        className="resize-none border border-sand bg-transparent p-3 text-sm outline-none focus:border-antique-gold"
      />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
