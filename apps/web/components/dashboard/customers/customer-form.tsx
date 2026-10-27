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
	type LucideIcon,
	Mail,
	MapPin,
	PhoneIcon,
	Smartphone,
	User,
} from "lucide-react";
import type {
	ComponentPropsWithoutRef,
	HTMLAttributes,
	ReactNode,
	RefCallback,
} from "react";
import { type Control, useForm } from "react-hook-form";
import type { z } from "zod";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
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

	const split = cols === 2 && "sm:grid-cols-2";

	return (
		<Form {...form}>
			<form
				className={cn("grid gap-6", className)}
				onSubmit={(e) => {
					// Opened over other forms (a new order): keep their submit out of it.
					e.stopPropagation();
					form.handleSubmit(onSubmit)(e);
				}}
				{...props}
			>
				<FormSection title={t("clients.form.identitySection")}>
					<TextField
						control={form.control}
						description={t("clients.form.nameDescription")}
						icon={User}
						label={t("clients.form.nameLabel")}
						name="name"
						placeholder={t("clients.form.namePlaceholder")}
					/>
					<div className={cn("grid gap-4", split)}>
						<TextField
							control={form.control}
							description={t("clients.form.documentDescription")}
							icon={IdCard}
							inputMode="numeric"
							label={t("clients.form.documentLabel")}
							maskRef={cpfMask}
							name="cpf"
							onInput={(value) => form.setValue("cpf", value)}
							placeholder={t("clients.form.documentPlaceholder")}
						/>
						<TextField
							control={form.control}
							description={t("clients.form.emailDescription")}
							icon={Mail}
							inputMode="email"
							label={t("clients.form.emailLabel")}
							name="email"
							placeholder={t("clients.form.emailPlaceholder")}
						/>
					</div>
				</FormSection>

				<FormSection title={t("clients.form.contactSection")}>
					<div className={cn("grid gap-4", split)}>
						<TextField
							control={form.control}
							description={t("clients.form.phoneDescription")}
							icon={PhoneIcon}
							inputMode="tel"
							label={t("clients.form.phoneLabel")}
							maskRef={phoneMask}
							name="phone"
							onInput={(value) => form.setValue("phone", value)}
							placeholder={t("clients.form.phonePlaceholder")}
						/>
						<TextField
							control={form.control}
							description={t("clients.form.alternativePhoneDescription")}
							icon={Smartphone}
							inputMode="tel"
							label={t("clients.form.alternativePhoneLabel")}
							maskRef={altPhoneMask}
							name="alternativePhone"
							onInput={(value) => form.setValue("alternativePhone", value)}
							placeholder={t("clients.form.alternativePhonePlaceholder")}
						/>
					</div>
				</FormSection>

				<FormSection title={t("clients.form.addressSection")}>
					<TextField
						control={form.control}
						description={t("clients.form.addressDescription")}
						icon={MapPin}
						label={t("clients.form.addressLabel")}
						name="address"
						placeholder={t("clients.form.addressPlaceholder")}
					/>
					<div
						className={cn(
							"grid gap-4",
							cols === 2 && "sm:grid-cols-[1fr_9rem]"
						)}
					>
						<TextField
							control={form.control}
							description={t("clients.form.cityDescription")}
							icon={Building}
							label={t("clients.form.cityLabel")}
							name="city"
							placeholder={t("clients.form.cityPlaceholder")}
						/>
						<TextField
							control={form.control}
							description={t("clients.form.stateDescription")}
							icon={Building}
							label={t("clients.form.stateLabel")}
							maxLength={2}
							name="state"
							placeholder={t("clients.form.statePlaceholder")}
						/>
					</div>
				</FormSection>

				<Button className="w-full" disabled={saving} size="lg" type="submit">
					{t(customer ? "clients.form.save" : "clients.form.submit")}
					{saving ? <Loader2 className="animate-spin" /> : <User />}
				</Button>
			</form>
		</Form>
	);
}

type Values = z.infer<typeof createClientSchema>;

/** A titled group of fields. */
function FormSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<fieldset className="m-0 grid min-w-0 gap-4 border-0 p-0">
			<legend className="mb-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{title}
			</legend>
			{children}
		</fieldset>
	);
}

/** One text field: label with its icon, input, what it's for, and the error. */
function TextField({
	control,
	name,
	label,
	icon: Icon,
	placeholder,
	description,
	maskRef,
	onInput,
	inputMode,
	maxLength,
}: {
	control: Control<Values>;
	name: keyof Values;
	label: string;
	icon: LucideIcon;
	placeholder: string;
	description: string;
	/** Maskito's ref, for masked inputs (CPF, phones). */
	maskRef?: RefCallback<HTMLElement>;
	/** Masked inputs report what the mask typed. */
	onInput?: (value: string) => void;
	inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
	maxLength?: number;
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="gap-2">
					<FormLabel className="gap-1.5">
						<Icon className="size-3.5 text-muted-foreground" />
						{label}
					</FormLabel>
					<FormControl>
						<Input
							inputMode={inputMode}
							maxLength={maxLength}
							placeholder={placeholder}
							{...field}
							onInput={
								onInput ? (e) => onInput(e.currentTarget.value) : undefined
							}
							ref={maskRef ?? field.ref}
							value={field.value ?? ""}
						/>
					</FormControl>
					<FormDescription className="text-xs">{description}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
