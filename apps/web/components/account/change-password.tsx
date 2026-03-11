"use client";

import { PASSWORD_RESTRICTION_REGEXES as REGEXES } from "@fixr/constants/enforcements";
import { changePasswordAuthenticatedSchema as baseChangePasswordAuthenticatedSchema } from "@fixr/schemas/credentials";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { AxiosError } from "axios";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axios } from "@/lib/auth/axios";
import { fallbackMessages, messages } from "@/lib/messages";
import { api } from "@/lib/utils";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from "../ui/form";

export function ChangePassword() {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);

	const changePasswordAuthenticatedSchema =
		baseChangePasswordAuthenticatedSchema
			.extend({
				new: z
					.string()
					.min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
					.max(128, { message: "A senha deve ter no máximo 128 caracteres." })
					.refine((password) => REGEXES.lowercase.test(password), {
						message: "A senha deve conter pelo menos uma letra maiúscula.",
					})
					.refine((password) => REGEXES.uppercase.test(password), {
						message: "A senha deve conter pelo menos uma letra minúscula.",
					})
					.refine((password) => REGEXES.number.test(password), {
						message: "A senha deve conter pelo menos um número.",
					})
					.refine((password) => REGEXES.special.test(password), {
						message: "A senha deve conter pelo menos um caractere especial.",
					}),
				confirmNew: z
					.string({ error: "Por favor, confirme sua senha." })
					.min(1, { message: "Confirme sua senha." }),
			})
			.refine((data) => data.new === data.confirmNew, {
				message: "As senhas não coincidem.",
				path: ["confirmNew"],
			});

	const form = useForm<z.infer<typeof changePasswordAuthenticatedSchema>>({
		resolver: zodResolver(changePasswordAuthenticatedSchema),
		defaultValues: {
			old: "",
			new: "",
		},
		mode: "all",
	});

	const { formState } = form;

	async function onSubmit(
		values: z.infer<typeof changePasswordAuthenticatedSchema>
	) {
		setLoading(true);
		try {
			const res = await axios.put<ApiResponse>(
				api("/credentials/password"),
				values,
				{
					withCredentials: true,
				}
			);
			if (res.status === 200) {
				const message = messages[res.data.code] ?? fallbackMessages.success;
				setOpen(false);

				toast.success({
					text: message.title,
					description: message.description,
				});
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
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button size={"sm"}>Mudar</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Alterar senha</DialogTitle>
					<DialogDescription>
						Insira sua senha atual e a nova senha que você deseja usar.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						className="grid gap-4 py-4"
						id="change_password"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						<div className="grid grid-cols-4 items-start gap-4">
							<Label className="py-3 text-right" htmlFor="name">
								Atual
							</Label>
							<FormField
								control={form.control}
								name="old"
								render={({ field }) => (
									<FormItem className="col-span-3">
										<FormControl>
											<Input
												className="col-span-3"
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
						<div className="grid grid-cols-4 items-start gap-4">
							<Label className="py-3 text-right" htmlFor="username">
								Nova
							</Label>
							<FormField
								control={form.control}
								name="new"
								render={({ field }) => (
									<FormItem className="col-span-3">
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
						<div className="grid grid-cols-4 items-start gap-4">
							<Label className="py-3 text-right" htmlFor="name">
								Confirmar
							</Label>
							<FormField
								control={form.control}
								name="confirmNew"
								render={({ field }) => (
									<FormItem className="col-span-3">
										<FormControl>
											<Input
												className="col-span-3"
												placeholder="••••••••"
												required
												type="password"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Confirme sua senha para garantir que não haja erros de
											digitação, mantendo sua conta segura.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</form>
				</Form>
				<div />
				<DialogFooter>
					<Button
						disabled={loading || !formState.isValid}
						form="change_password"
						type="submit"
					>
						{loading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<>
								Salvar <Save />
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
