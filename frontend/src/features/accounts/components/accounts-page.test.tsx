import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { AccountsPage } from "@/features/accounts/components/accounts-page";
import { useAccountQuotaDisplayStore } from "@/hooks/use-account-quota-display";
import { useAuthStore } from "@/features/auth/hooks/use-auth";
import type { AccountSummary } from "@/features/accounts/schemas";

vi.mock("@/features/accounts/hooks/use-accounts", () => ({
  useAccounts: vi.fn(),
  useAccountTrends: vi.fn(() => ({ data: null })),
  useAccountUsageResetCredits: vi.fn(() => ({
    data: { rateLimitResetCredits: { availableCount: 3 } },
    isFetching: false,
    error: null,
  })),
}));

vi.mock("@/features/accounts/hooks/use-oauth", () => ({
  useOauth: vi.fn(() => ({
    state: {
      status: "idle",
      method: null,
      authorizationUrl: null,
      callbackUrl: null,
      verificationUrl: null,
      userCode: null,
      deviceAuthId: null,
      intervalSeconds: null,
      expiresInSeconds: null,
      errorMessage: null,
    },
    start: vi.fn(),
    complete: vi.fn(),
    manualCallback: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock("@/features/settings/hooks/use-settings", () => ({
  useSettings: vi.fn(() => ({
    settingsQuery: {
      data: {
        showResetCreditBadges: true,
        showResetCreditExpiryBadge: true,
      },
      error: null,
    },
  })),
  useUpstreamProxyAdmin: vi.fn(() => ({
    upstreamProxyQuery: { data: null, error: null },
    accountBindingMutation: {
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    },
    testEndpointMutation: {
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    },
  })),
}));

const { useAccounts, useAccountUsageResetCredits } = await import("@/features/accounts/hooks/use-accounts");
const mockedUseAccounts = useAccounts as unknown as ReturnType<typeof vi.fn>;

function idleMutation() {
  return {
    isPending: false,
    error: null,
    mutateAsync: vi.fn(),
  };
}

function account(overrides: Partial<AccountSummary>): AccountSummary {
  return {
    accountId: "acc-default",
    email: "default@example.com",
    displayName: "Default",
    planType: "plus",
    status: "active",
    additionalQuotas: [],
    limitWarmupEnabled: false,
    ...overrides,
  };
}

describe("AccountsPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ canWrite: true });
    useAccountQuotaDisplayStore.setState({ quotaDisplay: "weekly" });
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-01-01T12:00:00.000Z").getTime(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to cards and preserves the selected account when switching to list", async () => {
    const user = userEvent.setup();
    mockedUseAccounts.mockReturnValue({
      accountsQuery: {
        data: [
          account({
            accountId: "acc-api-first",
            email: "api-first@example.com",
            displayName: "API First",
            resetAtSecondary: "2026-01-01T13:00:00.000Z",
            windowMinutesSecondary: 10_080,
          }),
          account({
            accountId: "acc-visible-first",
            email: "visible-first@example.com",
            displayName: "Visible First",
            resetAtSecondary: "2026-01-01T12:10:00.000Z",
            windowMinutesSecondary: 10_080,
          }),
        ],
        error: null,
        refetch: vi.fn(),
      },
      importMutation: idleMutation(),
      credentialLoginMutation: idleMutation(),
      pauseMutation: idleMutation(),
      resumeMutation: idleMutation(),
      probeMutation: idleMutation(),
      usageResetMutation: idleMutation(),
      deleteMutation: idleMutation(),
      exportAuthMutation: idleMutation(),
      setAliasMutation: idleMutation(),
      limitWarmupMutation: idleMutation(),
      routingPolicyMutation: idleMutation(),
      updateMutation: idleMutation(),
    } as unknown as ReturnType<typeof useAccounts>);

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    );

    expect(
      screen
        .getAllByText(/^(Visible First|API First)$/)
        .map((el) => el.textContent),
    ).toEqual(["Visible First", "API First"]);
    expect(screen.getAllByRole("button", { name: "View details" })).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "View accounts as a list" }));
    expect(
      screen.getByRole("heading", { name: "Visible First" }),
    ).toBeInTheDocument();
  });

  it("renders account panels with mobile-first responsive containment", async () => {
    const user = userEvent.setup();
    mockedUseAccounts.mockReturnValue({
      accountsQuery: {
        data: [
          account({
            accountId: "acc-long",
            email: "very.long.account.identity.for.mobile@example-enterprise-workspace.invalid",
            displayName: "very.long.account.identity.for.mobile@example-enterprise-workspace.invalid",
          }),
        ],
        error: null,
        refetch: vi.fn(),
      },
      importMutation: idleMutation(),
      credentialLoginMutation: idleMutation(),
      pauseMutation: idleMutation(),
      resumeMutation: idleMutation(),
      probeMutation: idleMutation(),
      usageResetMutation: idleMutation(),
      deleteMutation: idleMutation(),
      exportAuthMutation: idleMutation(),
      setAliasMutation: idleMutation(),
      limitWarmupMutation: idleMutation(),
      routingPolicyMutation: idleMutation(),
      updateMutation: idleMutation(),
    } as unknown as ReturnType<typeof useAccounts>);

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "View accounts as a list" }));
    expect(screen.getByTestId("accounts-layout")).toHaveClass(
      "grid-cols-1",
      "min-w-0",
      "lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]",
    );
    expect(screen.getByTestId("accounts-list-panel")).toHaveClass(
      "min-w-0",
      "min-h-0",
      "self-start",
    );
    expect(screen.getByTestId("accounts-list-panel")).not.toHaveClass("h-full");
    expect(screen.getByTestId("accounts-list-card")).not.toHaveClass("h-full");
    expect(screen.getByRole("heading", { name: /very\.long\.account/i })).toHaveClass(
      "min-w-0",
      "truncate",
    );
  });

  it("keeps helper instructions accessible when no accounts exist", async () => {
    const user = userEvent.setup();

    mockedUseAccounts.mockReturnValue({
      accountsQuery: {
        data: [],
        error: null,
        refetch: vi.fn(),
      },
      importMutation: idleMutation(),
      credentialLoginMutation: idleMutation(),
      pauseMutation: idleMutation(),
      resumeMutation: idleMutation(),
      probeMutation: idleMutation(),
      usageResetMutation: idleMutation(),
      deleteMutation: idleMutation(),
      exportAuthMutation: idleMutation(),
      setAliasMutation: idleMutation(),
      limitWarmupMutation: idleMutation(),
      routingPolicyMutation: idleMutation(),
      updateMutation: idleMutation(),
    } as unknown as ReturnType<typeof useAccounts>);

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Need help?" }));
    expect(screen.getByText("Windows OAuth Help")).toBeInTheDocument();
  });

  it("confirms before resetting selected account usage", async () => {
    const user = userEvent.setup();
    const resetUsage = vi.fn().mockResolvedValue({
      status: "reset",
      accountId: "acc-reset",
      code: "reset",
      windowsReset: 2,
      usageWritten: true,
      primaryUsedPercentBefore: 100,
      primaryUsedPercentAfter: 2,
      secondaryUsedPercentBefore: 80,
      secondaryUsedPercentAfter: 0,
      accountStatusBefore: "rate_limited",
      accountStatusAfter: "active",
    });

    mockedUseAccounts.mockReturnValue({
      accountsQuery: {
        data: [
          account({
            accountId: "acc-reset",
            email: "reset@example.com",
            displayName: "Resettable",
            resetAtSecondary: "2026-01-01T13:00:00.000Z",
            windowMinutesSecondary: 10_080,
          }),
        ],
        error: null,
        refetch: vi.fn(),
      },
      importMutation: idleMutation(),
      credentialLoginMutation: idleMutation(),
      pauseMutation: idleMutation(),
      resumeMutation: idleMutation(),
      probeMutation: idleMutation(),
      usageResetMutation: {
        isPending: false,
        error: null,
        mutateAsync: resetUsage,
      },
      deleteMutation: idleMutation(),
      exportAuthMutation: idleMutation(),
      setAliasMutation: idleMutation(),
      limitWarmupMutation: idleMutation(),
      routingPolicyMutation: idleMutation(),
      updateMutation: idleMutation(),
    } as unknown as ReturnType<typeof useAccounts>);

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "View details" }));
    await user.click(screen.getByRole("button", { name: "Reset usage" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Reset usage" });
    expect(resetUsage).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Reset" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Account details" })).toBeVisible();
    await waitFor(() => {
      expect(resetUsage).toHaveBeenCalledWith({ accountId: "acc-reset" });
    });
  });

  it("keeps force probe as an immediate action", async () => {
    const user = userEvent.setup();
    const probe = vi.fn().mockResolvedValue({
      status: "probed",
      accountId: "acc-probe",
      probeStatusCode: 200,
      primaryUsedPercentBefore: 10,
      primaryUsedPercentAfter: 9,
      secondaryUsedPercentBefore: 20,
      secondaryUsedPercentAfter: 19,
      accountStatusBefore: "active",
      accountStatusAfter: "active",
    });

    mockedUseAccounts.mockReturnValue({
      accountsQuery: {
        data: [
          account({
            accountId: "acc-probe",
            email: "probe@example.com",
            displayName: "Probe account",
            resetAtSecondary: "2026-01-01T13:00:00.000Z",
            windowMinutesSecondary: 10_080,
          }),
        ],
        error: null,
        refetch: vi.fn(),
      },
      importMutation: idleMutation(),
      credentialLoginMutation: idleMutation(),
      pauseMutation: idleMutation(),
      resumeMutation: idleMutation(),
      probeMutation: {
        isPending: false,
        error: null,
        mutateAsync: probe,
      },
      usageResetMutation: idleMutation(),
      deleteMutation: idleMutation(),
      exportAuthMutation: idleMutation(),
      setAliasMutation: idleMutation(),
      limitWarmupMutation: idleMutation(),
      routingPolicyMutation: idleMutation(),
      updateMutation: idleMutation(),
    } as unknown as ReturnType<typeof useAccounts>);

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Force probe" }));

    expect(probe).toHaveBeenCalledWith({ accountId: "acc-probe" });
    expect(screen.queryByRole("alertdialog", { name: "Reset usage" })).not.toBeInTheDocument();
  });

  function mockAccounts(data: AccountSummary[]) {
    const state = {
      accountsQuery: { data, error: null, refetch: vi.fn() },
      importMutation: idleMutation(), credentialLoginMutation: idleMutation(),
      pauseMutation: idleMutation(), resumeMutation: idleMutation(),
      probeMutation: idleMutation(), usageResetMutation: idleMutation(),
      deleteMutation: idleMutation(), exportAuthMutation: idleMutation(),
      setAliasMutation: idleMutation(), limitWarmupMutation: idleMutation(),
      routingPolicyMutation: idleMutation(), updateMutation: idleMutation(),
    };
    mockedUseAccounts.mockReturnValue(state);
    return state;
  }

  it("opens the clicked card in a modal and restores focus after Close and Escape", async () => {
    const user = userEvent.setup();
    mockAccounts([
      account({ accountId: "acc-one", displayName: "First account" }),
      account({ accountId: "acc-two", displayName: "Second account" }),
    ]);
    render(<MemoryRouter><AccountsPage /></MemoryRouter>);
    const trigger = screen.getAllByRole("button", { name: "View details" })[1]!;
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Account details" });
    expect(within(dialog).getByRole("heading", { name: "Second account" })).toBeVisible();
    expect(within(dialog).queryByRole("heading", { name: "First account" })).toBeNull();
    expect(useAccountUsageResetCredits).toHaveBeenLastCalledWith("acc-two");
    // The card and detail switches must have separate label targets.
    const ids = Array.from(document.querySelectorAll('[role="switch"]')).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getAllByRole("button", { name: "View details" })).toHaveLength(2);
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("saves and clears plan expiry on the modal account, preserving its mutation error", async () => {
    const user = userEvent.setup();
    const state = mockAccounts([
      account({ accountId: "acc-one", displayName: "First account" }),
      account({ accountId: "acc-two", displayName: "Second account", subscriptionExpiresAt: "2026-01-31T12:00:00Z" }),
    ]);
    const { rerender } = render(<MemoryRouter><AccountsPage /></MemoryRouter>);
    await user.click(screen.getAllByRole("button", { name: "View details" })[1]!);
    const dialog = screen.getByRole("dialog", { name: "Account details" });
    const field = within(dialog).getByLabelText("Subscription expiry");
    fireEvent.change(field, { target: { value: "2026-02-15" } });
    await user.click(within(dialog).getByRole("button", { name: /^Save$/ }));
    expect(state.updateMutation.mutateAsync).toHaveBeenLastCalledWith({ accountId: "acc-two", payload: { subscriptionExpiresAt: "2026-02-15T23:59:59+00:00" } });
    await user.click(within(dialog).getByRole("button", { name: "Clear" }));
    await user.click(within(dialog).getByRole("button", { name: /^Save$/ }));
    expect(state.updateMutation.mutateAsync).toHaveBeenLastCalledWith({ accountId: "acc-two", payload: { subscriptionExpiresAt: null } });
    mockedUseAccounts.mockReturnValue({ ...state, updateMutation: { ...state.updateMutation, error: new Error("Could not save date") } });
    rerender(<MemoryRouter><AccountsPage /></MemoryRouter>);
    expect(within(dialog).getByText("Could not save date")).toBeVisible();
  });

  it("allows read-only inspection but disables expiry editing", async () => {
    const user = userEvent.setup();
    mockAccounts([account({ subscriptionExpiresAt: "2026-01-31T12:00:00Z" })]);
    useAuthStore.setState({ canWrite: false });
    render(<MemoryRouter><AccountsPage /></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: "View details" }));
    const dialog = screen.getByRole("dialog", { name: "Account details" });
    expect(within(dialog).getByLabelText("Subscription expiry")).toBeDisabled();
    expect(within(dialog).getByText("30 days")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: /^Delete$/ })).toBeDisabled();
  });

  it("closes when the inspected account disappears without showing a different account", async () => {
    const user = userEvent.setup();
    const first = account({ accountId: "acc-one", displayName: "First account" });
    const second = account({ accountId: "acc-two", displayName: "Second account" });
    mockAccounts([first, second]);
    const { rerender } = render(<MemoryRouter><AccountsPage /></MemoryRouter>);
    await user.click(screen.getAllByRole("button", { name: "View details" })[1]!);
    mockAccounts([first]);
    rerender(<MemoryRouter><AccountsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(screen.getByRole("heading", { name: "Accounts" })).toHaveFocus());
    expect(screen.getAllByRole("button", { name: "View details" })).toHaveLength(1);
    mockAccounts([first, second]);
    rerender(<MemoryRouter><AccountsPage /></MemoryRouter>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

});
