import { test, expect } from "@playwright/test";
import { loginAsAdmin, tomorrowIsoDate } from "./helpers.js";

test("create training", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/trainings");

  const location = `E2E Gym ${Date.now()}`;
  await page.getByRole("button", { name: /νέα προπόνηση/i }).click();
  const date = tomorrowIsoDate();
  const dateInput = page.locator('input[type="date"]');
  await dateInput.fill(date);
  await expect(dateInput).toHaveValue(date);
  await page.locator('input[type="time"]').first().fill("18:00");
  await page.locator('input[type="time"]').nth(1).fill("20:00");
  await page.getByPlaceholder(/τοποθεσία/i).fill(location);
  await page.getByRole("button", { name: /^αποθήκευση$/i }).click();

  await expect(page.getByText(location)).toBeVisible({ timeout: 10000 });
});

test("send direct message", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/messages");

  await page.getByRole("button", { name: /μηνύματα \(dm\)/i }).click();
  const firstContact = page.locator(".dm-contacts button").first();
  await expect(firstContact).toBeVisible({ timeout: 10000 });
  await firstContact.click();
  const msg = `E2E DM ${Date.now()}`;
  await page.getByPlaceholder(/γράψε μήνυμα/i).fill(msg);
  await page.getByRole("button", { name: /^αποστολή$/i }).click();

  await expect(page.getByText(msg)).toBeVisible({ timeout: 10000 });
});

test("parent registration page loads", async ({ page }) => {
  await page.goto("/register-parent");
  await expect(page.getByRole("heading", { name: /εγγραφή γονέα/i })).toBeVisible();
  await expect(page.getByPlaceholder(/κωδικός σύνδεσης/i)).toBeVisible();
});
