"use client";

import { cpf, unmask } from "@fixr/constants/masks";
import { defaultMessages, messages } from "@fixr/constants/messages";
import { roleLabels } from "@fixr/constants/roles";
import type { userJWT } from "@fixr/schemas/auth";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import {
	BriefcaseBusiness,
	Dices,
	IdCard,
	Loader2,
	Lock,
	Mail,
	Plus,
	User,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/ui/password-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { axios } from "@/lib/auth/axios";
import { api, tryCatch } from "@/lib/utils";
import { generateRandomPassword } from "@/lib/utils/generate-random-password";

export function CreateEmployeeForm({
	session,
	onSuccess,
}: {
	session: z.infer<typeof userJWT>;
	onSuccess: () => void;
}) {
	const [loading, setLoading] = useState(false);

	const form = useForm<z.infer<typeof createEmployeeSchema>>({
		resolver: zodResolver(createEmployeeSchema),
		defaultValues: {
			cpf: "",
			email: "",
			name: "",
			password: "",
		},
		mode: "all",
		reValidateMode: "onChange",
	});

	const queryClient = useQueryClient();

	async function onSubmit(values: z.infer<typeof createEmployeeSchema>) {
		setLoading(true);

		const formatted: z.infer<typeof createEmployeeSchema> = {
			...values,
			cpf: unmask.cpf(values.cpf),
		};

		try {
			const { data: response, error } = await tryCatch<
				AxiosResponse<ApiResponse>
			>(
				axios.post(
					api(`/companies/${session.company?.subdomain}/employees`),
					formatted
				)
			);

			if (error && error instanceof AxiosError) {
				const message =
					messages[error.response?.data.code] ?? defaultMessages.error;

				toast.error({
					text: message.title,
					description: message.description,
				});
				return;
			}

			const message =
				messages[response?.data.code as string] ?? defaultMessages.success;

			toast.success({
				text: message.title,
				description: message.description,
			});

			onSuccess();
			queryClient.invalidateQueries({ queryKey: ["employeesData"] });
		} finally {
			setLoading(false);
		}
	}

	const cpfMask = useMaskito({ options: { mask: cpf } });
	// const phoneMask = useMaskito({ options: { mask: phone } });

	function generatePwd() {
		form.setValue("password", generateRandomPassword());
		form.trigger();
	}

	return (
		<Form {...form}>
			<form
				className="max-w-xl space-y-5"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<User className="mr-1 inline-block size-3.5" />
								Nome do funcionário
							</FormLabel>
							<FormControl>
								<Input placeholder="João da Silva" {...field} />
							</FormControl>
							<FormDescription>
								Este será o nome exibido no sistema.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<BriefcaseBusiness className="mr-1 inline-block size-3.5" />
								Cargo
							</FormLabel>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Selecione um cargo" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.entries(roleLabels).map(([role, label]) => (
										<SelectItem key={role} value={role}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>
								Nível de acesso do funcionário no Fixr.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="cpf"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<IdCard className="mr-1 inline-block size-3.5" />
								CPF
							</FormLabel>
							<FormControl>
								<Input
									placeholder="123.456.789-00"
									{...field}
									onInput={(e) => form.setValue("cpf", e.currentTarget.value)}
									ref={cpfMask}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<Mail className="mr-1 inline-block size-3.5" />
								Email
							</FormLabel>
							<FormControl>
								<Input placeholder="email@funcionario.com" {...field} />
							</FormControl>
							<FormDescription>
								Utilizado para login no sistema.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<Lock className="mr-1 inline-block size-3.5" />
								Senha
							</FormLabel>
							<FormControl>
								<div className="flex w-full items-center gap-2">
									<PasswordInput
										className="grow"
										placeholder="••••••••"
										{...field}
									/>
									<Button
										onClick={() => generatePwd()}
										type="button"
										variant={"outline"}
									>
										<Dices className="size-3.5" />
										Gerar
									</Button>
								</div>
							</FormControl>
							<FormDescription>A senha de login do funcionário</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="pt-2">
					<Button
						className="w-full"
						disabled={!form.formState.isValid || loading}
						type="submit"
					>
						Cadastrar{" "}
						{loading ? <Loader2 className="animate-spin" /> : <Plus />}
					</Button>
				</div>
			</form>
		</Form>
	);
}
