import { afterEach, describe, expect, it } from "vitest";

import i18n, { LANGUAGE_STORAGE_KEY, normalizeSupportedLanguage } from "@/i18n";
import en from "./locales/en.json";
import vi from "./locales/vi.json";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("normalizeSupportedLanguage", () => {
  it("keeps exact supported locales", () => {
    expect(normalizeSupportedLanguage("en")).toBe("en");
    expect(normalizeSupportedLanguage("zh-CN")).toBe("zh-CN");
    expect(normalizeSupportedLanguage("vi")).toBe("vi");
  });

  it("normalizes detected regional locales to supported toggle values", () => {
    expect(normalizeSupportedLanguage("en-US")).toBe("en");
    expect(normalizeSupportedLanguage("zh")).toBe("zh-CN");
    expect(normalizeSupportedLanguage("zh-Hans-CN")).toBe("zh-CN");
    expect(normalizeSupportedLanguage("ZH-cn")).toBe("zh-CN");
    expect(normalizeSupportedLanguage("vi-VN")).toBe("vi");
    expect(normalizeSupportedLanguage("VI_vn")).toBe("vi");
  });

  it("falls back to English for missing or unsupported locales", () => {
    expect(normalizeSupportedLanguage(undefined)).toBe("en");
    expect(normalizeSupportedLanguage("fr-FR")).toBe("en");
  });

  it("keeps normalized Chinese detections on the supported zh-CN resource", async () => {
    await i18n.changeLanguage(normalizeSupportedLanguage("zh"));

    expect(i18n.resolvedLanguage).toBe("zh-CN");
  });

  it("loads Vietnamese translations, updates document language, and interpolates expiry days", async () => {
    await i18n.changeLanguage(normalizeSupportedLanguage("vi-VN"));

    expect(i18n.resolvedLanguage).toBe("vi");
    expect(document.documentElement.lang).toBe("vi");
    expect(i18n.t("common.vietnamese")).toBe("Tiếng Việt");
    expect(i18n.t("accounts.expiry.days", { count: 7 })).toContain("7 ngày");
    expect(i18n.t("accounts.expiry.days", { count: 1 })).toContain("1 ngày");
  });

  it("detects a saved Vietnamese preference again after initialization", async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "vi");
    await i18n.changeLanguage();

    expect(i18n.resolvedLanguage).toBe("vi");
    expect(document.documentElement.lang).toBe("vi");
  });

  it("defaults to Vietnamese without a saved preference and retains an explicit English choice", async () => {
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    await i18n.changeLanguage();
    expect(i18n.resolvedLanguage).toBe("vi");

    await i18n.changeLanguage("en");
    await i18n.changeLanguage();
    expect(i18n.resolvedLanguage).toBe("en");
  });

  it("provides every English key and preserves interpolation placeholders in Vietnamese", () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(en)) {
      const translated = vi[key as keyof typeof vi];
      expect(translated.trim(), key).not.toBe("");
      expect(translated.match(/{{[^}]+}}/g)?.sort() ?? [], key)
        .toEqual(value.match(/{{[^}]+}}/g)?.sort() ?? []);
    }
  });
});
