import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CredentialLoginResponse } from "@/features/accounts/schemas";

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
  const [credentialResult, setCredentialResult] = useState<CredentialLoginResponse | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "credential" ? t("accounts.importDialog.autoLoginTitle") : t("accounts.importDialog.title")}</DialogTitle>
          <DialogDescription>{mode === "credential" ? t("accounts.importDialog.autoLoginDescription") : t("accounts.importDialog.description")}</DialogDescription>
        </DialogHeader>

        {mode === "import" ? <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="auth-json-file">{t("accounts.importDialog.fileLabel")}</Label>
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
        </form> : null}
        {mode === "credential" ? <form
          className="space-y-2 border-t pt-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setCredentialError(null);
            try {
              const result = await onCredentialLogin(credentials);
              setCredentialResult(result);
              const failures = result.results.filter((item) => !item.ok).length;
              if (failures === 0) {
                handleClose(false);
              } else {
                const submittedLines = credentials
                  .split(/\r?\n/)
                  .filter((line) => line.trim() && !line.trim().startsWith("#"));
                setCredentials(
                  result.results
                    .filter((item) => !item.ok)
                    .map((item) => submittedLines[item.index])
                    .filter((line): line is string => Boolean(line))
                    .join("\n"),
                );
              }
            } catch (error) {
              setCredentialError(error instanceof Error ? error.message : t("accounts.importDialog.credentialFailed"));
            }
          }}
        >
          <Label htmlFor="credential-lines">{t("accounts.importDialog.credentialLabel")}</Label>
          <textarea
            id="credential-lines"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            rows={4}
            value={credentials}
            onChange={(event) => setCredentials(event.target.value)}
            placeholder="email|password|2FA"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            aria-busy={busy}
          />
          <p className="text-xs text-muted-foreground">
            {t("accounts.importDialog.credentialHint")}
          </p>
          {credentialResult ? (
            <p className="text-xs text-muted-foreground" role="status">
              {t("accounts.importDialog.credentialResult", {
                success: credentialResult.results.filter((item) => item.ok).length,
                failed: credentialResult.results.filter((item) => !item.ok).length,
              })}
            </p>
          ) : null}
          {credentialError ? <p className="text-xs text-destructive" role="alert">{credentialError}</p> : null}
          <Button type="submit" disabled={busy || !credentials.trim()}>
            {t("accounts.importDialog.login")}
          </Button>
        </form> : null}
      </DialogContent>
    </Dialog>
  );
}
