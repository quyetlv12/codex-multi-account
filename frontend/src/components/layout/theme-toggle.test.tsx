import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useThemeStore } from "@/hooks/use-theme";

describe("ThemeToggle", () => {
  beforeEach(() => {
    useThemeStore.getState().setTheme("light");
  });

  afterEach(() => {
    useThemeStore.getState().setTheme("light");
    window.localStorage.removeItem("codex-lb-theme");
  });

  it("selects dark with keyboard, persists it, and restores it on initialization", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Theme: Light" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menuitemradio", { name: "Light" })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(screen.getByRole("button", { name: "Theme: Dark" })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("codex-lb-theme")).toBe("dark");

    act(() => {
      useThemeStore.setState({ preference: "light", theme: "light", initialized: false });
      document.documentElement.classList.remove("dark");
      useThemeStore.getState().initializeTheme();
    });
    expect(useThemeStore.getState().preference).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("uses the same preference as settings and exposes all three selected states", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    for (const [label, value] of [["System", "auto"], ["Dark", "dark"], ["Light", "light"]]) {
      await user.click(screen.getByRole("button", { name: /^Theme:/ }));
      await user.click(screen.getByRole("menuitemradio", { name: label }));
      expect(useThemeStore.getState().preference).toBe(value);
      await user.click(screen.getByRole("button", { name: `Theme: ${label}` }));
      expect(screen.getByRole("menuitemradio", { name: label })).toHaveAttribute("aria-checked", "true");
      await user.keyboard("{Escape}");
    }
  });
});
