import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = { title: "주문/결제" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone")
    .eq("id", user.id)
    .single();

  return (
    <CheckoutForm
      defaultName={profile?.name ?? ""}
      defaultPhone={profile?.phone ?? ""}
    />
  );
}
