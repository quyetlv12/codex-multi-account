import { expect, test } from "@playwright/test";

import {
  createAccountSummary,
  createAccountTrends,
  createDashboardAuthSession,
  createDashboardSettings,
  createDashboardOverview,
  createTelemetryConsent,
  createUpstreamProxyAdmin,
} from "../src/test/mocks/factories";

for (const theme of ["light", "dark"] as const) {
  for (const width of [1920, 1536, 1535, 1440, 390]) {
    test(`account detail modal and expiry: ${theme}, ${width}px`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((value) => {
        localStorage.setItem("codex-lb-theme", value);
        localStorage.setItem("codex-lb-language", "en");
      }, theme);
      const accounts = [
        createAccountSummary({
          accountId: "demo-30-days", email: "demo30@example.invalid", displayName: "Demo Plus",
          subscriptionExpiresAt: "2026-01-31T12:00:00Z", availableResetCredits: 1,
        }),
        createAccountSummary({
          accountId: "demo-3-days", email: "demo3@example.invalid", displayName: "Demo Pro",
          planType: "pro", subscriptionExpiresAt: "2026-01-04T12:00:00Z",
        }),
        createAccountSummary({
          accountId: "demo-no-expiry", email: "demo-no-expiry@example.invalid", displayName: "Demo Standard",
          planType: "plus", subscriptionExpiresAt: null,
          usage: { primaryRemainingPercent: null, secondaryRemainingPercent: 67, monthlyRemainingPercent: null },
          resetAtPrimary: null, windowMinutesPrimary: null,
        }),
        createAccountSummary({
          accountId: "demo-fourth", email: "demo-fourth@example.invalid", displayName: "Demo Fourth",
          planType: "pro", subscriptionExpiresAt: null,
        }),
      ];
      const unexpected: string[] = [];
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return route.abort();
        const p = url.pathname;
        const fulfill = (data: unknown) => route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
        if (p === "/health") return fulfill({ status: "ok" });
        if (!p.startsWith("/api/")) return route.continue();
        if (p === "/api/dashboard-auth/session") return fulfill(createDashboardAuthSession());
        if (p === "/api/accounts") return fulfill({ accounts });
        if (p === "/api/dashboard/overview") return fulfill(createDashboardOverview({ accounts }));
        if (p === "/api/settings/telemetry") return fulfill(createTelemetryConsent({ state: "disabled", active: false }));
        if (p === "/api/runtime/version") return fulfill({
          currentVersion: "1.24.0", latestVersion: "1.24.0", updateAvailable: false,
          checkedAt: "2026-01-01T12:00:00Z", releaseUrl: "https://example.invalid/releases",
        });
        if (p === "/api/settings") return fulfill(createDashboardSettings());
        if (p === "/api/settings/upstream-proxy") return fulfill(createUpstreamProxyAdmin());
        const trends = p.match(/^\/api\/accounts\/([^/]+)\/trends$/);
        if (trends) return fulfill(createAccountTrends(trends[1]));
        const credits = p.match(/^\/api\/accounts\/([^/]+)\/usage-reset-credits$/);
        if (credits) return fulfill({ accountId: credits[1], rateLimitResetCredits: { availableCount: 1 } });
        unexpected.push(p);
        return route.abort();
      });
      const port = process.env.SCREENSHOT_PORT ?? "4173";
      await page.goto(`http://127.0.0.1:${port}/accounts`);
      await page.addStyleTag({
        content: "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }",
      });
      const triggers = page.getByRole("button", { name: "View details" });
      const proTrigger = page.locator("article").filter({ hasText: "Demo Pro" }).getByRole("button", { name: "View details" });
      await expect(triggers).toHaveCount(4);
      const cardGrid = page.getByTestId("account-card-grid");
      await expect(cardGrid).toBeVisible();
      const mainWidth = await page.locator("main").evaluate((element) => Math.round(element.getBoundingClientRect().width));
      expect(mainWidth).toBe(width);
      const columnCount = await cardGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
      expect(columnCount).toBe(width >= 1536 ? 4 : width >= 1280 ? 3 : 1);
      await expect(page.locator("article").nth(0).locator('[data-slot="badge"][data-plan="plus"]')).toBeVisible();
      await expect(page.locator("article").nth(1).locator('[data-slot="badge"][data-plan="pro"]')).toBeVisible();
      const overflowingCards = await page.locator("article").evaluateAll((elements) =>
        elements.filter((element) => element.scrollWidth > element.clientWidth).length,
      );
      expect(overflowingCards).toBe(0);
      await expect(page.getByText("30 days", { exact: true })).toBeVisible();
      await expect(page.getByText("3 days", { exact: true })).toBeVisible();
      const primaryCard = page.locator("article").filter({ hasText: "Demo Plus" });
      const weeklyOnlyCard = page.locator("article").filter({ hasText: "Demo Standard" });
      for (const [card, expectedRows] of [[primaryCard, [2, 2, 3]], [weeklyOnlyCard, [2, 2, 2]]] as const) {
        const actionGrid = card.getByRole("button", { name: "View details" }).locator("..");
        const rows = await actionGrid.evaluate((element) => {
          const counts = new Map<number, number>();
          for (const button of element.querySelectorAll(":scope > button")) {
            const rect = button.getBoundingClientRect();
            const y = Math.round(rect.y);
            counts.set(y, (counts.get(y) ?? 0) + 1);
          }
          return Array.from(counts.values());
        });
        expect(rows).toEqual(expectedRows);
        expect(await actionGrid.locator(":scope > button").evaluateAll((buttons) =>
          buttons.every((button) => button.scrollWidth <= button.clientWidth),
        )).toBe(true);
      }
      await expect(weeklyOnlyCard.getByTestId("account-card-quota-placeholder-primary")).toBeHidden();
      await expect(weeklyOnlyCard.getByTestId("account-card-expiry")).toBeVisible();
      const primaryCardBox = await primaryCard.boundingBox();
      const weeklyOnlyCardBox = await weeklyOnlyCard.boundingBox();
      const primaryExpiry = await primaryCard.getByTestId("account-card-expiry").boundingBox();
      const weeklyOnlyExpiry = await weeklyOnlyCard.getByTestId("account-card-expiry").boundingBox();
      expect(primaryCardBox).not.toBeNull();
      expect(weeklyOnlyCardBox).not.toBeNull();
      expect(primaryExpiry).not.toBeNull();
      expect(weeklyOnlyExpiry).not.toBeNull();
      expect(Math.abs((primaryExpiry!.y - primaryCardBox!.y) - (weeklyOnlyExpiry!.y - weeklyOnlyCardBox!.y))).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath("cards.png"), fullPage: true });
      await triggers.first().click();
      const dialog = page.getByRole("dialog", { name: "Account details" });
      await expect(dialog.getByRole("heading", { name: "Demo Plus" })).toBeVisible();
      await expect(dialog.locator('[data-slot="badge"][data-plan="plus"]')).toBeVisible();
      await expect(dialog.getByText("30 days", { exact: true })).toBeVisible();
      await expect(dialog.locator("time").first()).toHaveAttribute("datetime", "2026-01-31T12:00:00Z");
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      const rect = await dialog.boundingBox();
      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
      expect(rect!.height).toBeLessThanOrEqual(810);
      await page.screenshot({ path: testInfo.outputPath("modal.png") });
      await dialog.getByRole("button", { name: "Reset usage", exact: true }).click();
      const confirm = page.getByRole("alertdialog", { name: "Reset usage" });
      await expect(confirm).toBeVisible();
      await confirm.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(triggers.first()).toBeFocused();
      await proTrigger.click();
      await expect(dialog.getByRole("heading", { name: "Demo Pro" })).toBeVisible();
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(proTrigger).toBeFocused();
      await page.goto(`http://127.0.0.1:${port}/settings`);
      await expect(page.locator("main")).toBeVisible();
      const cappedRouteWidth = await page.locator("main").evaluate((element) => Math.round(element.getBoundingClientRect().width));
      expect(cappedRouteWidth).toBe(Math.min(width, 1500));
      expect(errors).toEqual([]);
      expect(unexpected).toEqual([]);
    });
  }
}
