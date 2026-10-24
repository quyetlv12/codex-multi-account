import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDateDisplayFormatStore } from "@/hooks/use-date-format";
import { useTimeFormatStore } from "@/hooks/use-time-format";
import { cn } from "@/lib/utils";
import { formatDateTimeInline } from "@/utils/formatters";

const DAY_MS = 86_400_000;

export function SubscriptionExpirySummary({ value }: { value: string | null }) {
  const { t } = useTranslation();
  const dateFormat = useDateDisplayFormatStore((s) => s.dateDisplayFormat);
  useTimeFormatStore((s) => s.timeFormat);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const expiresAt = value ? Date.parse(value) : NaN;
  const known = Number.isFinite(expiresAt);
  const remaining = expiresAt - now;
  const expired = known && remaining <= 0;
  const soon = known && remaining > 0 && remaining <= 7 * DAY_MS;
  const countdown = !known ? null : expired
    ? t("accounts.expiry.expired")
    : remaining < DAY_MS
      ? t("accounts.expiry.lessThanOneDay")
      : t("accounts.expiry.days", { count: Math.ceil(remaining / DAY_MS) });

  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-xl border px-3 py-3",
        !known && "bg-muted/30 text-muted-foreground",
        known && !expired && !soon && "border-emerald-600/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
        soon && "border-amber-600/25 bg-amber-500/5 text-amber-800 dark:text-amber-400",
        expired && "border-destructive/25 bg-destructive/5 text-destructive",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
        {known ? (
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
            <span>{t("accounts.expiry.label")}</span>
            <strong className="text-base font-bold tabular-nums">{countdown}</strong>
          </p>
        ) : <span className="text-sm font-medium">{t("accounts.card.noExpiry")}</span>}
      </div>
      {known && value ? (
        <time dateTime={value} className="ml-6 text-xs leading-relaxed tabular-nums text-muted-foreground">
          {formatDateTimeInline(value, dateFormat)}
        </time>
      ) : null}
    </div>
  );
}
