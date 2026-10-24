import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertMessage } from "@/components/alert-message";
import { AccountDetail, type AccountDetailProps } from "@/features/accounts/components/account-detail";

type AccountDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: AccountDetailProps;
  error?: string | null;
  onCloseAutoFocus: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
};

export function AccountDetailDialog({ open, onOpenChange, detail, error, onCloseAutoFocus }: AccountDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto p-3 sm:max-w-3xl sm:p-5" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader className="pr-8">
          <DialogTitle>{t("accounts.detail.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("accounts.detail.dialogDescription")}</DialogDescription>
        </DialogHeader>
        {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
        <AccountDetail {...detail} className="border-0 p-0 shadow-none sm:p-0" />
      </DialogContent>
    </Dialog>
  );
}
