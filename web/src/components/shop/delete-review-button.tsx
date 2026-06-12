"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteReviewAction } from "@/lib/actions/review";

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deleteReviewAction(reviewId);
          toast.success("리뷰를 삭제했습니다.");
        })
      }
      className="text-xs text-muted-foreground underline-offset-2 hover:text-cherry hover:underline disabled:opacity-50"
    >
      삭제
    </button>
  );
}
