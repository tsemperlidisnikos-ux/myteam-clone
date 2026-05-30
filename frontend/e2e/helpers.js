import { expect } from "@playwright/test";

export async function loginAsAdmin(page) {
  const email = process.env.PLAYWRIGHT_EMAIL || "nikos.tseberlidis@gmail.com";
  const password = process.env.PLAYWRIGHT_PASSWORD || "123456";

  await page.goto("/");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/κωδικ/i).fill(password);
  await page.getByRole("button", { name: /σύνδεση/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

export function tomorrowIsoDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
