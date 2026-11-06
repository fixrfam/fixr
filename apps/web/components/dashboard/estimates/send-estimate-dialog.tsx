"use client";

import { useTranslation } from "@fixr/i18n/react";
import { sendEstimateSchema } from "@fixr/schemas/estimates";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { CustomerAvatar } from "@/components/dashboard/customers/customer-avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Estimate } from "@/lib/services/estimates";
import { formatEstimateNumber } from "./store";
import { useEstimateActions } from "./use-estimate-actions";

type FormValues = z.input<typeof sendEstimateSchema>;

/**
 * Email the estimate to the client. It goes to the email on the client's
 * profile (the API picks it); another address is only typed when asked for,
 * or when the profile has none.
 */
export function SendEstimateDialog({
	estimate,
	open,
	onOpenChange,
}: {
	estimate: Estimate;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const { send } = useEstimateActions();
	const profileEmail = estimate.client?.email ?? null;
	const [typing, setTyping] = useState(!profileEmail);
	const form = useForm<FormValues>({
		resolver: zodResolver(sendEstimateSchema),
		defaultValues: {
			email:
				estimate.sentTo && estimate.sentTo !== profileEmail
					? estimate.sentTo
					: "",
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		if (typing && !values.email) {
			form.setError("email", {
				message: t("estimates.sendDialog.noEmail"),
			});
			return;
		}
		send.mutate(
			{ id: estimate.id, email: typing ? values.email : undefined },
			{ onSuccess: () => onOpenChange(false) }
		);
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent onClick={(event) => event.stopPropagation()}>
				<DialogHeader>
					<DialogTitle>
						{t("estimates.sendDialog.title", {
							number: formatEstimateNumber(estimate.number),
						})}
					</DialogTitle>
					<DialogDescription>
						{t("estimates.sendDialog.description")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" noValidate onSubmit={onSubmit}>
						{estimate.client && (
							<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
								<CustomerAvatar
									className="size-10"
									customer={estimate.client}
								/>
								<div className="min-w-0 flex-1 text-sm">
									<p className="truncate font-medium">{estimate.client.name}</p>
									{profileEmail && !typing ? (
										<p className="flex items-center gap-1.5 truncate text-muted-foreground text-xs">
											<Mail className="size-3" />
											<span className="truncate">{profileEmail}</span>
											<span className="shrink-0">
												· {t("estimates.sendDialog.fromProfile")}
											</span>
										</p>
									) : (
										!profileEmail && (
											<p className="text-muted-foreground text-xs">
												{t("estimates.sendDialog.noEmail")}
											</p>
										)
									)}
								</div>
							</div>
						)}

						{typing && (
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("estimates.sendDialog.email")}</FormLabel>
										<FormControl>
											<Input
												autoComplete="email"
												autoFocus
												placeholder={t("estimates.sendDialog.emailPlaceholder")}
												type="email"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{profileEmail && (
							<Button
								className="h-auto px-0 text-xs"
								onClick={() => {
									setTyping((current) => !current);
									form.clearErrors();
								}}
								type="button"
								variant="link"
							>
								{typing
									? t("estimates.sendDialog.useProfile")
									: t("estimates.sendDialog.otherEmail")}
							</Button>
						)}

						<DialogFooter>
							<Button
								onClick={() => onOpenChange(false)}
								type="button"
								variant="outline"
							>
								{t("estimates.sendDialog.cancel")}
							</Button>
							<Button disabled={send.isPending} type="submit">
								{send.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Send className="size-4" />
								)}
								{send.isPending
									? t("estimates.sendDialog.sending")
									: t("estimates.sendDialog.submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
