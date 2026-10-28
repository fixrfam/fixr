"use client";

import { useTranslation } from "@fixr/i18n/react";
import { requestPortalAccessSchema } from "@fixr/schemas/portal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Turnstile } from "@/components/auth/turnstile";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/services/portal";

type FormValues = z.input<typeof requestPortalAccessSchema>;

/** The customer asks for a new portal link with their email. */
export function PortalAccessForm() {
	const { t } = useTranslation();
	const toastError = useApiErrorToast();
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [turnstileError, setTurnstileError] = useState(false);
	const form = useForm<FormValues>({
		resolver: zodResolver(requestPortalAccessSchema),
		defaultValues: { email: "" },
	});
	const request = useMutation({
		mutationFn: (values: FormValues) =>
			portalApi.requestAccess({
				...values,
				cfTurnstileToken: turnstileToken ?? undefined,
			}),
		onError: toastError,
	});

	if (request.isSuccess) {
		return (
			<section className="w-full max-w-md space-y-3 pt-10 text-center">
				<MailCheck className="mx-auto size-10 text-primary" />
				<h1 className="font-heading font-semibold text-2xl">
					{t("portal.access.sentTitle")}
				</h1>
				<p className="text-muted-foreground">
					{t("portal.access.sentDescription")}
				</p>
			</section>
		);
	}

	return (
		<Form {...form}>
			<form
				className="w-full max-w-md space-y-6 pt-10"
				noValidate
				onSubmit={form.handleSubmit((values) => request.mutate(values))}
			>
				<div className="space-y-2 text-center">
					<h1 className="font-heading font-semibold text-2xl">
						{t("portal.access.title")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("portal.access.description")}
					</p>
				</div>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("portal.access.email")}</FormLabel>
							<FormControl>
								<Input
									autoComplete="email"
									placeholder={t("portal.access.emailPlaceholder")}
									type="email"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Turnstile
					onError={() => setTurnstileError(true)}
					onToken={(token) => {
						setTurnstileToken(token);
						setTurnstileError(false);
					}}
				/>
				{turnstileError ? (
					<p className="text-destructive text-xs">
						{t("auth.turnstile.error")}
					</p>
				) : null}
				<Button
					className="w-full"
					disabled={request.isPending || !turnstileToken}
					type="submit"
				>
					{request.isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : null}
					{request.isPending
						? t("portal.access.sending")
						: t("portal.access.submit")}
				</Button>
			</form>
		</Form>
	);
}
