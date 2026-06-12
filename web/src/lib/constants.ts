/** 카테고리 — 추후 DB(categories 테이블)로 이전. 현재는 라우팅/네비용 상수. */
export const CATEGORIES = [
  { slug: "pendant", name: "Pendant", label: "pendant" },
  { slug: "ring", name: "Ring", label: "ring" },
  { slug: "earring", name: "Earring", label: "earring" },
  { slug: "bracelet", name: "Bracelet", label: "bracelet" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const SITE_NAME = "CHECKMATE";
