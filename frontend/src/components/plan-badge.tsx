import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatSlug } from "@/utils/formatters";

type PlanBadgeMeta = {
  label: string;
  className: string;
};

const planBadgeMeta: Record<string, PlanBadgeMeta> = {
  free: {
    label: "Free",
    className: "bg-slate-500/15 text-slate-700 border-slate-500/20 hover:bg-slate-500/20 dark:text-slate-300",
  },
  plus: {
    label: "Plus",
    className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 dark:text-emerald-400",
  },
  pro: {
    label: "Pro",
    className: "bg-blue-500/15 text-blue-700 border-blue-500/20 hover:bg-blue-500/20 dark:text-blue-300",
  },
  prolite: {
    label: "Pro Lite",
    className: "bg-indigo-500/15 text-indigo-700 border-indigo-500/20 hover:bg-indigo-500/20 dark:text-indigo-300",
  },
  team: {
    label: "Team",
    className: "bg-violet-500/15 text-violet-700 border-violet-500/20 hover:bg-violet-500/20 dark:text-violet-300",
  },
  business: {
    label: "Business",
    className: "bg-cyan-500/15 text-cyan-700 border-cyan-500/20 hover:bg-cyan-500/20 dark:text-cyan-300",
  },
  enterprise: {
    label: "Enterprise",
    className: "bg-purple-500/15 text-purple-700 border-purple-500/20 hover:bg-purple-500/20 dark:text-purple-300",
  },
  edu: {
    label: "Education",
    className: "bg-teal-500/15 text-teal-700 border-teal-500/20 hover:bg-teal-500/20 dark:text-teal-300",
  },
};

export type PlanBadgeProps = {
  planType: string;
};

export function PlanBadge({ planType }: PlanBadgeProps) {
  const key = planType.trim().toLowerCase();
  const meta = planBadgeMeta[key] ?? {
    label: formatSlug(planType) || "Unknown plan",
    className: "bg-zinc-500/15 text-zinc-600 border-zinc-500/20 hover:bg-zinc-500/20 dark:text-zinc-300",
  };

  return (
    <Badge className={cn("gap-1.5", meta.className)} data-plan={key || "unknown"} variant="outline">
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </Badge>
  );
}
