import {
  Ban,
  CircleCheck,
  CircleX,
  Gauge,
  KeyRound,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusValue = "active" | "paused" | "limited" | "exceeded" | "reauth" | "deactivated";

const statusClassMap: Record<StatusValue, string> = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 dark:text-emerald-400",
  paused: "bg-amber-500/15 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 dark:text-amber-400",
  limited: "bg-orange-500/15 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 dark:text-orange-400",
  exceeded: "bg-red-500/15 text-red-700 border-red-500/20 hover:bg-red-500/20 dark:text-red-400",
  reauth: "bg-sky-500/15 text-sky-700 border-sky-500/20 hover:bg-sky-500/20 dark:text-sky-300",
  deactivated: "bg-zinc-500/15 text-zinc-600 border-zinc-500/20 hover:bg-zinc-500/20 dark:text-zinc-400",
};

const statusIconMap: Record<StatusValue, LucideIcon> = {
  active: CircleCheck,
  paused: PauseCircle,
  limited: Gauge,
  exceeded: CircleX,
  reauth: KeyRound,
  deactivated: Ban,
};

export type StatusBadgeProps = {
  status: StatusValue;
  title?: string;
  iconOnly?: boolean;
};

export function StatusBadge({ status, title, iconOnly = false }: StatusBadgeProps) {
  const { t } = useTranslation();
  const className = statusClassMap[status] ?? statusClassMap.deactivated;
  const label = t(`common.status.${status}`, { defaultValue: status });
  const StatusIcon = statusIconMap[status] ?? Ban;

  return (
    <Badge
      className={cn("gap-1.5", iconOnly && "h-7 w-7 justify-center p-0", className)}
      variant="outline"
      title={title ?? (iconOnly ? label : undefined)}
      role={iconOnly ? "img" : undefined}
      aria-label={iconOnly ? label : undefined}
    >
      {iconOnly ? (
        <StatusIcon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {label}
        </>
      )}
    </Badge>
  );
}
