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
    if (localStorage.getItem("codex-lb-theme") === null) {
      localStorage.setItem("codex-lb-theme", theme);
    }
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
      subscriptionExpiresAt: "2026-01-31T12:00:00Z", availableResetCredits: 2,
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
    "/api/automations": { items: [], total: 0, hasMore: false },
    "/api/automations/options": { accountIds: [], models: [], statuses: [], scheduleTypes: [] },
    "/api/automations/runs": { items: [], total: 0, hasMore: false },
    "/api/automations/runs/options": { accountIds: [], models: [], statuses: [], triggers: [] },
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

test("header theme switch toggles, persists and supports keyboard", async ({ page }, testInfo) => {
  const { errors, unexpected } = await preparePage(page, "light", "vi");
  await page.goto(`${BASE_URL}/accounts`);
  await expect(page.getByTestId("account-card-grid")).toBeVisible();
  const toggle = page.getByRole("switch", { name: "Chủ đề: Tối", exact: true });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("codex-lb-theme"))).toBe("dark");
  await page.reload();
  await expect(toggle).toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(toggle).toBeChecked();
  await expect(toggle).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("theme-switch-dark.png") });
  expect(errors).toEqual([]);
  expect(unexpected).toEqual([]);
});

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
      const plusCard = page.locator("article").filter({ hasText: "Demo Plus" });
      await expect(plusCard.getByRole("button", { name: "Đặt lại (2)", exact: true })).toBeVisible();
      const actionGrid = plusCard.getByRole("button", { name: "Xem chi tiết", exact: true }).locator("..");
      expect(await actionGrid.evaluate((element) => {
        const rows = new Map<number, number>();
        for (const button of element.querySelectorAll(":scope > button")) {
          const top = Math.round(button.getBoundingClientRect().top);
          rows.set(top, (rows.get(top) ?? 0) + 1);
        }
        return Array.from(rows.values());
      })).toEqual([2, 2, 3]);
      expect(await actionGrid.locator(":scope > button").evaluateAll((buttons) =>
        buttons.every((button) => button.scrollWidth <= button.clientWidth),
      )).toBe(true);
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

for (const theme of ["light", "dark"] as const) {
  for (const width of [1440, 390]) {
    test(`auto-login modal: ${theme}, ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const { errors, unexpected } = await preparePage(page, theme, "vi");
      await page.goto(`${BASE_URL}/accounts`);
      await page.getByRole("button", { name: "Thêm tài khoản", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: /Đăng nhập tự động/ }).click();
      const dialog = page.getByRole("dialog", { name: "Đăng nhập tự động", exact: true });
      await expect(dialog).toBeVisible();
      const input = dialog.getByRole("textbox", { name: "Thông tin tài khoản", exact: true });
      await expect(input).toBeFocused();
      await expect(input).toHaveAccessibleDescription(/email.*password.*2FA/);
      await expect(dialog.getByRole("button", { name: "Đăng nhập và nhập", exact: true })).toBeDisabled();
      // Synthetic input only. Submission is intentionally never triggered.
      const record = "demo.with.a.long.address@example.invalid|sample-password-for-layout-only|SAMPLE-2FA-SYNTHETIC";
      await input.fill(`${record}\n${record}`);
      const numbers = dialog.getByTestId("credential-record-numbers");
      await expect(numbers.locator(":scope > div")).toHaveText(["1", "2"]);
      await expect(input).toHaveAttribute("wrap", "off");
      await expect(dialog.getByRole("button", { name: "Đăng nhập và nhập", exact: true })).toBeEnabled();
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      const bounds = await dialog.boundingBox();
      if (width === 1440) {
        expect(bounds!.width).toBeGreaterThanOrEqual(1000);
        expect(await input.evaluate((element: HTMLTextAreaElement) => element.scrollWidth <= element.clientWidth)).toBe(true);
      }
      expect(bounds!.x).toBeGreaterThanOrEqual(16);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 16);
      await page.screenshot({ path: testInfo.outputPath("auto-login-modal.png") });
      await input.fill(Array.from({ length: 30 }, (_, index) =>
        `${index === 0 ? "x".repeat(200) : "demo"}@example.invalid|sample-password|SAMPLE-2FA`,
      ).join("\n"));
      await input.evaluate((element: HTMLTextAreaElement) => {
        element.scrollTop = 280;
        element.scrollLeft = 150;
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      const scrollTop = await input.evaluate((element) => element.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
      await expect.poll(() => numbers.evaluate((element) => element.scrollTop)).toBe(scrollTop);
      expect(await input.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await page.setViewportSize({ width: 320, height: 480 });
      await dialog.getByRole("button", { name: "Đăng nhập và nhập", exact: true }).scrollIntoViewIfNeeded();
      await expect(dialog.getByRole("button", { name: "Đăng nhập và nhập", exact: true })).toBeInViewport();
      const compactBounds = await dialog.boundingBox();
      expect(compactBounds!.y).toBeGreaterThanOrEqual(15);
      expect(compactBounds!.y + compactBounds!.height).toBeLessThanOrEqual(465);
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await dialog.getByRole("button", { name: "Đóng", exact: true }).last().click();
      await expect(dialog).not.toBeVisible();
      await page.getByRole("button", { name: "Thêm tài khoản", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: /Đăng nhập tự động/ }).click();
      await expect(dialog.getByRole("textbox")).toHaveValue("");
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      expect(errors).toEqual([]);
      expect(unexpected).toEqual([]);
    });
  }
}

for (const theme of ["light", "dark"] as const) {
  test(`Account title copies without opening details: ${theme}`, async ({ page, context }, testInfo) => {
    const { errors, unexpected } = await preparePage(page, theme, "vi");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE_URL });
    await page.goto(`${BASE_URL}/accounts`);
    const card = page.locator("article").filter({ hasText: "Demo Plus" });
    const title = card.getByRole("button", { name: /Demo Plus$/, exact: false });
    await title.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("Demo Plus");
    const successToast = page.locator("[data-sonner-toast][data-type='success']").filter({ hasText: "Đã sao chép vào bộ nhớ tạm" });
    await expect(successToast).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("account-title-copy-toast.png"), fullPage: true });
    await expect(successToast).toHaveCount(0, { timeout: 10_000 });
    await title.focus();
    await page.keyboard.press("Enter");
    await expect(successToast).toBeVisible();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("Demo Plus");
    await expect(title).toBeFocused();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("account-title-copy.png"), fullPage: true });
    await card.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Chi tiết tài khoản", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`Inline card detail action: ${theme}`, async ({ page }, testInfo) => {
    const { errors, unexpected } = await preparePage(page, theme, "vi");
    await page.goto(`${BASE_URL}/accounts`);
    const card = page.locator("article").filter({ hasText: "Demo Plus" });
    const details = card.getByRole("button", { name: "Xem chi tiết", exact: true });
    const dialog = page.getByRole("dialog", { name: "Chi tiết tài khoản", exact: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(details).toHaveText("");
      await expect(details).toHaveAttribute("title", "Xem chi tiết");
      const grid = details.locator("..");
      await expect(grid.getByRole("button", { name: "Xóa", exact: true })).toBeVisible();
      expect(await grid.evaluate((element) => getComputedStyle(element).display)).toBe("grid");
      await details.focus();
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(details).toBeFocused();
      await details.click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(details).toBeFocused();
      await expectNoPageOverflow(page);
      await page.screenshot({ path: testInfo.outputPath(`inline-details-${width}.png`), fullPage: true });
    }
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });

  test(`Readable account action labels: ${theme}`, async ({ page }, testInfo) => {
    const { errors, unexpected } = await preparePage(page, theme, "vi");
    await page.route(`${BASE_URL}/api/accounts`, (route) => route.fulfill({
      json: { accounts: [
        createAccountSummary({ accountId: "demo-active", displayName: "Demo Plus", availableResetCredits: 2, limitWarmupEnabled: true }),
        createAccountSummary({ accountId: "demo-reauth", displayName: "Demo Recovery", status: "reauth_required" }),
        createAccountSummary({ accountId: "demo-paused", displayName: "Demo Paused", status: "paused" }),
        createAccountSummary({ accountId: "demo-ready", displayName: "Demo Ready" }),
      ] },
    }));
    await page.goto(`${BASE_URL}/accounts`);
    await expect(page.locator("article")).toHaveCount(4);
    for (const width of [1920, 1600, 1440, 1280, 1024, 768, 390, 375, 360, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const buttons = page.locator("article button[data-slot='button']");
      await expect(buttons.first()).toBeVisible();
      const issues = await buttons.evaluateAll((elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element);
        const content = range.getBoundingClientRect();
        return style.fontSize !== "14px" || Number(style.fontWeight) < 700 ||
          element.scrollWidth > element.clientWidth + 1 || content.left < rect.left || content.right > rect.right
          ? [{ label: element.textContent, fontSize: style.fontSize, fontWeight: style.fontWeight, width: rect.width, contentWidth: content.width }]
          : [];
      }));
      expect(issues, `Action labels at ${width}px`).toEqual([]);
      await expectNoPageOverflow(page);
      if (width === 1920 || width === 390) {
        await page.screenshot({ path: testInfo.outputPath(`account-actions-${width}.png`), fullPage: true });
      }
    }
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`Status-colored account card borders: ${theme}`, async ({ page }, testInfo) => {
    const { errors, unexpected } = await preparePage(page, theme, "vi");
    const statuses = [
      { status: "active", color: "emerald" },
      { status: "paused", color: "amber" },
      { status: "rate_limited", color: "orange" },
      { status: "quota_exceeded", color: "red" },
      { status: "reauth_required", color: "sky" },
      { status: "deactivated", color: "zinc" },
    ] as const;
    const accounts = statuses.map(({ status }, index) => createAccountSummary({
      accountId: `demo-status-${index}`, displayName: `Demo Status ${index}`, status,
    }));
    await page.route(`${BASE_URL}/api/accounts`, (route) => route.fulfill({ json: { accounts } }));
    await page.goto(`${BASE_URL}/accounts?selected=demo-status-0`);
    await expect(page.locator("article")).toHaveCount(6);
    const checkBorder = async (index: number, color: string, selected = false) => {
      const card = page.locator("article").filter({ hasText: `Demo Status ${index}` });
      const colors = await card.evaluate((element, color) => {
        const probe = document.createElement("div");
        element.appendChild(probe);
        probe.style.borderColor = `color-mix(in oklab, var(--color-${color}-500) 50%, transparent)`;
        const expectedBorder = getComputedStyle(probe).borderTopColor;
        probe.style.color = `color-mix(in oklab, var(--color-${color}-500) 25%, transparent)`;
        const expectedRing = getComputedStyle(probe).color;
        const style = getComputedStyle(element);
        const result = { border: style.borderTopColor, expectedBorder, shadow: style.boxShadow, expectedRing };
        probe.remove();
        return result;
      }, color);
      expect(colors.border).toBe(colors.expectedBorder);
      if (selected) expect(colors.shadow).toContain(colors.expectedRing);
      await expect(card.getByRole("img")).toBeVisible();
      await expect(card.getByRole("button", { name: "Xem chi tiết", exact: true })).toBeVisible();
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [index, { color }] of statuses.entries()) await checkBorder(index, color, index === 0);
      await expectNoPageOverflow(page);
      await page.screenshot({ path: testInfo.outputPath(`status-borders-${width}.png`), fullPage: true });
    }
    // Updated synthetic account data must replace the old border and selected ring.
    accounts[0] = createAccountSummary({ ...accounts[0], status: "reauth_required" });
    await page.reload();
    await expect(page.locator("article")).toHaveCount(6);
    await checkBorder(0, "sky", true);
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
}

function contrast(first: string, second: string) {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.slice(0, 3).map((value) => {
      const channel = Number(value) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const theme of ["dark", "light"] as const) {
  for (const width of [1440, 390]) {
    test(`selected controls remain distinct: ${theme}, ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      const { errors, unexpected } = await preparePage(page, theme, "vi");
      await page.goto(`${BASE_URL}/automations`);
      await page.getByRole("button", { name: "Thêm tự động hóa", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Tên", { exact: true }).fill("Kiểm tra độ tương phản");
      await page.keyboard.press("Tab");
      const days = dialog.getByRole("group", { name: "Các ngày trong tuần", exact: true });
      const day = days.getByRole("button").first();
      await expect(day).toHaveAttribute("aria-pressed", "true");
      const colors = () => day.evaluate((element) => {
        const style = getComputedStyle(element);
        // Composite translucent outline fills over their ancestors before measuring contrast.
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d")!;
        const ancestors: Element[] = [];
        for (let current: Element | null = element; current; current = current.parentElement) ancestors.unshift(current);
        for (const ancestor of ancestors) {
          context.fillStyle = getComputedStyle(ancestor).backgroundColor;
          context.fillRect(0, 0, 1, 1);
        }
        const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
        return { background: `rgb(${red}, ${green}, ${blue})`, text: style.color, focus: style.boxShadow };
      });
      await page.mouse.move(0, 0);
      const selected = await colors();
      await day.scrollIntoViewIfNeeded();
      await day.click();
      await expect(day).toHaveAttribute("aria-pressed", "false");
      await page.mouse.move(0, 0);
      const unselected = await colors();
      if (theme === "dark") {
        const baseline = await page.addStyleTag({ content: ".dark .selection-control { background-color: revert-layer; border-color: revert-layer; color: revert-layer; }" });
        await days.screenshot({ path: testInfo.outputPath("weekdays-before.png") });
        await baseline.evaluate((element) => element.remove());
        await days.screenshot({ path: testInfo.outputPath("weekdays-after.png") });
      }
      await day.focus();
      await page.keyboard.press("Space");
      await expect(day).toHaveAttribute("aria-pressed", "true");
      await expect(day).toBeFocused();
      expect((await colors()).focus).not.toBe("none");
      await day.hover();
      const hovered = await colors();
      await page.screenshot({ path: testInfo.outputPath("selected-weekdays.png"), fullPage: true });
      if (theme === "dark") {
        expect(contrast(selected.background, unselected.background)).toBeGreaterThanOrEqual(3);
        expect(contrast(selected.background, selected.text)).toBeGreaterThanOrEqual(4.5);
        expect(hovered.background).toBe(selected.background);
        expect(contrast(hovered.background, hovered.text)).toBeGreaterThanOrEqual(4.5);
      } else {
        expect(selected.background).not.toBe(unselected.background);
      }
      expect(await days.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await page.keyboard.press("Escape");
      await page.goto(`${BASE_URL}/settings`);
      if (theme === "dark") {
        const appearance = page.getByRole("button", { name: "Tối", exact: true });
        await expect(appearance).toHaveAttribute("aria-pressed", "true");
        const colors = await appearance.evaluate((element) => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, text: style.color };
        });
        expect(contrast(colors.background, colors.text)).toBeGreaterThanOrEqual(4.5);
        await page.getByRole("button", { name: "Hiện cài đặt nâng cao", exact: true }).click();
        const routing = page.locator("button.selection-control[aria-pressed='true']").filter({ has: page.locator("span.text-xs") }).first();
        const routingColors = await routing.evaluate((element) => ({
          background: getComputedStyle(element).backgroundColor,
          labels: [...element.querySelectorAll(":scope > span")].map((span) => getComputedStyle(span).color),
        }));
        for (const label of routingColors.labels) expect(contrast(routingColors.background, label)).toBeGreaterThanOrEqual(4.5);
        await page.getByRole("button", { name: "Ẩn cài đặt nâng cao", exact: true }).click();
        if (width >= 1280) {
          const activeNav = page.getByRole("banner").getByRole("link", { name: "Cài đặt", exact: true });
          const navColors = await activeNav.evaluate((element) => {
            const style = getComputedStyle(element);
            return { background: style.backgroundColor, text: style.color };
          });
          expect(navColors.background).toBe(colors.background);
          expect(contrast(navColors.background, navColors.text)).toBeGreaterThanOrEqual(4.5);
        } else {
          await page.getByRole("button", { name: "Mở menu", exact: true }).click();
          const activeNav = page.getByRole("dialog").getByRole("link", { name: "Cài đặt", exact: true }).locator(":scope > span");
          await expect(activeNav).toHaveCSS("background-color", colors.background);
          await page.keyboard.press("Escape");
        }
      }
      await expectNoPageOverflow(page);
      await page.screenshot({ path: testInfo.outputPath("selected-settings.png"), fullPage: true });
      expect(errors).toEqual([]);
      expect(unexpected).toEqual([]);
    });
  }
}
