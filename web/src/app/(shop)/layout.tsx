import { SiteNav } from "@/components/shop/site-nav";
import { SiteFooter } from "@/components/shop/site-footer";
import { ScrollProgress } from "@/components/shop/scroll-progress";

/**
 * 인증 상태는 SiteNav가 클라이언트에서 조회한다.
 * → 레이아웃이 쿠키를 읽지 않으므로 하위 카탈로그 페이지가 정적/ISR로 유지된다.
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
