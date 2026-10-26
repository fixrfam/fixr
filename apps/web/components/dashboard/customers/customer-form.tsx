"use client";

import { cpf, phone, unmask } from "@fixr/constants/masks";
import { useTranslation } from "@fixr/i18n/react";
import { createClientSchema } from "@fixr/schemas/clients";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import {
	Building,
	IdCard,
	Loader2,
	Mail,
	MapPin,
	PhoneIcon,
	Smartphone,
	User,
} from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCpf, formatPhone } from "@/lib/format";
import type { CustomerRow } from "@/lib/services/customers";
import { cn } from "@/lib/utils";
import { useCreateCustomer, useUpdateCustomer } from "./store";

/**
 * Registers a customer or, with `customer`, edits one. Answers with the saved
 * record so the caller can pick it (e.g. on a new service order).
 */
export function CustomerForm({
	customer,
	onSaved,
	cols = 1,
	className,
	...props
}: {
	customer?: CustomerRow;
	onSaved?: (customer: CustomerRow) => void;
	cols?: number;
} & Omit<ComponentPropsWithoutRef<"form">, "onSubmit">) {
	const { t } = useTranslation();
	const createCustomer = useCreateCustomer();
	const updateCustomer = useUpdateCustomer(customer?.id ?? "");
	const toastError = useApiErrorToast();
	const saving = createCustomer.isPending || updateCustomer.isPending;

	const form = useForm<z.infer<typeof createClientSchema>>({
		resolver: zodResolver(createClientSchema),
		defaultValues: {
			name: customer?.name ?? "",
			email: customer?.email ?? "",
			cpf: formatCpf(customer?.cpf),
			phone: formatPhone(customer?.phone),
			alternativePhone: formatPhone(customer?.alternativePhone),
			address: customer?.address ?? "",
			state: customer?.state ?? "",
			city: customer?.city ?? "",
		},
		mode: "all",
	});

	const cpfMask = useMaskito({ options: { mask: cpf } });
	const phoneMask = useMaskito({ options: { mask: phone } });
	const altPhoneMask = useMaskito({ options: { mask: phone } });

	async function onSubmit(values: z.infer<typeof createClientSchema>) {
		const body = {
			...values,
			cpf: unmask.cpf(values.cpf),
			phone: unmask.phone(values.phone) ?? "",
			alternativePhone: values.alternativePhone
				? (unmask.phone(values.alternativePhone) ?? "")
				: "",
		};

		try {
			const saved = customer
				? await updateCustomer.mutateAsync(body)
				: await createCustomer.mutateAsync(body);
			toast.success({
				text: t(customer ? "clients.form.updated" : "clients.form.success"),
			});
			onSaved?.(saved);
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<Form {...form}>
			<form
				className={cn("space-y-3", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div
					className={cn(
						"grid grid-cols-1 gap-4",
						cols === 2 && "md:grid-cols-2"
					)}
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<User className="inline-block size-3.5" />{" "}
									{t("clients.form.nameLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.namePlaceholder")}
										{...field}
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
									<Mail className="inline-block size-3.5" />{" "}
									{t("clients.form.emailLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.emailPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<PhoneIcon className="inline-block size-3.5" />{" "}
									{t("clients.form.phoneLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.phonePlaceholder")}
										{...field}
										onInput={(e) =>
											form.setValue("phone", e.currentTarget.value)
										}
										ref={phoneMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="alternativePhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Smartphone className="inline-block size-3.5" />{" "}
									{t("clients.form.alternativePhoneLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.phonePlaceholder")}
										{...field}
										onInput={(e) =>
											form.setValue("alternativePhone", e.currentTarget.value)
										}
										ref={altPhoneMask}
									/>
								</FormControl>
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
									<IdCard className="inline-block size-3.5" />{" "}
									{t("clients.form.documentLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.documentPlaceholder")}
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
						name="address"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>
									<MapPin className="inline-block size-3.5" />{" "}
									{t("clients.form.addressLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.addressPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="state"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Building className="inline-block size-3.5" />{" "}
									{t("clients.form.stateLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.statePlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Building className="inline-block size-3.5" />{" "}
									{t("clients.form.cityLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("clients.form.cityPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button className="mt-4 w-full" disabled={saving} type="submit">
					{t(customer ? "clients.form.save" : "clients.form.submit")}{" "}
					{saving ? <Loader2 className="animate-spin" /> : <User />}
				</Button>
			</form>
		</Form>
	);
}
