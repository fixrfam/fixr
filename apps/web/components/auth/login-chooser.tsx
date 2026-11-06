"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useMutation } from "@tanstack/react-query";
import {
	ChevronRight,
	LayoutDashboard,
	Loader2,
	MailCheck,
	Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { employeePortal } from "@/lib/services/portal";
import { Logo } from "../svg/logo";

/**
 * Second step of the login when the email is also a client's at some shop:
 * the dashboard of the company, or the client portal (whose link goes to the
 * inbox, since the password proves the account and not the email).
 */
export function LoginChooser({
	company,
	email,
	dashboardUrl,
}: {
	company: string;
	email: string;
	dashboardUrl: string;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const toastError = useApiErrorToast();
	const sendLink = useMutation({
		mutationFn: employeePortal.sendLink,
		onError: toastError,
	});

	const options = [
		{
			key: "employee",
			Icon: LayoutDashboard,
			title: t("portal.chooser.asEmployee", { company }),
			hint: t("portal.chooser.asEmployeeHint"),
			onClick: () => router.push(dashboardUrl),
			disabled: false,
		},
		{
			key: "client",
			Icon: Smartphone,
			title: t("portal.chooser.asClient"),
			hint: t("portal.chooser.asClientHint"),
			onClick: () => sendLink.mutate(),
			disabled: sendLink.isPending || sendLink.isSuccess,
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-2 text-center">
				<Logo className="size-8 text-primary" />
				<h1 className="font-bold text-2xl tracking-tight">
					{t("portal.chooser.title")}
				</h1>
				<p className="text-balance text-2xs text-muted-foreground">
					{t("portal.chooser.description")}
				</p>
			</div>
			<div className="grid gap-3">
				{options.map(({ key, Icon, title, hint, onClick, disabled }) => (
					<button
						className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/60 disabled:opacity-60"
						disabled={disabled}
						key={key}
						onClick={onClick}
						type="button"
					>
						<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
							{key === "client" && sendLink.isPending ? (
								<Loader2 className="size-5 animate-spin" />
							) : (
								<Icon className="size-5" />
							)}
						</span>
						<span className="min-w-0 flex-1">
							<span className="block font-medium text-sm">{title}</span>
							<span className="block text-muted-foreground text-xs">
								{hint}
							</span>
						</span>
						<ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
					</button>
				))}
			</div>
			{sendLink.isSuccess && (
				<p className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-3 text-center text-primary text-sm">
					<MailCheck className="size-4 shrink-0" />
					{t("portal.chooser.clientSent", { email })}
				</p>
			)}
		</div>
	);
}
