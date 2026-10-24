"use client";

import { useTranslation } from "@fixr/i18n/react";
import { sendEstimateSchema } from "@fixr/schemas/estimates";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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
import { useEstimateActions } from "./use-estimate-actions";

type FormValues = z.input<typeof sendEstimateSchema>;

/**
 * Email the estimate to the client. The address starts with the last one the
 * estimate was sent to; left empty, the API uses the client's email.
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
	const form = useForm<FormValues>({
		resolver: zodResolver(sendEstimateSchema),
		defaultValues: { email: estimate.sentTo ?? "" },
	});

	const onSubmit = form.handleSubmit((values) =>
		send.mutate(
			{ id: estimate.id, email: values.email || undefined },
			{ onSuccess: () => onOpenChange(false) }
		)
	);

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("estimates.sendDialog.title", {
							number: String(estimate.number).padStart(4, "0"),
						})}
					</DialogTitle>
					<DialogDescription>
						{t("estimates.sendDialog.description")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" noValidate onSubmit={onSubmit}>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("estimates.sendDialog.email")}</FormLabel>
									<FormControl>
										<Input
											autoComplete="email"
											placeholder={t("estimates.sendDialog.emailPlaceholder")}
											type="email"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
