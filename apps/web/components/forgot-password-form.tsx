"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { requestPasswordResetSchema } from "@fixr/schemas/credentials";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import axios, { AxiosError } from "axios";
import { Loader2, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Turnstile } from "@/components/auth/turnstile";
import { api, cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

export function ForgotPasswordForm({
	onSuccess,
}: {
	onSuccess: Dispatch<SetStateAction<boolean>>;
}) {
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const [turnstile, setTurnstile] = useState<{
		token: string | null;
		loading: boolean;
		error: boolean;
		interactive: boolean;
	}>({ token: null, loading: true, error: false, interactive: false });

	const form = useForm<z.infer<typeof requestPasswordResetSchema>>({
		resolver: zodResolver(requestPasswordResetSchema),
		defaultValues: {
			email: "",
		},
		mode: "all",
	});

	const { formState } = form;

	async function onSubmit(values: z.infer<typeof requestPasswordResetSchema>) {
		setLoading(true);
		try {
			const res = await axios.post<ApiResponse>(
				api("/credentials/password/reset"),
				{ ...values, cfTurnstileToken: turnstile.token },
				{
					withCredentials: true,
				}
			);
			if (res.status === 201) {
				const feedback = message(res.data.code, "success");

				toast.success({
					text: feedback.title,
					description: feedback.description,
				});
				onSuccess(true);
			}
		} catch (error) {
			if (error instanceof AxiosError) {
				const errorData = error.response?.data as ApiResponse;
				const feedback = message(errorData.code, "error");

				toast.error({
					text: feedback.title,
					description: feedback.description,
				});
			}
		} finally {
			setLoading(false);
		}
	}
	return (
		<Form {...form}>
			<form
				className={cn("flex flex-col gap-6")}
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<div className="flex flex-col items-center gap-2 text-center">
					<div className="rounded-md bg-primary p-1.5 text-white">
						<ShieldQuestion className="size-5" />
					</div>
					<h1 className="whitespace-nowrap font-bold text-2xl tracking-tight">
						{t("auth.forgotPassword.title")}
					</h1>
					<p className="text-balance text-2xs text-muted-foreground">
						{t("auth.forgotPassword.subtitle")}
					</p>
				</div>
				<div className="grid gap-6">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.forgotPassword.emailLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("auth.forgotPassword.emailPlaceholder")}
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
							loading ||
							!formState.isValid ||
							turnstile.loading ||
							!turnstile.token
						}
						type="submit"
					>
						{loading || turnstile.loading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							t("auth.forgotPassword.submit")
						)}
					</Button>
				</div>
				<div className="text-center text-2xs">
					<Link className="underline underline-offset-4" href="/auth/login">
						{t("common.actions.back")}
					</Link>
				</div>
			</form>
		</Form>
	);
}
