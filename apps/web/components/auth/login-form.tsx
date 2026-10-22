"use client";

import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/web";
import { useMessage, useTranslation } from "@fixr/i18n/react";
import { loginUserSchema } from "@fixr/schemas/auth";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import axios, { AxiosError } from "axios";
import { AlertCircleIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, cn, type Nullable, parseJwt } from "@/lib/utils";
import CookieAlert from "../cookie-alert";
import { Google } from "../svg/google";
import { Logo } from "../svg/logo";
import { AlertDescription, AlertTitle } from "../ui/alert";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Turnstile } from "./turnstile";

export function LoginForm({ errors }: { errors?: { google?: string } }) {
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [turnstile, setTurnstile] = useState<{
		token: Nullable<string>;
		loading: boolean;
		error: boolean;
		interactive: boolean;
	}>({ token: null, loading: true, error: false, interactive: false });

	const form = useForm<z.infer<typeof loginUserSchema>>({
		resolver: zodResolver(loginUserSchema),
		defaultValues: {
			email: "",
			password: "",
		},
		mode: "all",
	});

	const { formState } = form;

	const router = useRouter();

	async function onSubmit(values: z.infer<typeof loginUserSchema>) {
		setLoading(true);
		try {
			const res = await axios.post<ApiResponse<{ token: string }>>(
				api("/auth/login"),
				{ ...values, cfTurnstileToken: turnstile.token },
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
				const jwt = parseJwt(res.data.data?.token);
				router.push(`/dashboard/${jwt?.company?.subdomain}/account`);
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

	function handleGoogleLogin() {
		setGoogleLoading(true);
		router.push(`${env.NEXT_PUBLIC_API_URL}/auth/google`);
	}

	return (
		<Form {...form}>
			<form
				className={cn("flex flex-col gap-6")}
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<div className="flex flex-col items-center gap-2 text-center">
					<Logo className="size-8 text-primary" />
					<h1 className="font-bold text-2xl tracking-tight">
						{t("auth.login.title")}
					</h1>
					<p className="text-balance text-2xs text-muted-foreground">
						{t("auth.login.subtitle")}
					</p>
				</div>
				<div className="grid gap-6">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.login.emailLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("auth.login.emailPlaceholder")}
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
						name="password"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center">
									<FormLabel>{t("auth.login.passwordLabel")}</FormLabel>
									<Link
										className="ml-auto text-2xs underline-offset-4 hover:underline"
										href="/auth/forgot-password"
									>
										{t("auth.login.forgotPassword")}
									</Link>
								</div>
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
							t("auth.login.submit")
						)}
					</Button>
					<div className="relative text-center text-2xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
						<span className="relative z-10 bg-background px-2 text-muted-foreground">
							{t("auth.login.orContinueWith")}
						</span>
					</div>
					<Button
						className="w-full"
						disabled={googleLoading}
						onClick={handleGoogleLogin}
						type="button"
						variant="outline"
					>
						{googleLoading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Google />
						)}
						{t("auth.login.google")}
					</Button>
					{errors?.google && (
						<CookieAlert
							className="border-destructive/50 bg-destructive/20"
							cookieKey={cookieKey("googleAuthError")}
							show={Boolean(errors?.google)}
							variant="destructive"
						>
							<AlertCircleIcon />
							<AlertTitle>{message(errors.google).title}</AlertTitle>
							<AlertDescription>
								<p>{message(errors.google).description}</p>
							</AlertDescription>
						</CookieAlert>
					)}
				</div>
				<div className="text-center text-2xs opacity-30">
					{t("auth.login.disclaimer")}
				</div>
			</form>
		</Form>
	);
}
