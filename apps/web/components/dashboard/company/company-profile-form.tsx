"use client";

import { phone } from "@fixr/constants/masks";
import { useMessage, useTranslation } from "@fixr/i18n/react";
import { updateCompanyProfileSchema } from "@fixr/schemas/companies";
import { MAX_AVATAR_UPLOAD_SIZE_BYTES } from "@fixr/schemas/uploads";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
	Building2,
	Globe,
	IdCard,
	ImageUp,
	Loader2,
	Mail,
	MapPin,
	PhoneIcon,
	Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
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
import { formatCnpj, formatPhone } from "@/lib/format";
import {
	type Company,
	updateCompanyProfile,
	uploadCompanyLogo,
} from "@/lib/services/company";

type FormValues = z.input<typeof updateCompanyProfileSchema>;

const LOGO_TYPES = "image/png,image/jpeg,image/webp";

export function CompanyProfileForm({ company }: { company: Company }) {
	const { t } = useTranslation();
	const message = useMessage();
	const queryClient = useQueryClient();
	const phoneMask = useMaskito({ options: { mask: phone } });
	const fileInput = useRef<HTMLInputElement>(null);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(updateCompanyProfileSchema),
		defaultValues: {
			name: company.name,
			address: company.address ?? "",
			email: company.email ?? "",
			phone: formatPhone(company.phone),
			website: company.website ?? "",
			logoUrl: company.logoUrl ?? "",
		},
		mode: "onBlur",
	});

	const logoUrl = form.watch("logoUrl");

	let uploadLabel = t("company.logo.upload");
	if (uploading) {
		uploadLabel = t("company.logo.uploading");
	} else if (logoUrl) {
		uploadLabel = t("company.logo.replace");
	}

	function showError(error: unknown) {
		const code =
			error instanceof AxiosError ? error.response?.data?.code : undefined;
		const feedback = message(code, "error");
		toast.error({ text: feedback.title, description: feedback.description });
	}

	async function onLogoSelected(file: File | undefined) {
		if (!file) {
			return;
		}
		if (file.size > MAX_AVATAR_UPLOAD_SIZE_BYTES) {
			toast.error({ text: t("company.logo.tooLarge") });
			return;
		}

		setUploading(true);
		const { data: url, error } = await uploadCompanyLogo(file);
		setUploading(false);

		if (error) {
			showError(error);
			return;
		}
		form.setValue("logoUrl", url, { shouldDirty: true });
	}

	async function onSubmit(values: FormValues) {
		setSaving(true);
		const { data: response, error } = await updateCompanyProfile(
			company.subdomain,
			values
		);
		setSaving(false);

		if (error) {
			showError(error);
			return;
		}

		const feedback = message(response.data.code, "success");
		toast.success({ text: feedback.title, description: feedback.description });
		queryClient.invalidateQueries({ queryKey: ["company", company.subdomain] });
		form.reset(values);
	}

	return (
		<Form {...form}>
			<form
				className="grid gap-10 lg:grid-cols-[16rem_1fr]"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<div className="space-y-3">
					<div>
						<h3 className="font-medium text-sm">{t("company.logo.title")}</h3>
						<p className="text-muted-foreground text-xs">
							{t("company.logo.description")}
						</p>
					</div>
					<div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border bg-muted/40">
						{logoUrl ? (
							<img
								alt={t("company.logo.alt")}
								className="max-h-full max-w-full object-contain p-3"
								height={144}
								src={logoUrl}
								width={256}
							/>
						) : (
							<Building2 className="size-10 text-muted-foreground" />
						)}
					</div>
					<input
						accept={LOGO_TYPES}
						className="hidden"
						onChange={(e) => onLogoSelected(e.currentTarget.files?.[0])}
						ref={fileInput}
						type="file"
					/>
					<div className="flex gap-2">
						<Button
							className="flex-1"
							disabled={uploading}
							onClick={() => fileInput.current?.click()}
							size="sm"
							type="button"
							variant="outline"
						>
							{uploading ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<ImageUp className="size-4" />
							)}
							{uploadLabel}
						</Button>
						{logoUrl ? (
							<Button
								onClick={() =>
									form.setValue("logoUrl", "", { shouldDirty: true })
								}
								size="sm"
								type="button"
								variant="ghost"
							>
								<Trash2 className="size-4" />
								{t("company.logo.remove")}
							</Button>
						) : null}
					</div>
				</div>

				<div className="space-y-6">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Building2 className="inline-block size-3.5" />{" "}
									{t("company.form.name")}
								</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormItem>
						<FormLabel>
							<IdCard className="inline-block size-3.5" />{" "}
							{t("company.form.cnpj")}
						</FormLabel>
						<Input disabled value={formatCnpj(company.cnpj)} />
						<FormDescription>
							{t("company.form.cnpjDescription")}
						</FormDescription>
					</FormItem>
					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<MapPin className="inline-block size-3.5" />{" "}
									{t("company.form.address")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("company.form.addressPlaceholder")}
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="grid gap-6 md:grid-cols-2">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<Mail className="inline-block size-3.5" />{" "}
										{t("company.form.email")}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t("company.form.emailPlaceholder")}
											type="email"
											{...field}
											value={field.value ?? ""}
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
										{t("company.form.phone")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											onInput={(e) =>
												form.setValue("phone", e.currentTarget.value, {
													shouldDirty: true,
												})
											}
											ref={phoneMask}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={form.control}
						name="website"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Globe className="inline-block size-3.5" />{" "}
									{t("company.form.website")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("company.form.websitePlaceholder")}
										type="url"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex justify-end">
						<Button disabled={saving || !form.formState.isDirty} type="submit">
							{saving ? <Loader2 className="size-4 animate-spin" /> : null}
							{t("company.form.save")}
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}
