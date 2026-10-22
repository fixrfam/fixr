"use client";

import { cookieKey } from "@fixr/constants/cookies";
import { useTranslation } from "@fixr/i18n/react";
import { ArrowRight, Trash2 } from "lucide-react";
import CookieDialog from "../cookie-dialog";
import { Logo } from "../svg/logo";

export function AuthDialogs({
	showVerifiedDialog,
	showDeletedDialog,
}: {
	showVerifiedDialog: boolean;
	showDeletedDialog: boolean;
}) {
	const { t } = useTranslation();

	return (
		<>
			<CookieDialog
				close={{
					cta: (
						<>
							{t("auth.verifiedDialog.cta")} <ArrowRight />
						</>
					),
					toast: {
						text: t("auth.verifiedDialog.toastTitle"),
						description: t("auth.verifiedDialog.toastDescription"),
					},
				}}
				cookieKey={cookieKey("showVerifiedDialog")}
				open={showVerifiedDialog}
			>
				<div className="flex flex-col items-center gap-4">
					<div className="flex items-center justify-center rounded-md bg-primary p-2 text-primary-foreground">
						<Logo className="size-5" />
					</div>
					<div className="space-y-1 text-center text-foreground">
						<h2 className="font-bold text-2xl tracking-tight">
							{t("auth.verifiedDialog.title")}
						</h2>
						<p className="text-muted-foreground">
							{t("auth.verifiedDialog.description")}
						</p>
					</div>
					<div className="space-y-1 text-center text-foreground">
						<p className="text-muted-foreground text-sm">
							{t("auth.verifiedDialog.details")}
						</p>
					</div>
				</div>
			</CookieDialog>
			<CookieDialog
				close={{
					cta: t("auth.deletedDialog.cta"),
					toast: {
						text: t("auth.deletedDialog.toastTitle"),
						description: t("auth.deletedDialog.toastDescription"),
					},
				}}
				cookieKey={cookieKey("showDeletedDialog")}
				open={showDeletedDialog}
			>
				<div className="flex flex-col items-center gap-4">
					<Trash2 className="size-8 text-destructive" />
					<div className="space-y-1 text-center text-foreground">
						<h2 className="font-bold text-2xl tracking-tight">
							{t("auth.deletedDialog.title")}
						</h2>
						<p className="text-muted-foreground">
							{t("auth.deletedDialog.description")}
						</p>
					</div>
					<div className="space-y-1 text-center text-foreground">
						<p className="text-muted-foreground text-sm">
							{t("auth.deletedDialog.details")}
						</p>
					</div>
				</div>
			</CookieDialog>
		</>
	);
}
