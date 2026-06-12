import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/types/database";

export type Product = Tables<"products">;
export type Category = Tables<"categories">;
export type OptionValue = Tables<"product_option_values">;
export type ProductWithOptions = Product & {
  product_options: (Tables<"product_options"> & {
    product_option_values: OptionValue[];
  })[];
};

export async function getCategories(): Promise<Category[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("categories")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

export async function getCategory(slug: string): Promise<Category | null> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export type ProductSort = "newest" | "price_asc" | "price_desc";

export async function getProductsByCategory(
  slug: string,
  sort: ProductSort = "newest",
): Promise<Product[]> {
  const sb = createPublicClient();
  let q = sb
    .from("products")
    .select("*")
    .eq("category_slug", slug)
    .eq("is_active", true);

  if (sort === "price_asc") q = q.order("price", { ascending: true });
  else if (sort === "price_desc") q = q.order("price", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data } = await q;
  return data ?? [];
}

export async function getAllProducts(): Promise<Product[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProductById(
  id: string,
): Promise<ProductWithOptions | null> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("products")
    .select(
      "*, product_options(*, product_option_values(*))",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  return data as ProductWithOptions | null;
}
