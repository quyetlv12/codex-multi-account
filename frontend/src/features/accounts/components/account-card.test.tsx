import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AccountCard } from "@/features/accounts/components/account-card";
import { createAccountSummary } from "@/test/mocks/factories";

describe("AccountCard", () => {
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

    await user.click(screen.getByRole("button", { name: "View details" }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(account.accountId, screen.getByRole("button", { name: "View details" }));
    expect(onPause).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
  });
});
