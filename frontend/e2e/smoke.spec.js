import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /σύνδεση/i })).toBeVisible();
});

test("forgot password page", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /κωδικ/i })).toBeVisible();
});

test("login flow", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_EMAIL || "nikos.tseberlidis@gmail.com";
  const password = process.env.PLAYWRIGHT_PASSWORD || "123456";

  await page.goto("/");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/κωδικ/i).fill(password);
  await page.getByRole("button", { name: /σύνδεση/i }).click();

  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: /αρχική/i })).toBeVisible();
});
