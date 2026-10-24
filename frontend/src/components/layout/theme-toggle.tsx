import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeStore } from "@/hooks/use-theme";

const THEME_OPTIONS = [
  { value: "light", labelKey: "settings.appearance.theme.light", icon: Sun },
  { value: "dark", labelKey: "settings.appearance.theme.dark", icon: Moon },
  { value: "auto", labelKey: "settings.appearance.theme.auto", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { t } = useTranslation();
  const preference = useThemeStore((s) => s.preference);
  const setTheme = useThemeStore((s) => s.setTheme);
  const selected = THEME_OPTIONS.find((option) => option.value === preference)!;
  const Icon = selected.icon;
  const label = `${t("settings.appearance.theme.label")}: ${t(selected.labelKey)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={label}
          title={label}
          className="press-scale h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={preference}>
          {THEME_OPTIONS.map(({ value, labelKey, icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value} onSelect={() => setTheme(value)}>
              <OptionIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
