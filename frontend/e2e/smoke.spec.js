import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers.js";

test("login page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /σύνδεση/i })).toBeVisible();
});

test("forgot password page", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /κωδικ/i })).toBeVisible();
});

test("login flow", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { name: /αρχική/i })).toBeVisible();
});

test("calendar page after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: /ημερολόγιο/i })).toBeVisible();
});

test("messages page after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/messages");
  await expect(page.getByRole("button", { name: /ανακοινώσεις/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /μηνύματα \(dm\)/i })).toBeVisible();
});
