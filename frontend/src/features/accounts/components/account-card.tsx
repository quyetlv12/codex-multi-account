import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { normalizeStatus } from "@/utils/account-status";

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
  const accountMeta = [account.seatType ? formatSlug(account.seatType) : null, showAccountId ? account.accountId.slice(0, 8) : null]
    .filter((value): value is string => value !== null)
    .join(" · ");
  const rows = [
    ...(account.windowMinutesPrimary != null || account.usage?.primaryRemainingPercent != null || account.resetAtPrimary != null
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
    <article className={`flex min-w-0 flex-col rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${selected ? "ring-2 ring-primary/30" : ""}`}>
      <button type="button" className="min-w-0 text-left" aria-haspopup="dialog" onClick={(event) => onSelect(account.accountId, event.currentTarget)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">
              {titleIsEmail && blurred ? <span className="privacy-blur">{title}</span> : title}
            </h3>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <PlanBadge planType={account.planType} />
              {accountMeta ? (
                <span className="truncate">· {accountMeta}</span>
              ) : null}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </button>

      <div className="mt-4 space-y-3">
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

      <div className="mt-4">
        <SubscriptionExpirySummary value={account.subscriptionExpiresAt ?? null} />
      </div>

      <div className="mt-auto pt-4">
        <Button
          type="button"
          variant="outline"
          className="mb-3 h-9 w-full gap-2 text-xs font-medium"
          aria-haspopup="dialog" onClick={(event) => onSelect(account.accountId, event.currentTarget)}
        >
          <Eye className="h-3.5 w-3.5" />
          {t("accounts.card.viewDetails")}
        </Button>
        <AccountActions {...actions} account={account} />
      </div>
    </article>
  );
}
