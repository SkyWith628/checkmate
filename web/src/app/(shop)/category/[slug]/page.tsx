import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { getCategory, getProductsByCategory } from "@/lib/queries/catalog";
import { CategoryGrid } from "@/components/shop/category-grid";
import { Reveal } from "@/components/ui/reveal";

export const revalidate = 60; // ISR

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "카테고리" };
  return {
    title: `${category.name} 컬렉션`,
    description: category.description ?? `${category.name} 컬렉션`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(slug, "newest");

  return (
    <div className="px-5 py-12 md:px-[60px] md:py-20">
      <Reveal>
        <header className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
            Collection
          </p>
          <h1 className="mt-3 font-display text-4xl font-light italic text-dark md:text-5xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </header>
      </Reveal>

      <CategoryGrid products={products} />
    </div>
  );
}
