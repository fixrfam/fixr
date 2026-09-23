"use client";

import { useAuth } from "@clerk/nextjs";
import { cnpj, cpf } from "@fixr/constants/masks";
import { useMessage, useTranslation } from "@fixr/i18n/react";
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
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const { getToken } = useAuth();

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
		};

		const token = await getToken();

		try {
			const { data: response, error } = await tryCatch<
				AxiosResponse<ApiResponse>
			>(
				axios.post(`${process.env.NEXT_PUBLIC_API_URL}/companies`, formatted, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
			);

			if (error && error instanceof AxiosError) {
				const feedback = message(error.response?.data.code, "error");

				toast.error({
					text: feedback.title,
					description: feedback.description,
				});
				return;
			}

			const feedback = message(response?.data.code, "success");

			toast.success({
				text: feedback.title,
				description: feedback.description,
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
							<FormLabel>{t("admin.createCompany.nameLabel")}</FormLabel>
							<FormControl>
								<Input
									placeholder={t("admin.createCompany.namePlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{t("admin.createCompany.nameDescription")}
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
							<FormLabel>{t("admin.createCompany.documentLabel")}</FormLabel>
							<FormControl>
								<Input
									placeholder={t("admin.createCompany.documentPlaceholder")}
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
							<FormLabel>{t("admin.createCompany.subdomainLabel")}</FormLabel>
							<FormControl>
								<Input
									placeholder={t("admin.createCompany.subdomainPlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{t("admin.createCompany.subdomainDescription", {
									subdomain:
										form.getValues("subdomain") ||
										t("admin.createCompany.subdomainFallback"),
								})}
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
							<FormLabel>{t("admin.createCompany.ownerEmailLabel")}</FormLabel>
							<FormControl>
								<Input
									placeholder={t("admin.createCompany.ownerEmailPlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{t("admin.createCompany.ownerEmailDescription")}
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
							<FormLabel>
								{t("admin.createCompany.ownerDocumentLabel")}
							</FormLabel>
							<FormControl>
								<Input
									placeholder={t(
										"admin.createCompany.ownerDocumentPlaceholder"
									)}
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
							<FormLabel>
								{t("admin.createCompany.ownerPasswordLabel")}
							</FormLabel>
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
										{t("admin.createCompany.generate")}
									</Button>
								</div>
							</FormControl>
							<FormDescription>
								{t("admin.createCompany.ownerPasswordDescription")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Collapsible>
					<CollapsibleTrigger className="inline-flex items-center gap-1 text-muted-foreground text-xs">
						<ChevronsUpDown className="size-3" />
						{t("admin.createCompany.optionalFields")}
					</CollapsibleTrigger>
					<CollapsibleContent className="mt-2">
						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.createCompany.addressLabel")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("admin.createCompany.addressPlaceholder")}
											{...field}
										/>
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
					{t("admin.createCompany.submit")}{" "}
					{loading ? <Loader2 className="animate-spin" /> : <Plus />}
				</Button>
			</form>
		</Form>
	);
}
