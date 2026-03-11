"use client";

import { PASSWORD_RESTRICTION_REGEXES as REGEXES } from "@fixr/constants/enforcements";
import { confirmPasswordResetSchema as baseConfirmPasswordResetSchema } from "@fixr/schemas/credentials";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import axios, { AxiosError } from "axios";
import { Loader2, Lock } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { fallbackMessages, messages } from "@/lib/messages";
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
	const [loading, setLoading] = useState(false);

	const confirmPasswordResetSchema = baseConfirmPasswordResetSchema
		.extend({
			password: z
				.string()
				.min(8, { message: "Deve ter pelo menos 8 caracteres." })
				.max(128, { message: "Deve ter no máximo 128 caracteres." })
				.refine((password) => REGEXES.uppercase.test(password), {
					message: "Deve conter pelo menos uma letra maiúscula.",
				})
				.refine((password) => REGEXES.lowercase.test(password), {
					message: "Deve conter pelo menos uma letra minúscula.",
				})
				.refine((password) => REGEXES.number.test(password), {
					message: "Deve conter pelo menos um número.",
				})
				.refine((password) => REGEXES.special.test(password), {
					message: "Deve conter pelo menos um caractere especial.",
				}),
			confirmPassword: z
				.string({ error: "Por favor, confirme sua senha." })
				.min(1, { message: "Confirme sua senha." }),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "As senhas não coincidem.",
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
				{ token, password: values.password },
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
						<Lock className="size-5" />
					</div>
					<h1 className="whitespace-nowrap font-bold text-2xl tracking-tight">
						Alterar sua senha
					</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Crie uma nova senha segura e preencha abaixo.
					</p>
				</div>
				<div className="grid gap-6">
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Senha *</FormLabel>
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
								<FormLabel>Confirmar senha *</FormLabel>
								<FormControl>
									<Input
										placeholder="••••••••"
										required
										type="password"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									A confirmação ajuda a garantir que não haja erros de
									digitação, mantendo sua conta segura.
								</FormDescription>
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
							"Alterar senha"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
