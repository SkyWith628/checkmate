import { getAdminCoupons } from "@/lib/queries/admin";
import { CouponManager } from "@/components/admin/coupon-manager";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">쿠폰 ({coupons.length})</h1>
      <CouponManager coupons={coupons} />
    </div>
  );
}
