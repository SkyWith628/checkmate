import { getAdminCoupons } from "@/lib/queries/admin";
import { CouponManager } from "@/components/admin/coupon-manager";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Promotions"
        title="쿠폰"
        count={`${coupons.length}개`}
      />
      <CouponManager coupons={coupons} />
    </div>
  );
}
