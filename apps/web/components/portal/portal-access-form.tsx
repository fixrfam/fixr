"use client";

import { useTranslation } from "@fixr/i18n/react";
import { requestPortalAccessSchema } from "@fixr/schemas/portal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Turnstile } from "@/components/auth/turnstile";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Logo } from "@/components/svg/logo";
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

/**
 * The customer's sign-in, built like the employee login: the email gets a
 * link that signs them in to the portal, no password.
 */
export function PortalAccessForm() {
	const { t } = useTranslation();
	const toastError = useApiErrorToast();
	const [turnstile, setTurnstile] = useState<{
		token: string | null;
		loading: boolean;
		error: boolean;
		interactive: boolean;
	}>({ token: null, loading: true, error: false, interactive: false });
	const form = useForm<FormValues>({
		resolver: zodResolver(requestPortalAccessSchema),
		defaultValues: { email: "" },
		mode: "all",
	});
	const request = useMutation({
		mutationFn: (values: FormValues) =>
			portalApi.requestAccess({
				...values,
				cfTurnstileToken: turnstile.token ?? undefined,
			}),
		onError: toastError,
	});

	if (request.isSuccess) {
		return (
			<div className="flex flex-col items-center gap-2 text-center">
				<MailCheck className="size-8 text-primary" />
				<h1 className="font-bold text-2xl tracking-tight">
					{t("portal.access.sentTitle")}
				</h1>
				<p className="text-balance text-2xs text-muted-foreground">
					{t("portal.access.sentDescription")}
				</p>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form
				className="flex flex-col gap-6"
				noValidate
				onSubmit={form.handleSubmit((values) => request.mutate(values))}
			>
				<div className="flex flex-col items-center gap-2 text-center">
					<Logo className="size-8 text-primary" />
					<h1 className="font-bold text-2xl tracking-tight">
						{t("portal.access.title")}
					</h1>
					<p className="text-balance text-2xs text-muted-foreground">
						{t("portal.access.description")}
					</p>
				</div>
				<div className="grid gap-6">
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
										required
										type="email"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Turnstile
						onError={() =>
							setTurnstile({
								token: null,
								loading: false,
								error: true,
								interactive: false,
							})
						}
						onInteractive={() =>
							setTurnstile((prev) => ({ ...prev, interactive: true }))
						}
						onLoad={() => setTurnstile((prev) => ({ ...prev, loading: false }))}
						onToken={(token) =>
							setTurnstile({
								token,
								loading: false,
								error: false,
								interactive: false,
							})
						}
					/>
					{turnstile.error && (
						<p className="text-destructive text-xs">
							{t("auth.turnstile.error")}
						</p>
					)}
					{turnstile.interactive && (
						<p className="text-muted-foreground text-xs">
							{t("auth.turnstile.interactive")}
						</p>
					)}
					<Button
						className="w-full"
						disabled={
							request.isPending ||
							!form.formState.isValid ||
							turnstile.loading ||
							!turnstile.token
						}
						type="submit"
					>
						{request.isPending || turnstile.loading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							t("portal.access.submit")
						)}
					</Button>
				</div>
				<p className="text-center text-2xs text-muted-foreground">
					{t("portal.access.employee")}{" "}
					<Link
						className="font-medium text-primary hover:underline"
						href="/auth/login"
					>
						{t("portal.access.employeeLink")}
					</Link>
				</p>
				<div className="text-center text-2xs opacity-30">
					{t("auth.login.disclaimer")}
				</div>
			</form>
		</Form>
	);
}
