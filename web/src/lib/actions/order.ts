"use server";

import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validations/order";

export type OrderState = { error?: string; orderId?: string };

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "로그인 후 주문할 수 있습니다.",
  EMPTY_CART: "장바구니가 비어 있습니다.",
  OUT_OF_STOCK: "재고가 부족한 상품이 있습니다. 수량을 확인해 주세요.",
  PRODUCT_NOT_FOUND: "판매 중이지 않은 상품이 포함되어 있습니다.",
  INVALID_COUPON: "사용할 수 없는 쿠폰입니다.",
  BAD_QTY: "수량이 올바르지 않습니다.",
};

function mapError(message: string): string {
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (message.includes(key)) return ERROR_MESSAGES[key];
  }
  return "주문에 실패했습니다. 다시 시도해 주세요.";
}

export async function placeOrderAction(
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "장바구니 정보를 읽을 수 없습니다." };
  }

  const parsed = checkoutSchema.safeParse({
    recipient: formData.get("recipient"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    memo: formData.get("memo") || undefined,
    pay_method: formData.get("pay_method"),
    coupon_code: formData.get("coupon_code") || undefined,
    items,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: ERROR_MESSAGES.AUTH_REQUIRED };

  const { data, error } = await supabase.rpc("place_order", {
    p_items: parsed.data.items,
    p_coupon_code: parsed.data.coupon_code ?? null,
    p_recipient: parsed.data.recipient,
    p_phone: parsed.data.phone,
    p_address: parsed.data.address,
    p_memo: parsed.data.memo ?? null,
    p_pay_method: parsed.data.pay_method,
  });

  if (error) {
    return { error: mapError(error.message) };
  }

  return { orderId: data as string };
}
