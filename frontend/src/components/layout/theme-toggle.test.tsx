import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useThemeStore } from "@/hooks/use-theme";

describe("ThemeToggle", () => {
  beforeEach(() => {
    useThemeStore.getState().setTheme("light");
  });

  afterEach(() => {
    act(() => useThemeStore.getState().setTheme("light"));
    window.localStorage.removeItem("codex-lb-theme");
    vi.unstubAllGlobals();
  });

  it("toggles both ways with one click and keeps a stable accessible name", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch", { name: "Theme: Dark" });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("codex-lb-theme")).toBe("dark");

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem("codex-lb-theme")).toBe("light");
  });

  it("supports Space and Enter, retains focus and restores the saved theme", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch", { name: "Theme: Dark" });
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard(" ");
    expect(toggle).toBeChecked();
    await user.keyboard("{Enter}");
    expect(toggle).not.toBeChecked();
    await user.keyboard("{Enter}");
    expect(toggle).toBeChecked();
    expect(toggle).toHaveFocus();

    act(() => {
      useThemeStore.setState({ preference: "light", theme: "light", initialized: false });
      document.documentElement.classList.remove("dark");
      useThemeStore.getState().initializeTheme();
    });
    expect(useThemeStore.getState().preference).toBe("dark");
    expect(toggle).toBeChecked();
    expect(document.documentElement).toHaveClass("dark");
  });

  it.each([true, false])("reflects resolved system dark=%s and only replaces auto on activation", async (dark) => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    act(() => useThemeStore.getState().setTheme("auto"));
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch", { name: "Theme: Dark" });
    expect(toggle).toHaveAttribute("aria-checked", String(dark));
    expect(window.localStorage.getItem("codex-lb-theme")).toBe("auto");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", String(!dark));
    expect(window.localStorage.getItem("codex-lb-theme")).toBe(dark ? "light" : "dark");
  });

  it("reflects changes made through appearance settings", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch", { name: "Theme: Dark" });
    act(() => useThemeStore.getState().setTheme("dark"));
    expect(toggle).toBeChecked();
    act(() => useThemeStore.getState().setTheme("light"));
    expect(toggle).not.toBeChecked();
  });
});
