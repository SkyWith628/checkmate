/**
 * Firestore → Supabase 마이그레이션 스크립트
 *
 * 사전 준비:
 *   1. Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
 *      → 파일을 scripts/firebase-service-account.json 으로 저장 (gitignore됨)
 *   2. .env.local 에 SUPABASE_SERVICE_ROLE_KEY 설정
 *
 * 실행:
 *   node --env-file=.env.local scripts/migrate-firestore.mjs
 *
 * 마이그레이션 대상:
 *   Firestore                     → Supabase
 *   ─────────────────────────────────────────
 *   products (컬렉션)             → products 테이블
 *   products/{id}/reviews         → reviews 테이블
 *   products/_coupons (문서)      → coupons 테이블
 *   users (컬렉션)                → profiles 테이블 (auth.users는 수동)
 *   orders (컬렉션)               → orders + order_items 테이블
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── Firebase Admin 초기화 ────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  readFileSync(new URL("./firebase-service-account.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Supabase Admin 초기화 ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function toISO(val) {
  if (!val) return new Date().toISOString();
  if (val.toDate) return val.toDate().toISOString(); // Firestore Timestamp
  return new Date(val).toISOString();
}

// ── 1. 상품 마이그레이션 ──────────────────────────────────────────────────────
async function migrateProducts() {
  log("▶ 상품 마이그레이션 시작");
  const snap = await db.collection("products").get();
  const docs = snap.docs.filter((d) => d.id !== "_coupons");

  let ok = 0;
  for (const doc of docs) {
    const d = doc.data();
    const row = {
      id: doc.id,
      name: d.name ?? "이름 없음",
      category_slug: d.category ?? null,
      material: d.material ?? null,
      description: d.description ?? null,
      price: Number(d.price ?? 0),
      sale_price: d.salePrice ? Number(d.salePrice) : null,
      stock: Number(d.stock ?? 0),
      images: Array.isArray(d.images) ? d.images : d.image ? [d.image] : [],
      is_active: d.active !== false,
      is_sold_out: d.stock === 0,
      allow_engraving: d.allowEngraving ?? false,
      needs_ring_size: d.needsRingSize ?? false,
      gift_wrap: d.giftWrap ?? false,
      care_guide: d.careGuide ?? null,
      created_at: toISO(d.createdAt),
    };

    const { error } = await supabase
      .from("products")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.error(`  ✗ 상품 ${doc.id}: ${error.message}`);
    } else {
      ok++;
    }
  }
  log(`✓ 상품 ${ok}/${docs.length}개 완료`);
  return docs.map((d) => d.id);
}

// ── 2. 리뷰 마이그레이션 ──────────────────────────────────────────────────────
async function migrateReviews(productIds) {
  log("▶ 리뷰 마이그레이션 시작");
  let total = 0;
  let ok = 0;

  for (const pid of productIds) {
    const snap = await db
      .collection("products")
      .doc(pid)
      .collection("reviews")
      .get();
    total += snap.size;

    for (const doc of snap.docs) {
      const d = doc.data();
      const row = {
        product_id: pid,
        // Firestore userId → Supabase user_id (같은 UID 사용 시 매핑 가능)
        user_id: d.userId ?? null,
        rating: Number(d.rating ?? d.stars ?? 5),
        body: d.text ?? d.body ?? "",
        is_verified: false, // 트리거가 재계산
        created_at: toISO(d.createdAt),
      };

      if (!row.user_id) continue; // userId 없으면 스킵

      const { error } = await supabase.from("reviews").insert(row);
      if (error) {
        console.error(`  ✗ 리뷰 ${doc.id}: ${error.message}`);
      } else {
        ok++;
      }
    }
  }
  log(`✓ 리뷰 ${ok}/${total}개 완료`);
}

// ── 3. 쿠폰 마이그레이션 ──────────────────────────────────────────────────────
async function migrateCoupons() {
  log("▶ 쿠폰 마이그레이션 시작");
  const snap = await db.collection("products").doc("_coupons").get();
  if (!snap.exists) {
    log("  쿠폰 문서 없음, 스킵");
    return;
  }

  const d = snap.data();
  const coupons = Array.isArray(d.list) ? d.list : Object.values(d);
  let ok = 0;

  for (const c of coupons) {
    if (!c.code) continue;
    const row = {
      code: String(c.code).toUpperCase(),
      label: c.label ?? c.name ?? c.code,
      discount_type: c.type === "percent" ? "percent" : "amount",
      discount_value: Number(c.value ?? c.discount ?? 0),
      min_order: Number(c.minOrder ?? c.min ?? 0),
      is_active: c.active !== false,
    };

    const { error } = await supabase
      .from("coupons")
      .upsert(row, { onConflict: "code" });
    if (error) {
      console.error(`  ✗ 쿠폰 ${c.code}: ${error.message}`);
    } else {
      ok++;
    }
  }
  log(`✓ 쿠폰 ${ok}개 완료`);
}

// ── 4. 주문 마이그레이션 ──────────────────────────────────────────────────────
async function migrateOrders() {
  log("▶ 주문 마이그레이션 시작");
  const snap = await db.collection("orders").get();
  let ok = 0;

  const statusMap = {
    pending: "pending",
    paid: "paid",
    preparing: "preparing",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
    // 레거시 값 매핑
    "결제완료": "paid",
    "배송중": "shipped",
    "배송완료": "delivered",
    "취소": "cancelled",
  };

  for (const doc of snap.docs) {
    const d = doc.data();

    const order = {
      id: doc.id,
      user_id: d.userId ?? null,
      status: statusMap[d.status] ?? "paid",
      recipient: d.recipient ?? d.name ?? "알 수 없음",
      phone: d.phone ?? "",
      address: d.address ?? "",
      total: Number(d.total ?? d.amount ?? 0),
      discount: Number(d.discount ?? 0),
      created_at: toISO(d.createdAt ?? d.orderDate),
    };

    if (!order.user_id) continue;

    const { error: oErr } = await supabase
      .from("orders")
      .upsert(order, { onConflict: "id" });

    if (oErr) {
      console.error(`  ✗ 주문 ${doc.id}: ${oErr.message}`);
      continue;
    }

    // order_items
    const items = Array.isArray(d.items) ? d.items : [];
    for (const item of items) {
      const row = {
        order_id: doc.id,
        product_id: item.productId ?? null,
        product_name: item.name ?? item.productName ?? "상품",
        qty: Number(item.qty ?? item.quantity ?? 1),
        unit_price: Number(item.price ?? item.unitPrice ?? 0),
      };
      await supabase.from("order_items").insert(row);
    }
    ok++;
  }
  log(`✓ 주문 ${ok}/${snap.size}개 완료`);
}

// ── 실행 ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Firestore → Supabase 마이그레이션 ===\n");

  const productIds = await migrateProducts();
  await migrateReviews(productIds);
  await migrateCoupons();
  await migrateOrders();

  console.log("\n=== 완료 ===");
  console.log("⚠️  사용자(auth.users) 마이그레이션은 Firebase Auth → Supabase Auth");
  console.log("   수동 이메일 초대 또는 비밀번호 재설정 안내가 필요합니다.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
