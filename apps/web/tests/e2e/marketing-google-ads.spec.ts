import { expect, test } from "@playwright/test";

const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-11460691521";

test.describe("Marketing site — Google Ads", () => {
  test("homepage includes gtag in document head", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    const html = await page.content();
    expect(response?.status(), `homepage status ${response?.status()}`).toBeLessThan(500);
    expect(html).toContain(`googletagmanager.com/gtag/js?id=${googleAdsId}`);
    expect(html).toContain(googleAdsId);
    expect(html).toContain("dataLayer");
  });
});
