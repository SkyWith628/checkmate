/**
 * 카탈로그 E2E — 공개 페이지 (인증 불필요)
 */
import { test, expect } from "@playwright/test";

test.describe("카탈로그", () => {
  test("홈 페이지 로드", async ({ page }) => {
    await page.goto("/");
    // 실제 타이틀: "CHECK ⬦ MATE"
    await expect(page).toHaveTitle(/CHECK.*MATE/i);
    await expect(page.locator("nav")).toBeVisible();
  });

  test("컬렉션 페이지 — 상품 카드 표시", async ({ page }) => {
    await page.goto("/collection");
    const cards = page.locator("a[href^='/product/']");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("카테고리 페이지 — pendant", async ({ page }) => {
    await page.goto("/category/pendant");
    await expect(page).not.toHaveURL(/404/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("상품 상세 → 장바구니 담기", async ({ page }) => {
    await page.goto("/collection");

    const firstProduct = page.locator("a[href^='/product/']").first();
    await expect(firstProduct).toBeVisible({ timeout: 10_000 });
    await firstProduct.click();
    await page.waitForURL(/\/product\//);

    // 장바구니 담기 버튼
    const addBtn = page.getByRole("button", { name: /장바구니 담기/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // sonner 토스트 확인 ([data-sonner-toast])
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("장바구니 페이지 — 담긴 상품 표시", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const item = {
        productId: "test-id",
        name: "테스트 상품",
        price: 10000,
        qty: 1,
        image: "",
      };
      localStorage.setItem("cm_cart", JSON.stringify([item]));
    });

    await page.goto("/cart");
    // getByText 에 strict:false 사용 (동일 텍스트 여러 개 허용)
    await expect(
      page.getByText("테스트 상품").first()
    ).toBeVisible();
  });
});
