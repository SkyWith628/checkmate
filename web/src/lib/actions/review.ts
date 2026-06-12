"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; ok?: boolean };

const reviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().max(1000).optional(),
});

export async function createReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    product_id: formData.get("product_id"),
    rating: formData.get("rating"),
    content: formData.get("content") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // is_verified는 트리거가 구매 이력 기준으로 설정
  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.product_id,
    user_id: user.id,
    rating: parsed.data.rating,
    content: parsed.data.content ?? null,
  });

  if (error) {
    if (error.code === "23505") return { error: "이미 리뷰를 작성한 상품입니다." };
    return { error: "리뷰 등록에 실패했습니다." };
  }

  revalidatePath(`/product/${parsed.data.product_id}`);
  revalidatePath("/mypage/reviews");
  return { ok: true };
}

export async function deleteReviewAction(reviewId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("reviews").delete().eq("id", reviewId);
  revalidatePath("/mypage/reviews");
}
