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
