"use client";
import { cpf, unmask } from "@fixr/constants/masks";
import { useMessage, useTranslation } from "@fixr/i18n/react";
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
import { useParams } from "next/navigation";
import { type ComponentPropsWithoutRef, useState } from "react";
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
import { roleLabelKeys } from "@/lib/i18n/labels";
import { generateRandomPassword } from "@/lib/utils/generate-random-password";

export function NewEmployeeForm({
	onSuccess,
}: ComponentPropsWithoutRef<"form"> & {
	onSuccess?: () => void;
}) {
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const { subdomain } = useParams<{ subdomain: string }>();

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
			>(axios.post(api(`/companies/${subdomain}/employees`), formatted));

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

			onSuccess?.();
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
				className="max-w-3xl space-y-5"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<User className="mr-1 inline-block size-3.5" />
								{t("employees.form.nameLabel")}
							</FormLabel>
							<FormControl>
								<Input
									placeholder={t("employees.form.namePlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{t("employees.form.nameDescription")}
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
								{t("employees.form.roleLabel")}
							</FormLabel>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={t("employees.form.rolePlaceholder")}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.entries(roleLabelKeys).map(([role, labelKey]) => (
										<SelectItem key={role} value={role}>
											{t(labelKey)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>
								{t("employees.form.roleDescription")}
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
								{t("employees.form.documentLabel")}
							</FormLabel>
							<FormControl>
								<Input
									placeholder={t("employees.form.documentPlaceholder")}
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
								{t("employees.form.emailLabel")}
							</FormLabel>
							<FormControl>
								<Input
									placeholder={t("employees.form.emailPlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{t("employees.form.emailDescription")}
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
								{t("employees.form.passwordLabel")}
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
										{t("employees.form.generate")}
									</Button>
								</div>
							</FormControl>
							<FormDescription>
								{t("employees.form.passwordDescription")}
							</FormDescription>
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
						{t("employees.form.submit")}{" "}
						{loading ? <Loader2 className="animate-spin" /> : <Plus />}
					</Button>
				</div>
			</form>
		</Form>
	);
}
