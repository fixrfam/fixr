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
import { type ComponentPropsWithoutRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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

export function NewClientForm({
	onCustomerCreated,
	cols = 1,
	className,
	...props
}: {
	onCustomerCreated: (cpf: string) => void;
	cols?: number;
} & ComponentPropsWithoutRef<"form">) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);

	const form = useForm<z.infer<typeof createClientSchema>>({
		resolver: zodResolver(createClientSchema),
		defaultValues: {
			name: "",
			email: "",
			cpf: "",
			phone: "",
			alternativePhone: "",
			address: "",
			state: "",
			city: "",
		},
		mode: "all",
	});

	const cpfMask = useMaskito({ options: { mask: cpf } });
	const phoneMask = useMaskito({ options: { mask: phone } });
	const altPhoneMask = useMaskito({ options: { mask: phone } });

	function onSubmit(values: z.infer<typeof createClientSchema>) {
		setLoading(true);

		const formattedData = {
			...values,
			cpf: unmask.cpf(values.cpf),
			phone: unmask.phone(values.phone),
			alternativePhone: values.alternativePhone
				? unmask.phone(values.alternativePhone)
				: null,
		};

		try {
			toast.success({
				text: t("clients.form.success"),
			});

			onCustomerCreated(formattedData.cpf);
		} catch {
			toast.error({
				text: t("clients.form.error"),
			});
		} finally {
			setLoading(false);
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
				<Button className="mt-4 w-full" disabled={loading} type="submit">
					{t("clients.form.submit")}{" "}
					{loading ? <Loader2 className="animate-spin" /> : <User />}
				</Button>
			</form>
		</Form>
	);
}
