"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  UserGrade,
  UserRole,
  OrderStatus,
  DiscountType,
} from "@/lib/types/database";

export type ActionState = { error?: string; ok?: boolean };

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ─────────────── 상품 ─────────────── */

export async function upsertProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getAdmin();
  if (!ctx) return { error: "권한이 없습니다." };

  const id = (formData.get("id") as string) || null;
  const name = String(formData.get("name") || "").trim();
  const price = num(formData.get("price"));
  if (!name || price == null) return { error: "상품명과 가격은 필수입니다." };

  const images = String(formData.get("images") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const row = {
    name,
    category_slug: (formData.get("category_slug") as string) || null,
    material: (formData.get("material") as string) || null,
    description: (formData.get("description") as string) || null,
    price,
    sale_price: num(formData.get("sale_price")),
    stock: num(formData.get("stock")) ?? 0,
    images,
    is_active: formData.get("is_active") === "on",
    is_sold_out: formData.get("is_sold_out") === "on",
    allow_engraving: formData.get("allow_engraving") === "on",
    needs_ring_size: formData.get("needs_ring_size") === "on",
    gift_wrap: formData.get("gift_wrap") === "on",
    care_guide: (formData.get("care_guide") as string) || null,
  };

  let savedId = id;
  if (id) {
    const { error } = await ctx.supabase.from("products").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await ctx.supabase
      .from("products")
      .insert(row)
      .select("id")
      .single();
    if (error) return { error: error.message };
    savedId = data.id;
  }

  revalidatePath("/admin/products");
  revalidatePath("/collection");
  if (row.category_slug) revalidatePath(`/category/${row.category_slug}`);
  redirect(`/admin/products/${savedId}`);
}

export async function deleteProductAction(id: string): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductActiveAction(
  id: string,
  next: boolean,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("products").update({ is_active: next }).eq("id", id);
  revalidatePath("/admin/products");
}

/* ─────────────── 옵션 ─────────────── */

export async function addOptionGroupAction(
  productId: string,
  label: string,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase
    .from("product_options")
    .insert({ product_id: productId, label });
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteOptionGroupAction(
  productId: string,
  groupId: string,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("product_options").delete().eq("id", groupId);
  revalidatePath(`/admin/products/${productId}`);
}

export async function addOptionValueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getAdmin();
  if (!ctx) return { error: "권한이 없습니다." };
  const productId = String(formData.get("product_id"));
  const optionId = String(formData.get("option_id"));
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "옵션값 이름을 입력하세요." };
  const { error: insertError } = await ctx.supabase
    .from("product_option_values")
    .insert({
      option_id: optionId,
      name,
      price: num(formData.get("price")),
      stock: num(formData.get("stock")),
    });
  if (insertError) return { error: insertError.message };
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function deleteOptionValueAction(
  productId: string,
  valueId: string,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("product_option_values").delete().eq("id", valueId);
  revalidatePath(`/admin/products/${productId}`);
}

/* ─────────────── 주문 ─────────────── */

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath("/admin/orders");
}

export async function setTrackingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getAdmin();
  if (!ctx) return { error: "권한이 없습니다." };
  const orderId = String(formData.get("order_id"));
  const carrier = String(formData.get("carrier") || "");
  const trackingNo = String(formData.get("tracking_no") || "");
  await ctx.supabase.from("shipments").insert({
    order_id: orderId,
    carrier,
    tracking_no: trackingNo,
    shipped_at: new Date().toISOString(),
  });
  await ctx.supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
  revalidatePath("/admin/orders");
  return { ok: true };
}

/* ─────────────── 회원 ─────────────── */

export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function updateUserGradeAction(
  userId: string,
  grade: UserGrade,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("profiles").update({ grade }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function toggleBanAction(
  userId: string,
  banned: boolean,
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("profiles").update({ is_banned: banned }).eq("id", userId);
  revalidatePath("/admin/users");
}

/* ─────────────── 쿠폰 ─────────────── */

export async function upsertCouponAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getAdmin();
  if (!ctx) return { error: "권한이 없습니다." };
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const label = String(formData.get("label") || "").trim();
  const discountValue = num(formData.get("discount_value"));
  if (!code || !label || discountValue == null)
    return { error: "코드·이름·할인값은 필수입니다." };

  const { error } = await ctx.supabase.from("coupons").upsert({
    code,
    label,
    discount_type: (formData.get("discount_type") as DiscountType) || "amount",
    discount_value: discountValue,
    min_order: num(formData.get("min_order")) ?? 0,
    is_active: formData.get("is_active") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCouponAction(code: string): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("coupons").delete().eq("code", code);
  revalidatePath("/admin/coupons");
}

/** 이메일로 특정 회원에게 쿠폰 지급 (user_coupons는 RLS상 본인만 → service_role 사용) */
export async function issueCouponAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getAdmin();
  if (!ctx) return { error: "권한이 없습니다." };

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!code || !email) return { error: "쿠폰 코드와 이메일을 입력하세요." };

  const admin = createAdminClient();
  // 이메일로 유저 찾기
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const target = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!target) return { error: "해당 이메일의 회원을 찾을 수 없습니다." };

  const { error } = await admin
    .from("user_coupons")
    .upsert({ user_id: target.id, code });
  if (error) return { error: error.message };

  revalidatePath("/admin/coupons");
  return { ok: true };
}

/* ─────────────── FAQ ─────────────── */

export async function upsertFaqAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getAdmin();
  if (!ctx) return { error: "권한이 없습니다." };
  const id = (formData.get("id") as string) || null;
  const question = String(formData.get("question") || "").trim();
  const answer = String(formData.get("answer") || "").trim();
  if (!question || !answer) return { error: "질문과 답변을 입력하세요." };
  const row = {
    question,
    answer,
    sort_order: num(formData.get("sort_order")) ?? 0,
  };
  if (id) await ctx.supabase.from("faqs").update(row).eq("id", id);
  else await ctx.supabase.from("faqs").insert(row);
  revalidatePath("/admin/faqs");
  return { ok: true };
}

export async function deleteFaqAction(id: string): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("faqs").delete().eq("id", id);
  revalidatePath("/admin/faqs");
}
