import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SubscriptionExpirySummary } from "@/features/accounts/components/subscription-expiry-summary";
import { useDateDisplayFormatStore } from "@/hooks/use-date-format";
import { useTimeFormatStore } from "@/hooks/use-time-format";

const NOW = new Date("2026-01-01T12:00:00Z").getTime();

describe("SubscriptionExpirySummary", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    useDateDisplayFormatStore.setState({ dateDisplayFormat: "default" });
    useTimeFormatStore.setState({ timeFormat: "12h" });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it.each([
    ["2026-01-31T12:00:00Z", "30 days"],
    ["2026-01-03T12:01:00Z", "3 days"],
    ["2026-01-02T12:00:00Z", "1 day"],
    ["2026-01-02T11:59:59Z", "Less than 1 day"],
    ["2026-01-01T12:00:00Z", "Expired"],
    ["2025-12-31T12:00:00Z", "Expired"],
    ["2026-01-31T19:00:00+07:00", "30 days"],
  ])("shows %s as %s", (value, expected) => {
    const { container } = render(<SubscriptionExpirySummary value={value} />);
    expect(screen.getByText(expected)).toBeVisible();
    expect(container.querySelector("time")).toHaveAttribute("dateTime", value);
  });

  it.each([null, "invalid date"])("keeps unknown expiry %s without a countdown or timestamp", (value) => {
    const { container } = render(<SubscriptionExpirySummary value={value} />);
    expect(screen.getByText("No plan expiry date")).toBeVisible();
    expect(container.querySelector("time")).toBeNull();
    expect(container.querySelector("strong")).toBeNull();
  });

  it("updates the timestamp when date and time display preferences change", () => {
    const { container } = render(<SubscriptionExpirySummary value="2026-01-31T12:00:00Z" />);
    const before = container.querySelector("time")!.textContent;
    act(() => {
      useDateDisplayFormatStore.setState({ dateDisplayFormat: "iso8601" });
      useTimeFormatStore.setState({ timeFormat: "24h" });
    });
    expect(container.querySelector("time")!.textContent).not.toBe(before);
    expect(screen.getByText("30 days")).toBeVisible();
  });

  it("updates an elapsed countdown while the dashboard stays open", () => {
    vi.mocked(Date.now).mockRestore();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    render(<SubscriptionExpirySummary value="2026-01-01T12:00:30Z" />);
    expect(screen.getByText("Less than 1 day")).toBeVisible();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByText("Expired")).toBeVisible();
  });
});
