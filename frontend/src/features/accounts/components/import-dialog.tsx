import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CircleAlert,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CredentialLoginResponse } from "@/features/accounts/schemas";
import { cn } from "@/lib/utils";

export type ImportDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
  onCredentialLogin: (text: string) => Promise<CredentialLoginResponse>;
  mode?: "import" | "credential";
};

export function ImportDialog({
  open,
  busy,
  error,
  onOpenChange,
  onImport,
  onCredentialLogin,
  mode = "import",
}: ImportDialogProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [credentials, setCredentials] = useState("");
  const [credentialResult, setCredentialResult] =
    useState<CredentialLoginResponse | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  let recordNumber = 0;
  const lineNumbers = credentials.split(/\r?\n/).map((line) =>
    line.trim() && !line.trim().startsWith("#") ? ++recordNumber : "",
  );

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && busy) {
      return;
    }
    if (!nextOpen && !busy) {
      setCredentials("");
      setFile(null);
      setCredentialResult(null);
      setCredentialError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      return;
    }
    await onImport(file);
    onOpenChange(false);
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={
          mode === "credential"
            ? "max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-[min(64rem,calc(100%-2rem))]"
            : undefined
        }
        showCloseButton={mode !== "credential"}
      >
        <DialogHeader
          className={
            mode === "credential"
              ? "gap-3 border-b bg-muted/30 px-5 py-6 pr-16 text-left sm:px-7 sm:pr-16"
              : undefined
          }
        >
          {mode === "credential" ? (
            <span className="mb-1 flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
          ) : null}
          <DialogTitle>
            {mode === "credential"
              ? t("accounts.importDialog.autoLoginTitle")
              : t("accounts.importDialog.title")}
          </DialogTitle>
          <DialogDescription
            className={mode === "credential" ? "leading-relaxed" : undefined}
          >
            {mode === "credential"
              ? t("accounts.importDialog.autoLoginDescription")
              : t("accounts.importDialog.description")}
          </DialogDescription>
        </DialogHeader>

        {mode === "import" ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="auth-json-file">
                {t("accounts.importDialog.fileLabel")}
              </Label>
              <Input
                id="auth-json-file"
                type="file"
                accept="application/json,.json"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>

            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={busy || !file}>
                {t("common.actions.import")}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
        {mode === "credential" ? (
          <form
            className="min-w-0"
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy || !credentials.trim()) return;
              setCredentialError(null);
              try {
                const result = await onCredentialLogin(credentials);
                setCredentialResult(result);
                const failures = result.results.filter(
                  (item) => !item.ok,
                ).length;
                if (failures === 0) {
                  handleClose(false);
                } else {
                  const submittedLines = credentials
                    .split(/\r?\n/)
                    .filter(
                      (line) => line.trim() && !line.trim().startsWith("#"),
                    );
                  setCredentials(
                    result.results
                      .filter((item) => !item.ok)
                      .map((item) => submittedLines[item.index])
                      .filter((line): line is string => Boolean(line))
                      .join("\n"),
                  );
                }
              } catch (error) {
                setCredentialError(
                  error instanceof Error
                    ? error.message
                    : t("accounts.importDialog.credentialFailed"),
                );
              }
            }}
          >
            <div className="space-y-5 px-5 py-6 sm:px-7">
              <div
                id="credential-format"
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs"
              >
                <span className="font-medium text-muted-foreground">
                  {t("accounts.importDialog.credentialFormat")}
                </span>
                <code className="font-mono text-foreground">
                  email<span className="px-1.5 text-muted-foreground">|</span>
                  password
                  <span className="px-1.5 text-muted-foreground">|</span>2FA
                </code>
              </div>
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="credential-lines">
                    {t("accounts.importDialog.credentialLabel")}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {t("accounts.importDialog.credentialDescription")}
                  </span>
                </div>
                <div
                  className={cn(
                    "border-input bg-background focus-within:border-ring focus-within:ring-ring/30 relative flex overflow-hidden rounded-xl border focus-within:ring-2",
                    credentialError && "border-destructive",
                  )}
                >
                  <div
                    aria-hidden="true"
                    className="relative shrink-0 border-r bg-muted/40"
                    style={{ width: `${Math.max(3, String(recordNumber).length + 2)}ch` }}
                  >
                    <div
                      ref={lineNumbersRef}
                      data-testid="credential-record-numbers"
                      className="pointer-events-none absolute inset-0 overflow-hidden py-3 text-center font-mono text-sm leading-7 text-muted-foreground select-none"
                    >
                      {lineNumbers.map((number, index) => (
                        <div key={index} className="h-7">{number}</div>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="credential-lines"
                    className="bg-transparent placeholder:text-muted-foreground/70 block min-h-40 min-w-0 flex-1 resize-y overflow-x-auto px-3.5 py-3 font-mono text-sm leading-7 outline-none disabled:cursor-wait disabled:opacity-60"
                    rows={5}
                    wrap="off"
                    value={credentials}
                    onChange={(event) => setCredentials(event.target.value)}
                    onScroll={(event) => {
                      if (lineNumbersRef.current) {
                        lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
                      }
                    }}
                    placeholder="email|password|2FA"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                    aria-busy={busy}
                    aria-describedby={`credential-format credential-hint${credentialError ? " credential-error" : ""}`}
                    aria-invalid={Boolean(credentialError)}
                  />
                </div>
              </div>
              <p
                id="credential-hint"
                className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
              >
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{t("accounts.importDialog.credentialHint")}</span>
              </p>
              {credentialResult ? (
                <p
                  className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm"
                  role="status"
                >
                  {t("accounts.importDialog.credentialResult", {
                    success: credentialResult.results.filter((item) => item.ok)
                      .length,
                    failed: credentialResult.results.filter((item) => !item.ok)
                      .length,
                  })}
                </p>
              ) : null}
              {credentialError ? (
                <p
                  id="credential-error"
                  className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                  role="alert"
                >
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">{credentialError}</span>
                </p>
              ) : null}
            </div>
            <DialogFooter className="border-t bg-muted/20 px-5 py-4 sm:px-7">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg sm:min-w-24"
                disabled={busy}
                onClick={() => handleClose(false)}
              >
                {t("common.actions.close")}
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-lg sm:min-w-44"
                disabled={busy || !credentials.trim()}
              >
                {busy ? (
                  <LoaderCircle
                    className="size-4 motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowRight className="size-4" aria-hidden="true" />
                )}
                <span role={busy ? "status" : undefined}>
                  {busy
                    ? t("accounts.importDialog.loggingIn")
                    : t("accounts.importDialog.login")}
                </span>
              </Button>
            </DialogFooter>
          </form>
        ) : null}
        {mode === "credential" ? (
          <DialogClose asChild>
            <Button
              className="absolute top-4 right-4 rounded-full"
              variant="ghost"
              size="icon"
              disabled={busy}
            >
              <X aria-hidden="true" className="size-4" />
              <span className="sr-only">{t("common.actions.close")}</span>
            </Button>
          </DialogClose>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
