import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LanguageToggle, LanguageToggleMobile } from "@/components/layout/language-toggle";
import i18n, { LANGUAGE_STORAGE_KEY } from "@/i18n";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("Vietnamese language selection", () => {
  it("selects Vietnamese from the desktop menu and persists it", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(screen.getByRole("menuitem", { name: "Tiếng Việt" }));

    expect(screen.getByRole("button", { name: "Ngôn ngữ" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("vi");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("vi");
  });

  it("offers Vietnamese on mobile and lets users switch back to English", async () => {
    const user = userEvent.setup();
    render(<LanguageToggleMobile />);

    await user.click(screen.getByRole("button", { name: "Tiếng Việt" }));
    expect(document.documentElement.lang).toBe("vi");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("vi");

    await user.click(screen.getByRole("button", { name: "Tiếng Anh" }));
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
  });
});
