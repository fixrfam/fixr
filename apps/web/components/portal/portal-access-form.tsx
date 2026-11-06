"use client";

import { useTranslation } from "@fixr/i18n/react";
import { requestPortalAccessSchema } from "@fixr/schemas/portal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
	BellRing,
	CheckCircle2,
	Loader2,
	MailCheck,
	Store,
} from "lucide-react";
import Link from "next/link";
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
import { PortalCenter } from "./portal-center";

type FormValues = z.input<typeof requestPortalAccessSchema>;

/** The client asks for a new portal link with their email. */
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
			<PortalCenter>
				<section className="space-y-3">
					<MailCheck className="size-8 text-primary" />
					<h1 className="text-balance font-heading font-semibold text-2xl">
						{t("portal.access.sentTitle")}
					</h1>
					<p className="text-pretty text-muted-foreground text-sm">
						{t("portal.access.sentDescription")}
					</p>
				</section>
			</PortalCenter>
		);
	}

	const perks = [
		{ Icon: CheckCircle2, text: t("portal.access.perks.track") },
		{ Icon: BellRing, text: t("portal.access.perks.answer") },
		{ Icon: Store, text: t("portal.access.perks.shops") },
	];

	const perksList = (
		<ul className="space-y-3 text-base text-white/90">
			{perks.map(({ Icon, text }) => (
				<li className="flex items-center gap-3" key={text}>
					<Icon className="size-5 shrink-0 text-white" />
					{text}
				</li>
			))}
		</ul>
	);

	return (
		<PortalCenter
			aside={
				<div className="space-y-6">
					<p className="max-w-sm text-balance font-heading font-semibold text-4xl">
						{t("portal.access.title")}
					</p>
					{perksList}
				</div>
			}
		>
			<Form {...form}>
				<form
					className="space-y-6"
					noValidate
					onSubmit={form.handleSubmit((values) => request.mutate(values))}
				>
					<div className="space-y-2">
						<h1 className="text-balance font-heading font-semibold text-2xl lg:sr-only">
							{t("portal.access.title")}
						</h1>
						<p className="text-pretty text-muted-foreground text-sm">
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
						className="w-full rounded-full"
						disabled={request.isPending || !turnstileToken}
						size="lg"
						type="submit"
					>
						{request.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : null}
						{request.isPending
							? t("portal.access.sending")
							: t("portal.access.submit")}
					</Button>
					<p className="text-center text-muted-foreground text-xs">
						{t("portal.access.employee")}{" "}
						<Link
							className="font-medium text-primary hover:underline"
							href="/auth/login"
						>
							{t("portal.access.employeeLink")}
						</Link>
					</p>
				</form>
			</Form>
		</PortalCenter>
	);
}
