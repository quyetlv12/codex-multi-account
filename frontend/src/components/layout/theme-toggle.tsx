import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isDark = theme === "dark";
  const label = `${t("settings.appearance.theme.label")}: ${t("settings.appearance.theme.dark")}`;

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={`${t("settings.appearance.theme.label")}: ${t(`settings.appearance.theme.${theme}`)}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-8 w-16 shrink-0 rounded-full border border-border bg-muted/60 p-0 hover:bg-muted motion-reduce:transition-none dark:border-blue-400/25 dark:bg-blue-950/80 dark:hover:bg-blue-900/70"
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 top-1/2 size-6 -translate-y-1/2 rounded-full bg-background shadow-sm transition-transform duration-200 motion-reduce:transition-none dark:bg-blue-500/25",
          isDark && "translate-x-[1.875rem]",
        )}
      />
      <Sun
        aria-hidden="true"
        className={cn("absolute left-2.5 size-3.5 text-foreground", isDark && "text-muted-foreground")}
      />
      <Moon
        aria-hidden="true"
        className={cn("absolute right-2.5 size-3.5 text-muted-foreground", isDark && "text-blue-200")}
      />
    </Button>
  );
}
