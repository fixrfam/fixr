"use client";

import { PASSWORD_RESTRICTION_REGEXES as REGEXES } from "@fixr/constants/enforcements";
import { useMessage, useTranslation } from "@fixr/i18n/react";
import { createUserSchema as baseCreateUserSchema } from "@fixr/schemas/auth";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axios } from "@/lib/auth/axios";
import { api, cn, type Nullable } from "@/lib/utils";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Turnstile } from "./turnstile";

export function RegisterForm({
	onSuccess,
}: {
	onSuccess: Dispatch<SetStateAction<boolean>>;
}) {
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const [turnstile, setTurnstile] = useState<{
		token: Nullable<string>;
		loading: boolean;
		error: boolean;
		interactive: boolean;
	}>({ token: null, loading: true, error: false, interactive: false });

	const createUserSchema = baseCreateUserSchema
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
				.refine((password) => REGEXES.number.test(password), {
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

	const form = useForm<z.infer<typeof createUserSchema>>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			email: "",
			password: "",
		},
		mode: "all",
	});

	const { formState } = form;

	async function onSubmit(values: z.infer<typeof createUserSchema>) {
		setLoading(true);
		try {
			const res = await axios.post<ApiResponse>(api("/auth/register"), {
				...values,
				cfTurnstileToken: turnstile.token,
			});
			const feedback = message(res.data.code, "success");

			if (res.status === 201) {
				toast.success({
					text: feedback.title,
					description: feedback.description,
				});
			}
			onSuccess(true);
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
					<h1 className="font-bold text-2xl tracking-tight">
						{t("auth.register.title")}
					</h1>
					<p className="text-balance text-2xs text-muted-foreground">
						{t("auth.register.subtitle")}
					</p>
				</div>
				<div className="grid gap-2">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.register.emailLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("auth.register.emailPlaceholder")}
										required
										type="email"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="displayName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.register.nameLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("auth.register.namePlaceholder")}
										type="text"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.register.passwordLabel")}</FormLabel>
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
								<FormLabel>{t("auth.register.confirmPasswordLabel")}</FormLabel>
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
				</div>
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
						t("auth.register.submit")
					)}
				</Button>
				<div className="text-center text-2xs">
					{t("auth.register.haveAccount")}{" "}
					<Link className="underline underline-offset-4" href="/auth/login">
						{t("auth.register.login")}
					</Link>
				</div>
			</form>
		</Form>
	);
}
