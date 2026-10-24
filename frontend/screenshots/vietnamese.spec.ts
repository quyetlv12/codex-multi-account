import { expect, test, type Page } from "@playwright/test";

import {
  createAccountSummary,
  createAccountTrends,
  createDashboardAuthSession,
  createDashboardOverview,
  createDashboardSettings,
  createQuotaPlannerForecast,
  createQuotaPlannerSettings,
  createTelemetryConsent,
  createUpstreamProxyAdmin,
} from "../src/test/mocks/factories";

const BASE_URL = `http://127.0.0.1:${process.env.SCREENSHOT_PORT ?? "4173"}`;
const FIXED_TIME = "2026-01-01T12:00:00Z";
const LANGUAGE_KEY = "codex-lb-language";

test.use({ locale: "en-US", serviceWorkers: "block" });

async function preparePage(page: Page, theme: "light" | "dark", initialLanguage?: string) {
  const errors: string[] = [];
  const unexpected: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.setFixedTime(new Date(FIXED_TIME));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(({ theme, initialLanguage }) => {
    localStorage.setItem("codex-lb-theme", theme);
    if (initialLanguage && localStorage.getItem("codex-lb-language") === null) {
      localStorage.setItem("codex-lb-language", initialLanguage);
    }
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; }";
      document.head.appendChild(style);
    }, { once: true });
  }, { theme, initialLanguage });

  const accounts = [
    createAccountSummary({
      accountId: "demo-30-days", email: "demo30@example.invalid", displayName: "Demo Plus",
      subscriptionExpiresAt: "2026-01-31T12:00:00Z",
    }),
    createAccountSummary({
      accountId: "demo-3-days", email: "demo3@example.invalid", displayName: "Demo Pro",
      planType: "pro", subscriptionExpiresAt: "2026-01-04T12:00:00Z",
    }),
    createAccountSummary({
      accountId: "demo-no-expiry", email: "demo-no-expiry@example.invalid", displayName: "Demo Standard",
      subscriptionExpiresAt: null,
    }),
  ];
  const responses: Record<string, unknown> = {
    "/health": { status: "ok" },
    "/api/dashboard-auth/session": createDashboardAuthSession(),
    "/api/accounts": { accounts },
    "/api/dashboard/overview": createDashboardOverview({ accounts }),
    "/api/settings/telemetry": createTelemetryConsent({ state: "disabled", active: false }),
    "/api/runtime/version": {
      currentVersion: "1.24.0", latestVersion: "1.24.0", updateAvailable: false,
      checkedAt: FIXED_TIME, releaseUrl: "https://example.invalid/releases",
    },
    "/api/settings": createDashboardSettings({ subscriptionExpiryWindowDays: 7 }),
    "/api/settings/upstream-proxy": createUpstreamProxyAdmin(),
    "/api/api-keys/": [],
    "/api/models": { models: [] },
    "/api/model-sources/": { sources: [] },
    "/api/firewall/ips": { mode: "allow_all", entries: [] },
    "/api/quota-planner/settings": createQuotaPlannerSettings(),
    "/api/quota-planner/decisions": [],
    "/api/quota-planner/forecast": createQuotaPlannerForecast({
      generatedAt: FIXED_TIME, peakSlotStart: "2026-01-01T13:00:00Z",
    }),
    "/api/sticky-sessions": { entries: [], total: 0, hasMore: false, stalePromptCacheCount: 0 },
  };
  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== BASE_URL || request.method() !== "GET") {
      unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
      return route.abort();
    }
    const fulfill = (data: unknown) => route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
    if (Object.hasOwn(responses, url.pathname)) return fulfill(responses[url.pathname]);
    const trends = url.pathname.match(/^\/api\/accounts\/(demo-[^/]+)\/trends$/);
    if (trends) return fulfill(createAccountTrends(trends[1]));
    const credits = url.pathname.match(/^\/api\/accounts\/(demo-[^/]+)\/usage-reset-credits$/);
    if (credits) return fulfill({ accountId: credits[1], rateLimitResetCredits: { availableCount: 0 } });
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      unexpected.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  return { errors, unexpected };
}

async function expectLanguage(page: Page, language: string) {
  await expect(page.locator("html")).toHaveAttribute("lang", language);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), LANGUAGE_KEY)).toBe(language);
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const theme of ["light", "dark"] as const) {
  test(`full-width header navigation: ${theme}`, async ({ page }, testInfo) => {
    const { errors, unexpected } = await preparePage(page, theme, "vi");
    await page.goto(`${BASE_URL}/accounts`);
    await expect(page.getByTestId("account-card-grid")).toBeVisible();
    const header = page.getByRole("banner");
    const menuButton = header.getByRole("button", { name: "Mở menu", exact: true });
    for (const width of [320, 390, 640, 768, 1024, 1279, 1280, 1440, 2048, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      const container = await header.locator(":scope > div").boundingBox();
      expect(container!.x).toBe(16);
      expect(container!.width).toBe(width - 32);
      expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

      if (width < 1280) {
        await expect(header.getByRole("navigation")).not.toBeVisible();
        await menuButton.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("link")).toHaveCount(6);
        await expect(dialog.locator("nav a svg[aria-hidden='true']")).toHaveCount(6);
        await dialog.getByRole("link", { name: "Cài đặt", exact: true }).click();
        await expect(page).toHaveURL(`${BASE_URL}/settings`);
        await expect(dialog).not.toBeVisible();
        await menuButton.click();
        await page.getByRole("dialog").getByRole("link", { name: "Tài khoản", exact: true }).click();
        await expect(page).toHaveURL(`${BASE_URL}/accounts`);
        await expect(dialog).not.toBeVisible();
      } else {
        await expect(menuButton).not.toBeVisible();
        const nav = header.getByRole("navigation");
        await expect(nav).toBeVisible();
        await expect(nav.locator("a svg[aria-hidden='true']")).toHaveCount(5);
        await expect(nav.getByRole("link", { name: "Tài khoản", exact: true })).toHaveAttribute("aria-current", "page");
        expect(await nav.locator("a, button").evaluateAll((elements) => elements.every(
          (element) => element.scrollWidth <= element.clientWidth,
        ))).toBe(true);
        const brand = await header.getByRole("link", { name: "Codex LB", exact: true }).boundingBox();
        const navBounds = await nav.boundingBox();
        const actions = await header.locator(":scope > div > div").boundingBox();
        expect(brand!.x + brand!.width).toBeLessThanOrEqual(navBounds!.x);
        expect(navBounds!.x + navBounds!.width).toBeLessThanOrEqual(actions!.x);
        await nav.getByRole("button", { name: "Nâng cao", exact: true }).click();
        const automation = page.getByRole("menuitem", { name: "Tự động hóa", exact: true });
        await expect(automation).toBeVisible();
        await expect(automation.locator("svg[aria-hidden='true']")).toHaveCount(1);
        await page.keyboard.press("Escape");
      }
      if ([390, 1280, 2048].includes(width)) {
        await page.screenshot({ path: testInfo.outputPath(`header-${width}.png`) });
      }
    }
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [1536, 390]) {
    test(`Vietnamese selection and persistence: ${theme}, ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const { errors, unexpected } = await preparePage(page, theme, "en");
      await page.goto(`${BASE_URL}/accounts`);
      await expect(page.getByTestId("account-card-grid")).toBeVisible();
      await expectLanguage(page, "en");

      if (width < 640) {
        await page.getByRole("button", { name: "Open menu", exact: true }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Tiếng Việt", exact: true }).click();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).not.toBeVisible();
      } else {
        await page.getByRole("button", { name: "Language", exact: true }).click();
        await page.getByRole("menuitem", { name: "Tiếng Việt", exact: true }).click();
      }
      await expectLanguage(page, "vi");
      await page.reload();
      await expectLanguage(page, "vi");
      if (theme === "dark") {
        await expect(page.locator("html")).toHaveClass(/dark/);
      } else {
        await expect(page.locator("html")).not.toHaveClass(/dark/);
      }
      const proCard = page.locator("article").filter({ hasText: "Demo Pro" });
      await expect(proCard.getByText("3 ngày", { exact: true })).toBeVisible();
      await expectNoPageOverflow(page);
      expect(await page.locator("article").evaluateAll((cards) =>
        cards.every((card) => card.scrollWidth <= card.clientWidth),
      )).toBe(true);
      await page.screenshot({ path: testInfo.outputPath("vietnamese-accounts.png"), fullPage: true });

      await proCard.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Chi tiết tài khoản", exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading", { name: "Chi tiết tài khoản", exact: true })).toBeVisible();
      await expect(dialog.getByText("3 ngày", { exact: true })).toBeVisible();
      await expect(dialog.getByText("Ngày hết hạn gói", { exact: true })).toBeVisible();
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
      await page.screenshot({ path: testInfo.outputPath("vietnamese-account-detail.png") });
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();

      await page.goto(`${BASE_URL}/settings`);
      await page.getByRole("button", { name: "Hiện cài đặt nâng cao", exact: true }).click();
      const expiryLabel = page.getByText("Ưu tiên tài khoản sắp hết hạn gói", { exact: true });
      await expect(expiryLabel).toBeVisible();
      await expect(page.getByRole("spinbutton", { name: "Cửa sổ ngày hết hạn gói", exact: true })).toHaveValue("7");
      await expiryLabel.scrollIntoViewIfNeeded();
      await expectLanguage(page, "vi");
      await expectNoPageOverflow(page);
      await page.screenshot({ path: testInfo.outputPath("vietnamese-settings.png") });
      expect(errors).toEqual([]);
      expect(unexpected).toEqual([]);
    });
  }
}

test("defaults to Vietnamese for an English browser and respects stored English", async ({ page }) => {
  const { errors, unexpected } = await preparePage(page, "light");
  await page.goto(`${BASE_URL}/accounts`);
  expect(await page.evaluate(() => navigator.language)).toBe("en-US");
  await expectLanguage(page, "vi");
  await expect(page.getByText("3 ngày", { exact: true })).toBeVisible();
  await page.evaluate((key) => localStorage.setItem(key, "en"), LANGUAGE_KEY);
  await page.reload();
  await expectLanguage(page, "en");
  await expect(page.getByText("3 days", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(unexpected).toEqual([]);
});
