import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import { PlanBadge } from "@/components/plan-badge";
import { MiniQuotaBar } from "@/components/mini-quota-bar";
import { isEmailLabel } from "@/components/blur-email";
import { Button } from "@/components/ui/button";
import { AccountActions, type AccountActionsProps } from "@/features/accounts/components/account-actions";
import { SubscriptionExpirySummary } from "@/features/accounts/components/subscription-expiry-summary";
import type { AccountSummary } from "@/features/accounts/schemas";
import { usePrivacyStore } from "@/hooks/use-privacy";
import { formatPercentNullable, formatQuotaResetLabel, formatSlug } from "@/utils/formatters";
import { normalizeStatus, type DashboardAccountStatus } from "@/utils/account-status";
import { copyToClipboard } from "@/utils/clipboard";

const statusBorderClassMap: Record<DashboardAccountStatus, string> = {
  active: "border-emerald-500/50 ring-emerald-500/25",
  paused: "border-amber-500/50 ring-amber-500/25",
  limited: "border-orange-500/50 ring-orange-500/25",
  exceeded: "border-red-500/50 ring-red-500/25",
  reauth: "border-sky-500/50 ring-sky-500/25",
  deactivated: "border-zinc-500/50 ring-zinc-500/25",
};

type AccountCardProps = AccountActionsProps & {
  account: AccountSummary;
  selected: boolean;
  showAccountId?: boolean;
  onSelect: (accountId: string, trigger: HTMLButtonElement) => void;
};

export function AccountCard({ account, selected, showAccountId = false, onSelect, ...actions }: AccountCardProps) {
  const { t } = useTranslation();
  const blurred = usePrivacyStore((s) => s.blurred);
  const status = normalizeStatus(account.status);
  const title = account.alias || account.displayName || account.email;
  const titleIsEmail = isEmailLabel(title, account.email);
  const copyTitle = async () => {
    try {
      if (await copyToClipboard(title)) {
        toast.success(t("components.copyButton.toasts.copied"));
      } else {
        toast.error(t("components.copyButton.toasts.failed"));
      }
    } catch {
      toast.error(t("components.copyButton.toasts.failed"));
    }
  };
  const accountMeta = [account.seatType ? formatSlug(account.seatType) : null, showAccountId ? account.accountId.slice(0, 8) : null]
    .filter((value): value is string => value !== null)
    .join(" · ");
  const hasPrimaryQuota =
    account.windowMinutesPrimary != null ||
    account.usage?.primaryRemainingPercent != null ||
    account.resetAtPrimary != null;
  const rows = [
    ...(hasPrimaryQuota
      ? [{ label: "5h", value: account.usage?.primaryRemainingPercent ?? null, resetAt: account.resetAtPrimary }]
      : []),
    ...(account.windowMinutesSecondary != null || account.usage?.secondaryRemainingPercent != null || account.resetAtSecondary != null
      ? [{ label: t("common.quota.weekly"), value: account.usage?.secondaryRemainingPercent ?? null, resetAt: account.resetAtSecondary }]
      : []),
    ...(account.windowMinutesMonthly != null || account.usage?.monthlyRemainingPercent != null || account.resetAtMonthly != null
      ? [{ label: t("common.quota.monthly"), value: account.usage?.monthlyRemainingPercent ?? null, resetAt: account.resetAtMonthly }]
      : []),
  ];

  return (
    <article className={`flex min-w-0 flex-col rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${statusBorderClassMap[status]} ${selected ? "ring-2" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">
            <button
              type="button"
              className="block max-w-full cursor-copy truncate rounded-sm text-left transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`${t("components.copyButton.copy")} ${title}`}
              title={t("components.copyButton.copy")}
              onClick={() => void copyTitle()}
            >
              {titleIsEmail && blurred ? <span className="privacy-blur">{title}</span> : title}
            </button>
          </h3>
          {accountMeta ? (
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{accountMeta}</span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5" data-testid="account-card-badges">
          <PlanBadge planType={account.planType} />
          <StatusBadge status={status} iconOnly />
        </div>
      </div>

      <div className="mt-4 space-y-3" data-testid="account-card-quota">
        {!hasPrimaryQuota ? (
          <div
            aria-hidden="true"
            data-testid="account-card-quota-placeholder-primary"
            className="invisible space-y-1"
          >
            <div className="flex items-center justify-between text-xs">
              <span>5h</span>
              <span className="font-medium tabular-nums">0%</span>
            </div>
            <MiniQuotaBar
              aria-label={t("accounts.listItem.quotaRemainingAria", { label: "5h" })}
              percent={null}
              testId="account-card-quota-placeholder-primary-bar"
            />
            <div className="text-[10px]">{formatQuotaResetLabel(null)}</div>
          </div>
        ) : null}
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">{formatPercentNullable(row.value)}</span>
            </div>
            <MiniQuotaBar aria-label={t("accounts.listItem.quotaRemainingAria", { label: row.label })} percent={row.value} testId={`account-card-quota-${row.label.toLowerCase()}`} />
            <div className="text-[10px] text-muted-foreground">
              {formatQuotaResetLabel(row.resetAt ?? null)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4" data-testid="account-card-expiry">
        <SubscriptionExpirySummary value={account.subscriptionExpiresAt ?? null} />
      </div>

      <div className="mt-auto pt-4">
        <AccountActions {...actions} account={account}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 w-full text-sm font-bold"
            aria-label={t("accounts.card.viewDetails")}
            title={t("accounts.card.viewDetails")}
            aria-haspopup="dialog"
            onClick={(event) => onSelect(account.accountId, event.currentTarget)}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        </AccountActions>
      </div>
    </article>
  );
}
