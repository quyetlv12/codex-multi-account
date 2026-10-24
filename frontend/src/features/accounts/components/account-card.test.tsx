import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";

import { usePrivacyStore } from "@/hooks/use-privacy";
import { copyToClipboard } from "@/utils/clipboard";
import { AccountCard } from "@/features/accounts/components/account-card";
import { createAccountSummary } from "@/test/mocks/factories";

vi.mock("@/utils/clipboard", () => ({ copyToClipboard: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("AccountCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(copyToClipboard).mockResolvedValue(true);
  });

  afterEach(() => usePrivacyStore.setState({ blurred: false }));

  const renderCopyCard = (account = createAccountSummary()) => {
    const onSelect = vi.fn();
    render(
      <AccountCard
        account={account} selected={false} busy={false} readOnly
        onSelect={onSelect} onPause={vi.fn()} onResume={vi.fn()}
        onProbe={vi.fn()} onDelete={vi.fn()} onReauth={vi.fn()}
        onExportAuth={vi.fn()} onResetCredit={vi.fn()}
        onSecurityWorkAuthorizedChange={vi.fn()} onLimitWarmupChange={vi.fn()}
        onRoutingPolicyChange={vi.fn()}
      />,
    );
    return onSelect;
  };

  it.each([
    { alias: "Tên tài khoản đầy đủ", displayName: "Display", expected: "Tên tài khoản đầy đủ" },
    { alias: null, displayName: "Display", expected: "Display" },
    { alias: null, displayName: "", expected: "copy@example.invalid" },
  ])("copies the full displayed title: $expected", async ({ alias, displayName, expected }) => {
    const user = userEvent.setup();
    usePrivacyStore.setState({ blurred: true });
    const onSelect = renderCopyCard(createAccountSummary({ alias, displayName, email: "copy@example.invalid" }));
    await user.click(screen.getByRole("button", { name: `Copy ${expected}` }));
    expect(copyToClipboard).toHaveBeenCalledExactlyOnceWith(expected);
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it.each(["{Enter}", " "])("copies the title using keyboard %s", async (key) => {
    const user = userEvent.setup();
    const onSelect = renderCopyCard(createAccountSummary({ alias: "Keyboard title" }));
    const button = screen.getByRole("button", { name: "Copy Keyboard title" });
    button.focus();
    await user.keyboard(key);
    expect(copyToClipboard).toHaveBeenCalledExactlyOnceWith("Keyboard title");
    expect(onSelect).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
  });

  it.each([false, "throws"])("reports copy failure without opening details: %s", async (result) => {
    const user = userEvent.setup();
    if (result === false) vi.mocked(copyToClipboard).mockResolvedValue(false);
    else vi.mocked(copyToClipboard).mockRejectedValue(new Error("Clipboard blocked"));
    const onSelect = renderCopyCard(createAccountSummary({ alias: "Failure title" }));
    await user.click(screen.getByRole("button", { name: "Copy Failure title" }));
    expect(toast.error).toHaveBeenCalledWith("Failed to copy");
    expect(toast.success).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps the plan badge beside an accessible icon-only status badge", () => {
    const account = createAccountSummary({ planType: "plus", status: "active" });

    render(
      <AccountCard
        account={account}
        selected={false}
        busy={false}
        readOnly
        onSelect={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onProbe={vi.fn()}
        onDelete={vi.fn()}
        onReauth={vi.fn()}
        onExportAuth={vi.fn()}
        onResetCredit={vi.fn()}
        onSecurityWorkAuthorizedChange={vi.fn()}
        onLimitWarmupChange={vi.fn()}
        onRoutingPolicyChange={vi.fn()}
      />,
    );

    const badges = screen.getByTestId("account-card-badges");
    expect(badges).toHaveTextContent("Plus");
    expect(within(badges).getByRole("img", { name: "Active" })).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("reserves the 5h quota slot when only another quota window is available", () => {
    const account = createAccountSummary({
      usage: {
        primaryRemainingPercent: null,
        secondaryRemainingPercent: 67,
        monthlyRemainingPercent: null,
      },
      resetAtPrimary: null,
      windowMinutesPrimary: null,
    });

    render(
      <AccountCard
        account={account}
        selected={false}
        busy={false}
        readOnly
        onSelect={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onProbe={vi.fn()}
        onDelete={vi.fn()}
        onReauth={vi.fn()}
        onExportAuth={vi.fn()}
        onResetCredit={vi.fn()}
        onSecurityWorkAuthorizedChange={vi.fn()}
        onLimitWarmupChange={vi.fn()}
        onRoutingPolicyChange={vi.fn()}
      />,
    );

    const placeholder = screen.getByTestId("account-card-quota-placeholder-primary");
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder).toHaveClass("invisible");
    expect(screen.getByTestId("account-card-quota").children).toHaveLength(2);
  });

  it("keeps a quota-less account's expiry below the reserved 5h slot", () => {
    const account = createAccountSummary({
      usage: {
        primaryRemainingPercent: null,
        secondaryRemainingPercent: null,
        monthlyRemainingPercent: null,
      },
      resetAtPrimary: null,
      resetAtSecondary: null,
      resetAtMonthly: null,
      windowMinutesPrimary: null,
      windowMinutesSecondary: null,
      windowMinutesMonthly: null,
    });

    render(
      <AccountCard
        account={account}
        selected={false}
        busy={false}
        readOnly
        onSelect={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onProbe={vi.fn()}
        onDelete={vi.fn()}
        onReauth={vi.fn()}
        onExportAuth={vi.fn()}
        onResetCredit={vi.fn()}
        onSecurityWorkAuthorizedChange={vi.fn()}
        onLimitWarmupChange={vi.fn()}
        onRoutingPolicyChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-card-quota-placeholder-primary")).toBeInTheDocument();
    expect(screen.getByTestId("account-card-quota").children).toHaveLength(1);
    expect(screen.getByTestId("account-card-expiry")).toBeVisible();
  });

  it("opens details for the selected account without invoking account actions", async () => {
    const user = userEvent.setup();
    const account = createAccountSummary();
    const onSelect = vi.fn();
    const onPause = vi.fn();
    const onDelete = vi.fn();

    render(
      <AccountCard
        account={account}
        selected={false}
        busy={false}
        readOnly
        onSelect={onSelect}
        onPause={onPause}
        onResume={vi.fn()}
        onProbe={vi.fn()}
        onDelete={onDelete}
        onReauth={vi.fn()}
        onExportAuth={vi.fn()}
        onResetCredit={vi.fn()}
        onSecurityWorkAuthorizedChange={vi.fn()}
        onLimitWarmupChange={vi.fn()}
        onRoutingPolicyChange={vi.fn()}
      />,
    );

    const details = screen.getByRole("button", { name: "View details" });
    expect(details.textContent).toBe("");
    expect(details).toHaveAttribute("title", "View details");
    expect(details.parentElement).toBe(screen.getByRole("button", { name: "Delete" }).parentElement);
    await user.click(details);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(account.accountId, screen.getByRole("button", { name: "View details" }));
    expect(onPause).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
  });
});
