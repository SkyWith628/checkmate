/**
 * 테스트 상품 시드 (개발용).
 * 실행: node --env-file=.env.local scripts/seed-products.mjs
 * service_role 키로 RLS 우회.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const products = [
  { name: "Cherry Blossom Pendant", category_slug: "pendant", material: "Rose Gold", price: 89000, sale_price: 69000, stock: 12, description: "벚꽃을 닮은 섬세한 로즈골드 펜던트." },
  { name: "Gold Drop Pendant", category_slug: "pendant", material: "18K Gold", price: 120000, stock: 8, description: "한 방울의 우아함, 골드 드롭 펜던트." },
  { name: "Layered Chain Necklace", category_slug: "pendant", material: "Silver", price: 64000, stock: 20, description: "매일 함께하는 레이어드 체인." },
  { name: "Signet Ring", category_slug: "ring", material: "18K Gold", price: 95000, stock: 15, needs_ring_size: true, allow_engraving: true, description: "각인 가능한 클래식 시그넷 링." },
  { name: "Twist Band Ring", category_slug: "ring", material: "Silver", price: 60000, stock: 18, description: "꼬임 디테일의 미니멀 밴드 링." },
  { name: "Pearl Drop Earring", category_slug: "earring", material: "Freshwater Pearl", price: 75000, stock: 10, description: "클래식한 진주 드롭 이어링." },
  { name: "Oversize Hoop Earring", category_slug: "earring", material: "Gold Plated", price: 55000, stock: 0, is_sold_out: true, description: "존재감 있는 오버사이즈 후프." },
  { name: "Tennis Bracelet", category_slug: "bracelet", material: "Cubic Zirconia", price: 150000, sale_price: 129000, stock: 6, description: "반짝임이 흐르는 테니스 브레이슬렛." },
  { name: "Chain Bracelet", category_slug: "bracelet", material: "Silver", price: 80000, stock: 14, description: "데일리 체인 브레이슬렛." },
];

// PostgREST 일괄 insert는 키 합집합을 컬럼으로 쓰므로, 모든 행의 키를 동일하게 정규화
const normalized = products.map((p) => ({
  sale_price: null,
  description: null,
  is_sold_out: false,
  is_active: true,
  allow_engraving: false,
  needs_ring_size: false,
  gift_wrap: false,
  images: [],
  ...p,
}));

console.log("기존 테스트 상품 정리...");
await sb.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");

console.log("상품 삽입...");
const { data: inserted, error } = await sb.from("products").insert(normalized).select("id,name");
if (error) { console.error("삽입 실패:", error); process.exit(1); }
console.log(`  → ${inserted.length}개 삽입`);

// Signet Ring 에 사이즈 옵션 추가
const signet = inserted.find((p) => p.name === "Signet Ring");
if (signet) {
  const { data: opt, error: oe } = await sb
    .from("product_options")
    .insert({ product_id: signet.id, label: "사이즈", sort_order: 0 })
    .select("id")
    .single();
  if (oe) { console.error("옵션 그룹 실패:", oe); }
  else {
    const values = [
      { option_id: opt.id, name: "11호", stock: 5, sort_order: 0 },
      { option_id: opt.id, name: "13호", stock: 6, sort_order: 1 },
      { option_id: opt.id, name: "15호", stock: 4, sort_order: 2 },
      { option_id: opt.id, name: "17호", stock: 0, sort_order: 3 },
    ];
    const { error: ve } = await sb.from("product_option_values").insert(values);
    console.log(ve ? `옵션값 실패: ${ve.message}` : "  → Signet Ring 사이즈 옵션 4개 추가");
  }
}

const { count } = await sb.from("products").select("*", { count: "exact", head: true });
console.log(`완료. 현재 products 총 ${count}건`);
