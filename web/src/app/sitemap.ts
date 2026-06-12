import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { CATEGORIES } from "@/lib/constants";
import { getAllProducts } from "@/lib/queries/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/collection`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/grade`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${base}/category/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts();
    productRoutes = products.map((p) => ({
      url: `${base}/product/${p.id}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // DB 미연결 시 정적 경로만
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
