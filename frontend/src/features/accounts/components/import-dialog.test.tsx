import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";

import { ImportDialog, type ImportDialogProps } from "./import-dialog";

function props(overrides: Partial<ImportDialogProps> = {}): ImportDialogProps {
  return {
    open: true,
    busy: false,
    error: null,
    mode: "credential",
    onOpenChange: vi.fn(),
    onImport: vi.fn(),
    onCredentialLogin: vi
      .fn()
      .mockResolvedValue({ results: [{ index: 0, ok: true, step: "done" }] }),
    ...overrides,
  };
}

const sample = "demo@example.invalid|sample-password|SAMPLE-2FA";

describe("ImportDialog", () => {
  it("submits the original text and closes on success", async () => {
    const user = userEvent.setup();
    const options = props();
    renderWithProviders(<ImportDialog {...options} />);
    const submit = screen.getByRole("button", { name: "Login and import" });
    expect(submit).toBeDisabled();
    const input = screen.getByRole("textbox", { name: "Account credentials" });
    expect(input).toHaveAccessibleDescription(/email.*password.*2FA/);
    const text = `# comment\n${sample}\n\nretry@example.invalid|sample-password|SAMPLE-2FA`;
    fireEvent.change(input, { target: { value: text } });
    const numbers = screen.getByTestId("credential-record-numbers");
    expect(Array.from(numbers.children, (line) => line.textContent)).toEqual([
      "", "1", "", "2",
    ]);
    expect(input).toHaveAttribute("wrap", "off");
    fireEvent.scroll(input, { target: { scrollTop: 28 } });
    expect(numbers.scrollTop).toBe(28);
    await user.click(submit);
    expect(options.onCredentialLogin).toHaveBeenCalledExactlyOnceWith(text);
    await waitFor(() =>
      expect(options.onOpenChange).toHaveBeenCalledWith(false),
    );
  });

  it("retains only failed lines after partial success for retry", async () => {
    const user = userEvent.setup();
    const failed = "retry@example.invalid|sample-password|SAMPLE-2FA";
    const options = props({
      onCredentialLogin: vi.fn().mockResolvedValue({
        results: [
          { index: 0, ok: true, step: "done" },
          { index: 1, ok: false, step: "failed" },
        ],
      }),
    });
    renderWithProviders(<ImportDialog {...options} />);
    const input = screen.getByRole("textbox");
    await user.type(input, `# comment\n${sample}\n\n${failed}`);
    await user.click(screen.getByRole("button", { name: "Login and import" }));
    await waitFor(() => expect(input).toHaveValue(failed));
    expect(screen.getByTestId("credential-record-numbers")).toHaveTextContent("1");
    expect(screen.getByTestId("credential-record-numbers").children).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Imported 1 account(s); 1 failed.",
    );
    expect(options.onOpenChange).not.toHaveBeenCalled();
  });

  it("locks editing and dismissal while busy and announces processing", async () => {
    const user = userEvent.setup();
    const options = props();
    const { rerender } = renderWithProviders(<ImportDialog {...options} />);
    await user.type(screen.getByRole("textbox"), sample);
    rerender(<ImportDialog {...options} busy />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Logging in…");
    for (const button of screen.getAllByRole("button"))
      expect(button).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(options.onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue(sample);
  });

  it("shows an error without clearing input, and clears it after close", async () => {
    const user = userEvent.setup();
    const options = props({
      onCredentialLogin: vi
        .fn()
        .mockRejectedValue(new Error("Login unavailable")),
    });
    const { rerender } = renderWithProviders(<ImportDialog {...options} />);
    await user.type(screen.getByRole("textbox"), sample);
    await user.click(screen.getByRole("button", { name: "Login and import" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Login unavailable",
    );
    expect(screen.getByRole("textbox")).toHaveValue(sample);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    await user.click(
      screen.getAllByRole("button", { name: "Close" })[1],
    );
    expect(options.onOpenChange).toHaveBeenCalledWith(false);
    rerender(<ImportDialog {...options} open={false} />);
    rerender(<ImportDialog {...options} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps auth.json upload separate from credential login", async () => {
    const user = userEvent.setup();
    const options = props({ mode: "import" });
    renderWithProviders(<ImportDialog {...options} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    const file = new File(['{"sample":true}'], "auth.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText("auth.json file"), file);
    await user.click(
      screen.getByRole("button", { name: "Import" }),
    );
    expect(options.onImport).toHaveBeenCalledWith(file);
    expect(options.onCredentialLogin).not.toHaveBeenCalled();
  });
});
