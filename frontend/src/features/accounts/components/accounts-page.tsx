import { Suspense, lazy, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { AlertMessage } from "@/components/alert-message";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { Checkbox } from "@/components/ui/checkbox";
import { useDialogState } from "@/hooks/use-dialog-state";
import { AccountDetail, type AccountDetailProps } from "@/features/accounts/components/account-detail";
import { AccountDetailDialog } from "@/features/accounts/components/account-detail-dialog";
import { AccountCard } from "@/features/accounts/components/account-card";
import { AccountList } from "@/features/accounts/components/account-list";
import { AccountsSkeleton } from "@/features/accounts/components/accounts-skeleton";
import { ImportDialog } from "@/features/accounts/components/import-dialog";
import { ResetCreditConfirmDialog } from "@/features/accounts/components/reset-credit-confirm-dialog";
import { AuthExportDialog } from "@/features/accounts/components/auth-export-dialog";
import {
  useAccounts,
  useAccountUsageResetCredits,
} from "@/features/accounts/hooks/use-accounts";
import {
  DEFAULT_ACCOUNT_SORT_MODE,
  sortAccountsForDisplay,
  type AccountSortMode,
} from "@/features/accounts/sorting";
import { useOauth } from "@/features/accounts/hooks/use-oauth";
import { useSettings, useUpstreamProxyAdmin } from "@/features/settings/hooks/use-settings";
import { useAccountQuotaDisplayStore } from "@/hooks/use-account-quota-display";
import type { AccountAuthExportResponse, AccountSummary } from "@/features/accounts/schemas";
import { useAuthStore } from "@/features/auth/hooks/use-auth";
import { getErrorMessageOrNull } from "@/utils/errors";

const OauthDialog = lazy(() =>
  import("@/features/accounts/components/oauth-dialog").then((m) => ({
    default: m.OauthDialog,
  })),
);

export function AccountsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accountSortMode, setAccountSortMode] = useState<AccountSortMode>(DEFAULT_ACCOUNT_SORT_MODE);
  const [accountViewMode, setAccountViewMode] = useState<"list" | "cards">("cards");
  const [oauthAccountId, setOauthAccountId] = useState<string | null>(null);
  const [detailAccountId, setDetailAccountId] = useState<string | null>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const accountsPageTitle = useRef<HTMLHeadingElement | null>(null);
  const {
    accountsQuery,
    importMutation,
    credentialLoginMutation,
    pauseMutation,
    resumeMutation,
    setAliasMutation,
    probeMutation,
    usageResetMutation,
    limitWarmupMutation,
    updateMutation,
    deleteMutation,
    routingPolicyMutation,
    exportAuthMutation,
  } = useAccounts();
  const { settingsQuery } = useSettings();
  const { upstreamProxyQuery, accountBindingMutation, testEndpointMutation } = useUpstreamProxyAdmin();
  const oauth = useOauth();
  const canWrite = useAuthStore((state) => state.canWrite);

  const importDialog = useDialogState();
  const autoLoginDialog = useDialogState();
  const oauthDialog = useDialogState();
  const deleteDialog = useDialogState<string>();
  type ResetCreditDialogTarget = { accountId: string; availableResetCredits: number };
  const resetCreditDialog = useDialogState<ResetCreditDialogTarget>();
  const usageResetDialog = useDialogState<string>();
  const exportDialog = useDialogState<AccountAuthExportResponse>();
  const [deleteHistory, setDeleteHistory] = useState(false);

  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const showResetCreditBadges = settingsQuery.data?.showResetCreditBadges ?? true;
  const showResetCreditExpiryBadge = settingsQuery.data?.showResetCreditExpiryBadge ?? true;
  const quotaDisplay = useAccountQuotaDisplayStore((s) => s.quotaDisplay);
  const sortedAccounts = useMemo(
    () => sortAccountsForDisplay(accounts, quotaDisplay, accountSortMode),
    [accounts, quotaDisplay, accountSortMode],
  );
  const selectedAccountId = searchParams.get("selected");

  const handleSelectAccount = useCallback(
    (accountId: string) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set("selected", accountId);
      setSearchParams(nextSearchParams);
    },
    [searchParams, setSearchParams],
  );

  const resolvedSelectedAccountId = useMemo(() => {
    if (accounts.length === 0) {
      return null;
    }
    if (
      selectedAccountId &&
      accounts.some((account) => account.accountId === selectedAccountId)
    ) {
      return selectedAccountId;
    }
    return sortedAccounts[0]?.accountId ?? null;
  }, [accounts, selectedAccountId, sortedAccounts]);

  const selectedAccount = useMemo(
    () =>
      resolvedSelectedAccountId
        ? (accounts.find(
            (account) => account.accountId === resolvedSelectedAccountId,
          ) ?? null)
        : null,
    [accounts, resolvedSelectedAccountId],
  );
  const detailAccount = useMemo(
    () => (detailAccountId ? accounts.find((account) => account.accountId === detailAccountId) ?? null : null),
    [accounts, detailAccountId],
  );
  if (detailAccountId && !detailAccount) {
    setDetailAccountId(null);
  }
  const resetCreditsQuery = useAccountUsageResetCredits((detailAccount ?? selectedAccount)?.accountId ?? null);

  const mutationBusy =
    importMutation.isPending ||
    credentialLoginMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    setAliasMutation.isPending ||
    probeMutation.isPending ||
    usageResetMutation.isPending ||
    limitWarmupMutation.isPending ||
    deleteMutation.isPending ||
    routingPolicyMutation.isPending ||
    exportAuthMutation.isPending ||
    updateMutation.isPending ||
    accountBindingMutation.isPending ||
    testEndpointMutation.isPending;

  const mutationError =
    getErrorMessageOrNull(importMutation.error) ||
    getErrorMessageOrNull(credentialLoginMutation.error) ||
    getErrorMessageOrNull(pauseMutation.error) ||
    getErrorMessageOrNull(resumeMutation.error) ||
    getErrorMessageOrNull(setAliasMutation.error) ||
    getErrorMessageOrNull(probeMutation.error) ||
    getErrorMessageOrNull(usageResetMutation.error) ||
    getErrorMessageOrNull(limitWarmupMutation.error) ||
    getErrorMessageOrNull(deleteMutation.error) ||
    getErrorMessageOrNull(routingPolicyMutation.error) ||
    getErrorMessageOrNull(exportAuthMutation.error) ||
    getErrorMessageOrNull(updateMutation.error) ||
    getErrorMessageOrNull(settingsQuery.error) ||
    getErrorMessageOrNull(upstreamProxyQuery.error) ||
    getErrorMessageOrNull(accountBindingMutation.error) ||
    getErrorMessageOrNull(testEndpointMutation.error);

  const getDetailProps = (account: AccountSummary | null): AccountDetailProps => ({
    account,
    showAccountId: account?.isEmailDuplicate === true,
    busy: mutationBusy,
    readOnly: !canWrite,
    onPause: (accountId) => void pauseMutation.mutateAsync(accountId),
    onResume: (accountId) => void resumeMutation.mutateAsync(accountId),
    onProbe: (accountId) => void probeMutation.mutateAsync({ accountId }),
    onResetUsage: (accountId) => usageResetDialog.show(accountId),
    onSetAlias: (accountId, alias) => setAliasMutation.mutateAsync({ accountId, alias }),
    onDelete: (accountId) => deleteDialog.show(accountId),
    onReauth: () => {
      setOauthAccountId(account?.accountId ?? null);
      oauthDialog.show();
    },
    onExportAuth: (accountId) => {
      void exportAuthMutation.mutateAsync(accountId).then((result) => exportDialog.show(result)).catch(() => null);
    },
    onResetCredit: (accountId) => {
      const account = accounts.find((item) => item.accountId === accountId);
      resetCreditDialog.show({ accountId, availableResetCredits: account?.availableResetCredits ?? 0 });
    },
    showResetCreditExpiryBadge,
    onLimitWarmupChange: (accountId, enabled) => void limitWarmupMutation.mutateAsync({ accountId, enabled }),
    onRoutingPolicyChange: (accountId, routingPolicy) => void routingPolicyMutation.mutateAsync({ accountId, routingPolicy }),
    onSecurityWorkAuthorizedChange: (accountId, enabled) => void updateMutation.mutateAsync({ accountId, payload: { securityWorkAuthorized: enabled } }),
    onSubscriptionExpiryChange: (accountId, subscriptionExpiresAt) => void updateMutation.mutateAsync({ accountId, payload: { subscriptionExpiresAt } }),
    upstreamProxyAdmin: upstreamProxyQuery.data ?? null,
    onProxyBindingSave: (accountId, payload) => accountBindingMutation.mutateAsync({ accountId, payload }),
    onProxyEndpointTest: (endpointId) => testEndpointMutation.mutateAsync(endpointId),
    resetCredits: account ? (resetCreditsQuery.data?.rateLimitResetCredits ?? null) : null,
    resetCreditsLoading: account ? resetCreditsQuery.isFetching : false,
    resetCreditsUnavailable: account ? !!resetCreditsQuery.error : false,
  });

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page header */}
      <div>
        <h1 ref={accountsPageTitle} tabIndex={-1} className="text-2xl font-semibold tracking-tight">{t("accounts.page.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("accounts.page.subtitle")}
        </p>
      </div>

      {mutationError ? (
        <AlertMessage variant="error">{mutationError}</AlertMessage>
      ) : null}

      {!accountsQuery.data ? (
        <AccountsSkeleton />
      ) : (
        <div
          data-testid="accounts-layout"
          className={accountViewMode === "cards" ? "min-w-0" : "grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]"}
        >
          <div
            data-testid="accounts-list-panel"
            className={accountViewMode === "cards" ? "min-w-0" : "min-w-0 min-h-0 self-start"}
          >
            <div
              data-testid="accounts-list-card"
              className="flex min-h-0 min-w-0 flex-col rounded-xl border bg-card p-3 sm:p-4"
            >
              <AccountList
                accounts={accounts}
                selectedAccountId={resolvedSelectedAccountId}
                onSelect={handleSelectAccount}
                sortMode={accountSortMode}
                onSortModeChange={setAccountSortMode}
                viewMode={accountViewMode}
                onViewModeChange={setAccountViewMode}
                renderAccountCard={(account) => (
                  <AccountCard
                    key={account.accountId}
                    account={account}
                    selected={account.accountId === resolvedSelectedAccountId}
                    showAccountId={account.isEmailDuplicate === true}
                    onSelect={(accountId, trigger) => {
                      detailTrigger.current = trigger;
                      handleSelectAccount(accountId);
                      setDetailAccountId(accountId);
                    }}
                    busy={mutationBusy}
                    readOnly={!canWrite}
                    onPause={(accountId) => void pauseMutation.mutateAsync(accountId)}
                    onResume={(accountId) => void resumeMutation.mutateAsync(accountId)}
                    onProbe={(accountId) => void probeMutation.mutateAsync({ accountId })}
                    onDelete={(accountId) => deleteDialog.show(accountId)}
                    onReauth={() => {
                      setOauthAccountId(account.accountId);
                      oauthDialog.show();
                    }}
                    onExportAuth={(accountId) => {
                      void exportAuthMutation.mutateAsync(accountId).then((result) => exportDialog.show(result)).catch(() => null);
                    }}
                    onResetCredit={(accountId) => {
                      const target = accounts.find((item) => item.accountId === accountId);
                      resetCreditDialog.show({ accountId, availableResetCredits: target?.availableResetCredits ?? 0 });
                    }}
                    showResetCreditExpiryBadge={showResetCreditExpiryBadge}
                    onLimitWarmupChange={(accountId, enabled) => void limitWarmupMutation.mutateAsync({ accountId, enabled })}
                    onRoutingPolicyChange={(accountId, routingPolicy) => void routingPolicyMutation.mutateAsync({ accountId, routingPolicy })}
                    onSecurityWorkAuthorizedChange={(accountId, enabled) => void updateMutation.mutateAsync({ accountId, payload: { securityWorkAuthorized: enabled } })}
                  />
                )}
                showResetCreditBadges={showResetCreditBadges}
                onOpenImport={() => importDialog.show()}
                onOpenAutoLogin={() => autoLoginDialog.show()}
                onOpenOauth={() => {
                  setOauthAccountId(null);
                  oauthDialog.show();
                }}
                readOnly={!canWrite}
              />
            </div>
          </div>

          {accountViewMode === "list" ? <AccountDetail {...getDetailProps(selectedAccount)} /> : null}
        </div>
      )}

      <AccountDetailDialog
        open={detailAccount !== null}
        onOpenChange={(open) => {
          if (!open) setDetailAccountId(null);
        }}
        detail={getDetailProps(detailAccount)}
        error={mutationError}
        onCloseAutoFocus={(event) => {
          if (detailTrigger.current?.isConnected) {
            event.preventDefault();
            detailTrigger.current.focus();
          } else if (accountsPageTitle.current?.isConnected) {
            event.preventDefault();
            accountsPageTitle.current.focus();
          }
        }}
      />

      <ImportDialog
        open={importDialog.open}
        busy={mutationBusy}
        error={mutationError}
        onOpenChange={importDialog.onOpenChange}
        onImport={async (file) => {
          await importMutation.mutateAsync(file);
        }}
        onCredentialLogin={(text) => credentialLoginMutation.mutateAsync(text)}
      />

      <ImportDialog
        open={autoLoginDialog.open}
        mode="credential"
        busy={mutationBusy}
        error={mutationError}
        onOpenChange={autoLoginDialog.onOpenChange}
        onImport={async () => undefined}
        onCredentialLogin={(text) => credentialLoginMutation.mutateAsync(text)}
      />

      <Suspense fallback={null}>
        <OauthDialog
          open={oauthDialog.open}
          state={oauth.state}
          onOpenChange={(open) => {
            oauthDialog.onOpenChange(open);
            if (!open) {
              setOauthAccountId(null);
            }
          }}
          onStart={async (method) => {
            await oauth.start(method, oauthAccountId ?? undefined);
          }}
          onComplete={async () => {
            await accountsQuery.refetch();
          }}
          onManualCallback={async (callbackUrl) => {
            await oauth.manualCallback(callbackUrl);
          }}
          onReset={oauth.reset}
        />
      </Suspense>

      <AuthExportDialog
        open={exportDialog.open}
        exportData={exportDialog.data}
        onOpenChange={exportDialog.onOpenChange}
      />

      {resetCreditDialog.data ? (
        <ResetCreditConfirmDialog
          open={resetCreditDialog.open}
          accountId={resetCreditDialog.data.accountId}
          summaryAvailableCount={resetCreditDialog.data.availableResetCredits}
          onOpenChange={resetCreditDialog.onOpenChange}
        />
      ) : null}

      <ConfirmDialog
        open={deleteDialog.open}
        title={t("accounts.deleteDialog.title")}
        description={t("accounts.deleteDialog.description")}
        confirmLabel={t("common.actions.delete")}
        cancelLabel={t("common.cancel")}
        onOpenChange={(open) => {
          deleteDialog.onOpenChange(open);
          if (!open) setDeleteHistory(false);
        }}
        onConfirm={() => {
          if (!deleteDialog.data) {
            return;
          }
          void deleteMutation
            .mutateAsync({ accountId: deleteDialog.data, deleteHistory })
            .finally(() => {
              deleteDialog.hide();
              setDeleteHistory(false);
            });
        }}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id="delete-history"
            checked={deleteHistory}
            onCheckedChange={(checked) => setDeleteHistory(checked === true)}
          />
          <label
            htmlFor="delete-history"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            {t("accounts.deleteDialog.deleteHistory")}
          </label>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={usageResetDialog.open}
        title={t("accounts.usageResetDialog.title")}
        description={t("accounts.usageResetDialog.description")}
        confirmLabel={t("common.actions.reset")}
        cancelLabel={t("common.cancel")}
        onOpenChange={usageResetDialog.onOpenChange}
        onConfirm={() => {
          if (!usageResetDialog.data) {
            return;
          }
          void usageResetMutation
            .mutateAsync({ accountId: usageResetDialog.data })
            .finally(() => {
              usageResetDialog.hide();
            });
        }}
      />

      <LoadingOverlay
        visible={!!accountsQuery.data && mutationBusy}
        label={t("accounts.page.updating")}
      />
    </div>
  );
}
