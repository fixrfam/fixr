"use client";

import { cnpj, cpf, unmask } from "@fixr/constants/masks";
import { defaultMessages, messages } from "@fixr/constants/messages";
import { createCompanySchema } from "@fixr/schemas/companies";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import axios, { AxiosError, type AxiosResponse } from "axios";
import { ChevronsUpDown, Dices, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { generateRandomPassword, tryCatch } from "@/lib/utils";

export function CreateCompany() {
	const [loading, setLoading] = useState(false);

	const form = useForm<z.infer<typeof createCompanySchema>>({
		resolver: zodResolver(createCompanySchema),
		defaultValues: {
			name: "",
			cnpj: "",
			address: "",
			subdomain: "",
			owner_email: "",
			owner_password: "",
			owner_cpf: "",
		},
		mode: "all",
	});

	async function onSubmit(values: z.infer<typeof createCompanySchema>) {
		setLoading(true);

		const formatted: z.infer<typeof createCompanySchema> = {
			...values,
			subdomain: values.subdomain.toLowerCase(),
			cnpj: unmask.cnpj(values.cnpj),
			owner_cpf: unmask.cpf(values.owner_cpf),
		};

		try {
			const { data: response, error } = await tryCatch<
				AxiosResponse<ApiResponse>
			>(axios.post("/api/companies", formatted));

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
		} finally {
			setLoading(false);
		}
	}

	const cnpjMask = useMaskito({ options: { mask: cnpj } });
	const cpfMask = useMaskito({ options: { mask: cpf } });

	function setPwd() {
		form.setValue("owner_password", generateRandomPassword());
		form.trigger();
	}

	return (
		<Form {...form}>
			<form
				className="max-w-md space-y-4"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome da empresa *</FormLabel>
							<FormControl>
								<Input placeholder="Acme Inc." {...field} />
							</FormControl>
							<FormDescription>
								Como o nome fantasia da empresa.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="cnpj"
					render={({ field }) => (
						<FormItem>
							<FormLabel>CNPJ *</FormLabel>
							<FormControl>
								<Input
									placeholder="12.345.678/0001-00"
									{...field}
									onInput={(e) => form.setValue("cnpj", e.currentTarget.value)}
									ref={cnpjMask}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="subdomain"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Subdomínio</FormLabel>
							<FormControl>
								<Input placeholder="example" {...field} />
							</FormControl>
							<FormDescription>
								Domínio -{" "}
								{form.getValues("subdomain").length
									? form.getValues("subdomain")
									: "exemplo"}
								.fixr.ricardo.gg
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="owner_email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email do proprietário *</FormLabel>
							<FormControl>
								<Input placeholder="email@exemplo.com" {...field} />
							</FormControl>
							<FormDescription>
								Ele receberá sua senha de acesso (redefinível) neste email.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="owner_cpf"
					render={({ field }) => (
						<FormItem>
							<FormLabel>CPF do proprietário *</FormLabel>
							<FormControl>
								<Input
									placeholder="123.456.789-00"
									{...field}
									onInput={(e) =>
										form.setValue("owner_cpf", e.currentTarget.value)
									}
									ref={cpfMask}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="owner_password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Senha do proprietário*</FormLabel>
							<FormControl>
								<div className="flex w-full items-center gap-2">
									<PasswordInput
										className="grow"
										placeholder="•••••••"
										{...field}
									/>
									<Button
										onClick={() => setPwd()}
										type="button"
										variant={"outline"}
									>
										<Dices className="size-4" />
										Gerar
									</Button>
								</div>
							</FormControl>
							<FormDescription>
								Será enviada para o email especificado.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Collapsible>
					<CollapsibleTrigger className="inline-flex items-center gap-1 text-muted-foreground text-xs">
						<ChevronsUpDown className="size-3" />
						Campos opcionais
					</CollapsibleTrigger>
					<CollapsibleContent className="mt-2">
						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Endereço</FormLabel>
									<FormControl>
										<Input placeholder="1234 Main St" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CollapsibleContent>
				</Collapsible>
				<Button
					className="w-full"
					disabled={!form.formState.isValid || loading}
					type="submit"
				>
					Criar {loading ? <Loader2 className="animate-spin" /> : <Plus />}
				</Button>
			</form>
		</Form>
	);
}
