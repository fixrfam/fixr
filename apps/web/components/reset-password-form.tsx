"use client";

import { PASSWORD_RESTRICTION_REGEXES as REGEXES } from "@fixr/constants/enforcements";
import { useMessage, useTranslation } from "@fixr/i18n/react";
import { confirmPasswordResetSchema as baseConfirmPasswordResetSchema } from "@fixr/schemas/credentials";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import axios, { AxiosError } from "axios";
import { Loader2, Lock } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Turnstile } from "@/components/auth/turnstile";
import { api, cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

export function ResetPasswordForm({
	onSuccess,
	token,
}: {
	onSuccess: Dispatch<SetStateAction<boolean>>;
	token: string;
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

	const confirmPasswordResetSchema = baseConfirmPasswordResetSchema
		.extend({
			password: z
				.string()
				.min(8, { message: t("validation.password.min", { count: 8 }) })
				.max(128, { message: t("validation.password.max", { count: 128 }) })
				.refine((password) => REGEXES.uppercase.test(password), {
					message: t("validation.password.uppercase"),
				})
				.refine((password) => REGEXES.lowercase.test(password), {
					message: t("validation.password.lowercase"),
				})
				.refine((password) => REGEXES.number.test(password), {
					message: t("validation.password.number"),
				})
				.refine((password) => REGEXES.special.test(password), {
					message: t("validation.password.special"),
				}),
			confirmPassword: z
				.string({ error: t("validation.password.confirm") })
				.min(1, { message: t("validation.password.confirm") }),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("validation.password.mismatch"),
			path: ["confirmPassword"],
		});

	const form = useForm<z.infer<typeof confirmPasswordResetSchema>>({
		resolver: zodResolver(confirmPasswordResetSchema),
		defaultValues: {
			token,
			password: "",
			confirmPassword: "",
		},
		mode: "all",
	});

	const { formState } = form;

	async function onSubmit(values: z.infer<typeof confirmPasswordResetSchema>) {
		setLoading(true);
		try {
			const res = await axios.put<ApiResponse>(
				api("/credentials/password/reset"),
				{ token, password: values.password, cfTurnstileToken: turnstile.token },
				{
					withCredentials: true,
				}
			);
			if (res.status === 200) {
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
						<Lock className="size-5" />
					</div>
					<h1 className="whitespace-nowrap font-bold text-2xl tracking-tight">
						{t("auth.resetPassword.title")}
					</h1>
					<p className="text-balance text-2xs text-muted-foreground">
						{t("auth.resetPassword.subtitle")}
					</p>
				</div>
				<div className="grid gap-6">
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.resetPassword.passwordLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder="••••••••"
										required
										type="password"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("auth.resetPassword.confirmPasswordLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder="••••••••"
										required
										type="password"
										{...field}
									/>
								</FormControl>
								<FormDescription className="text-2xs">
									{t("auth.resetPassword.confirmDescription")}
								</FormDescription>
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
							t("auth.resetPassword.submit")
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
