"use client";

import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/web";
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
import { fallbackMessages, messages } from "@/lib/messages";
import { api, cn, parseJwt } from "@/lib/utils";
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

export function LoginForm({ errors }: { errors?: { google?: string } }) {
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);

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
				values,
				{
					withCredentials: true,
				}
			);
			if (res.status === 200) {
				const message = messages[res.data.code] ?? fallbackMessages.success;

				toast.success({
					text: message.title,
					description: message.description,
				});
				const jwt = parseJwt(res.data.data?.token);
				router.push(`/dashboard/${jwt?.company?.subdomain}/account`);
			}
		} catch (error) {
			if (error instanceof AxiosError) {
				const errorData = error.response?.data as ApiResponse;
				const message = messages[errorData.code] ?? fallbackMessages.error;

				toast.error({
					text: message.title,
					description: message.description,
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
						Bem vindo ao Fixr!
					</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Insira suas credenciais e entre na sua conta
					</p>
				</div>
				<div className="grid gap-6">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>E-mail *</FormLabel>
								<FormControl>
									<Input
										placeholder="email@exemplo.com"
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
									<FormLabel>Senha *</FormLabel>
									<Link
										className="ml-auto text-sm underline-offset-4 hover:underline"
										href="/auth/forgot-password"
									>
										Esqueceu sua senha?
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
					<Button
						className="w-full"
						disabled={loading || !formState.isValid}
						type="submit"
					>
						{loading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
					</Button>
					<div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
						<span className="relative z-10 bg-background px-2 text-muted-foreground">
							Ou continue com
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
						Entrar com Google
					</Button>
					{errors?.google && (
						<CookieAlert
							className="border-destructive/50 bg-destructive/20"
							cookieKey={cookieKey("googleAuthError")}
							show={Boolean(errors?.google)}
							variant="destructive"
						>
							<AlertCircleIcon />
							<AlertTitle>{messages[errors.google]?.title}</AlertTitle>
							<AlertDescription>
								<p>{messages[errors.google]?.description}</p>
							</AlertDescription>
						</CookieAlert>
					)}
				</div>
				<div className="text-center text-sm opacity-30">
					Projeto universitário sem fins lucrativos.
				</div>
			</form>
		</Form>
	);
}
