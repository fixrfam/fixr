"use client";

import { cnpj, phone, unmask } from "@fixr/constants/masks";
import { useTranslation } from "@fixr/i18n/react";
import { createSupplierSchema } from "@fixr/schemas/suppliers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import {
	Building2,
	IdCard,
	Loader2,
	Mail,
	PhoneIcon,
	Plus,
	User,
} from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCreateSupplier } from "@/components/dashboard/parts/store";
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
import { cn } from "@/lib/utils";

export function NewSupplierForm({
	onSuccess,
	className,
	...props
}: ComponentPropsWithoutRef<"form"> & {
	onSuccess?: () => void;
}) {
	const { t } = useTranslation();
	const createSupplier = useCreateSupplier();
	const toastError = useApiErrorToast();

	const form = useForm<z.infer<typeof createSupplierSchema>>({
		resolver: zodResolver(createSupplierSchema),
		defaultValues: {
			name: "",
			cnpj: "",
			contact: "",
			phone: "",
			email: "",
		},
		mode: "all",
	});

	const cnpjMask = useMaskito({ options: { mask: cnpj } });
	const phoneMask = useMaskito({ options: { mask: phone } });

	async function onSubmit(values: z.infer<typeof createSupplierSchema>) {
		try {
			await createSupplier.mutateAsync({
				...values,
				cnpj: unmask.cnpj(values.cnpj),
				phone: unmask.phone(values.phone) ?? "",
			});
			toast.success({ text: t("suppliers.form.created") });
			onSuccess?.();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<Form {...form}>
			<form
				className={cn("space-y-4", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>
									<Building2 className="inline-block size-3.5" />{" "}
									{t("suppliers.form.nameLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("suppliers.form.namePlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="cnpj"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<IdCard className="inline-block size-3.5" />{" "}
									{t("suppliers.form.cnpjLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder="00.000.000/0000-00"
										{...field}
										onInput={(e) =>
											form.setValue("cnpj", e.currentTarget.value)
										}
										ref={cnpjMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="contact"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<User className="inline-block size-3.5" />{" "}
									{t("suppliers.form.contactLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("suppliers.form.contactPlaceholder")}
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
									{t("suppliers.form.phoneLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder="(00) 00000-0000"
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
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Mail className="inline-block size-3.5" />{" "}
									{t("suppliers.form.emailLabel")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("suppliers.form.emailPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button
					className="w-full"
					disabled={createSupplier.isPending}
					type="submit"
				>
					{t("suppliers.form.submit")}{" "}
					{createSupplier.isPending ? (
						<Loader2 className="animate-spin" />
					) : (
						<Plus />
					)}
				</Button>
			</form>
		</Form>
	);
}
