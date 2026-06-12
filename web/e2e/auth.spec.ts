/**
 * 인증 E2E
 */
import { test, expect } from "@playwright/test";

test.describe("인증", () => {
  test("로그인 페이지 렌더링", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /로그인/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("잘못된 자격증명으로 로그인 실패", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("wrong@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /로그인/i }).click();

    // 에러 토스트 또는 에러 메시지 표시
    const error = page.locator("[data-sonner-toast], [role='alert']");
    await expect(error.first()).toBeVisible({ timeout: 10_000 });
  });

  test("회원가입 페이지 렌더링", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /회원가입/i })).toBeVisible();
  });

  test("비로그인 → 마이페이지 접근 시 로그인으로 리디렉션", async ({ page }) => {
    await page.goto("/mypage");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("비로그인 → 체크아웃 접근 시 로그인으로 리디렉션", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});
