import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/types/database";

export async function getDashboardStats() {
  const sb = await createClient();

  const [{ data: orders }, { count: productCount }, { count: userCount }, { data: lowStock }] =
    await Promise.all([
      sb.from("orders").select("total, status, created_at"),
      sb.from("products").select("*", { count: "exact", head: true }),
      sb.from("profiles").select("*", { count: "exact", head: true }),
      sb
        .from("products")
        .select("id, name, stock")
        .lte("stock", 5)
        .eq("is_active", true)
        .order("stock"),
    ]);

  const all = orders ?? [];
  const paidStatuses = ["paid", "preparing", "shipped", "delivered"];
  const revenue = all
    .filter((o) => paidStatuses.includes(o.status))
    .reduce((s, o) => s + o.total, 0);
  const pendingCount = all.filter((o) => o.status === "pending").length;

  return {
    revenue,
    orderCount: all.length,
    pendingCount,
    productCount: productCount ?? 0,
    userCount: userCount ?? 0,
    lowStock: lowStock ?? [],
  };
}

export async function getAdminProducts(): Promise<Tables<"products">[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type AdminProductDetail = Tables<"products"> & {
  product_options: (Tables<"product_options"> & {
    product_option_values: Tables<"product_option_values">[];
  })[];
};

export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail | null> {
  const sb = await createClient();
  const { data } = await sb
    .from("products")
    .select("*, product_options(*, product_option_values(*))")
    .eq("id", id)
    .maybeSingle();
  return data as unknown as AdminProductDetail | null;
}

export type AdminOrder = Tables<"orders"> & {
  order_items: Pick<Tables<"order_items">, "product_name" | "qty">[];
};

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("orders")
    .select("*, order_items(product_name, qty)")
    .order("created_at", { ascending: false });
  return (data as unknown as AdminOrder[]) ?? [];
}

export type AdminUser = Tables<"profiles"> & { email: string | null };

export async function getAdminUsers(): Promise<AdminUser[]> {
  const sb = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    sb.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? null]),
  );

  return (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }));
}

export async function getAdminCoupons(): Promise<Tables<"coupons">[]> {
  const sb = await createClient();
  const { data } = await sb.from("coupons").select("*").order("code");
  return data ?? [];
}

export async function getAdminFaqs(): Promise<Tables<"faqs">[]> {
  const sb = await createClient();
  const { data } = await sb.from("faqs").select("*").order("sort_order");
  return data ?? [];
}
