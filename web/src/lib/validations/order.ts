import { z } from "zod";

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  option_value_id: z.string().uuid().nullable(),
  qty: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  recipient: z.string().min(1, "받는 분을 입력하세요.").max(40),
  phone: z
    .string()
    .min(8, "연락처를 정확히 입력하세요.")
    .max(20),
  address: z.string().min(5, "배송지 주소를 입력하세요.").max(200),
  memo: z.string().max(200).optional(),
  pay_method: z.enum(["bank", "card"]),
  coupon_code: z.string().max(40).optional(),
  items: z.array(orderItemSchema).min(1, "장바구니가 비어 있습니다."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
