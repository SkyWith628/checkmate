import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type OrderRow = Tables<"orders"> & {
  order_items: Pick<
    Tables<"order_items">,
    "id" | "product_name" | "qty" | "unit_price" | "option_label"
  >[];
};

export async function getProfile() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data ? { ...data, email: user.email ?? "" } : null;
}

export async function getMyOrders(): Promise<OrderRow[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("orders")
    .select(
      "*, order_items(id, product_name, qty, unit_price, option_label)",
    )
    .order("created_at", { ascending: false });
  return (data as unknown as OrderRow[]) ?? [];
}

export type MyCoupon = {
  code: string;
  used_at: string | null;
  collected_at: string;
  coupon: Tables<"coupons"> | null;
};

export async function getMyCoupons(): Promise<MyCoupon[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("user_coupons")
    .select("code, used_at, collected_at, coupons(*)")
    .order("collected_at", { ascending: false });
  return (
    (data as unknown as
      | { code: string; used_at: string | null; collected_at: string; coupons: Tables<"coupons"> | null }[]
      | null) ?? []
  ).map((r) => ({
    code: r.code,
    used_at: r.used_at,
    collected_at: r.collected_at,
    coupon: r.coupons,
  }));
}

export type MyReview = Tables<"reviews"> & {
  product: Pick<Tables<"products">, "id" | "name" | "images"> | null;
};

export async function getMyReviews(): Promise<MyReview[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("reviews")
    .select("*, products(id, name, images)")
    .order("created_at", { ascending: false });
  return (
    (data as unknown as (Tables<"reviews"> & {
      products: Pick<Tables<"products">, "id" | "name" | "images"> | null;
    })[] | null) ?? []
  ).map((r) => ({ ...r, product: r.products }));
}

/** 구매했지만 아직 리뷰 안 쓴 상품 목록 */
export async function getReviewableProducts(): Promise<
  Pick<Tables<"products">, "id" | "name" | "images">[]
> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];

  const { data: orders } = await sb
    .from("orders")
    .select("id")
    .in("status", ["paid", "preparing", "shipped", "delivered"]);
  const orderIds = (orders ?? []).map((o) => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await sb
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds);
  const productIds = [...new Set((items ?? []).map((i) => i.product_id))];
  if (productIds.length === 0) return [];

  const { data: reviewed } = await sb
    .from("reviews")
    .select("product_id")
    .eq("user_id", user.id);
  const reviewedSet = new Set((reviewed ?? []).map((r) => r.product_id));

  const todo = productIds.filter((id) => !reviewedSet.has(id));
  if (todo.length === 0) return [];

  const { data: products } = await sb
    .from("products")
    .select("id, name, images")
    .in("id", todo);
  return products ?? [];
}

export async function getMyWishlist(): Promise<Tables<"products">[]> {
  const sb = await createClient();
  const { data: wl } = await sb.from("wishlists").select("product_id");
  const ids = (wl ?? []).map((w) => w.product_id);
  if (ids.length === 0) return [];
  const { data: products } = await sb
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);
  return products ?? [];
}
