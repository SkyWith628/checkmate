import type { Metadata } from "next";
import Link from "next/link";
import { getMyReviews, getReviewableProducts } from "@/lib/queries/account";
import { ReviewForm } from "@/components/shop/review-form";
import { DeleteReviewButton } from "@/components/shop/delete-review-button";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = { title: "리뷰" };

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-antique-gold" aria-label={`${rating}점`}>
      {"★".repeat(rating)}
      <span className="text-sand">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function MyReviewsPage() {
  const [reviewable, myReviews] = await Promise.all([
    getReviewableProducts(),
    getMyReviews(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      {/* 작성 가능 */}
      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          작성 가능한 리뷰 ({reviewable.length})
        </h2>
        {reviewable.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            작성할 수 있는 리뷰가 없습니다. 구매한 상품에 리뷰를 남겨보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviewable.map((p) => (
              <ReviewForm key={p.id} productId={p.id} productName={p.name} />
            ))}
          </div>
        )}
      </section>

      {/* 내가 쓴 리뷰 */}
      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          내가 쓴 리뷰 ({myReviews.length})
        </h2>
        {myReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">작성한 리뷰가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {myReviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 70} as="div" className="rounded-2xl border border-sand p-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={r.product ? `/product/${r.product.id}` : "#"}
                    className="font-display text-base text-dark hover:text-cherry"
                  >
                    {r.product?.name ?? "상품"}
                  </Link>
                  <div className="flex items-center gap-3">
                    {r.is_verified && (
                      <span className="text-[10px] uppercase tracking-[0.1em] text-antique-gold">
                        구매확인
                      </span>
                    )}
                    <DeleteReviewButton reviewId={r.id} />
                  </div>
                </div>
                <div className="mt-1 text-sm">
                  <Stars rating={r.rating} />
                </div>
                {r.content && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {r.content}
                  </p>
                )}
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
