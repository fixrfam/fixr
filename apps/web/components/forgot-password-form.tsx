"use client";

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
import { fallbackMessages, messages } from "@/lib/messages";
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
	const [loading, setLoading] = useState(false);

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
				values,
				{
					withCredentials: true,
				}
			);
			if (res.status === 201) {
				const message = messages[res.data.code] ?? fallbackMessages.success;

				toast.success({
					text: message.title,
					description: message.description,
				});
				onSuccess(true);
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
						Esqueceu sua senha?
					</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Digite seu e-mail abaixo, redefinimos para você!
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
					<Button
						className="w-full"
						disabled={loading || !formState.isValid}
						type="submit"
					>
						{loading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							"Redefinir senha"
						)}
					</Button>
				</div>
				<div className="text-center text-sm">
					<Link className="underline underline-offset-4" href="/auth/login">
						Voltar
					</Link>
				</div>
			</form>
		</Form>
	);
}
