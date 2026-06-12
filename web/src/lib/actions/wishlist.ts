"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WishlistResult = { added?: boolean; error?: string };

/** 찜 토글. 반환 added=true면 추가됨, false면 제거됨. */
export async function toggleWishlistAction(
  productId: string,
): Promise<WishlistResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
    revalidatePath("/mypage/wishlist");
    return { added: false };
  }

  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: user.id, product_id: productId });
  if (error) return { error: "처리에 실패했습니다." };
  revalidatePath("/mypage/wishlist");
  return { added: true };
}

export async function isWishlisted(productId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}
