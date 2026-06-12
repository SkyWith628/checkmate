/**
 * 관리자 E2E
 * - 비로그인 시 /admin 접근 차단
 * - 일반 유저 로그인 시 /admin 접근 차단
 */
import { test, expect } from "@playwright/test";

test.describe("관리자 접근 제어", () => {
  test("비로그인 → /admin 접근 시 로그인으로 리디렉션", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("/admin/products 직접 접근 차단", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("/admin/orders 직접 접근 차단", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});
