"use client";

import { phone } from "@fixr/constants/masks";
import { useMessage, useTranslation } from "@fixr/i18n/react";
import { updateCompanyProfileSchema } from "@fixr/schemas/companies";
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
	type LucideIcon,
	Mail,
	MapPin,
	PhoneIcon,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ImageUploadDialog } from "@/components/image-upload-dialog";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCnpj, formatPhone } from "@/lib/format";
import {
	type Company,
	updateCompanyProfile,
	uploadCompanyLogo,
} from "@/lib/services/company";

type FormValues = z.input<typeof updateCompanyProfileSchema>;

/** Layout shared by the form and its skeleton, so loading never shifts it. */
const LAYOUT = {
	root: "grid gap-10 lg:grid-cols-[16rem_1fr]",
	logo: "space-y-3",
	fields: "space-y-6",
	pair: "grid gap-6 md:grid-cols-2",
	preview:
		"flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border bg-muted/40",
} as const;

/** Logos are cropped to the same 16:9 frame the preview shows. */
const LOGO_CROP = { shape: "rectangle", aspectRatio: 16 / 9 } as const;

export function CompanyProfileForm({ company }: { company: Company }) {
	const { t } = useTranslation();
	const message = useMessage();
	const queryClient = useQueryClient();
	const phoneMask = useMaskito({ options: { mask: phone } });
	const [saving, setSaving] = useState(false);
	const [logoDialogOpen, setLogoDialogOpen] = useState(false);

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

	const uploadLabel = logoUrl
		? t("company.logo.replace")
		: t("company.logo.upload");

	function showError(error: unknown) {
		const code =
			error instanceof AxiosError ? error.response?.data?.code : undefined;
		const feedback = message(code, "error");
		toast.error({ text: feedback.title, description: feedback.description });
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
			<form className={LAYOUT.root} onSubmit={form.handleSubmit(onSubmit)}>
				<div className={LAYOUT.logo}>
					<div>
						<h3 className="font-medium text-sm">{t("company.logo.title")}</h3>
						<p className="text-muted-foreground text-xs">
							{t("company.logo.description")}
						</p>
					</div>
					<div className={LAYOUT.preview}>
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
					<div className="flex gap-2">
						<Button
							className="flex-1"
							onClick={() => setLogoDialogOpen(true)}
							size="sm"
							type="button"
							variant="outline"
						>
							<ImageUp className="size-4" />
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
					<ImageUploadDialog
						copy={{
							title: t("company.logo.dialogTitle"),
							stepSelect: t("company.logo.stepSelect"),
							stepCrop: t("company.logo.stepCrop"),
							stepUploading: t("company.logo.stepUploading"),
							saving: t("company.logo.saving"),
							dropzoneTitle: t("company.logo.dropzoneTitle"),
							dropzoneHint: t("company.logo.dropzoneHint"),
							alt: t("company.logo.alt"),
							success: t("company.logo.uploaded"),
							error: t("company.logo.uploadError"),
						}}
						crop={LOGO_CROP}
						icon={<ImageUp />}
						onOpenChange={setLogoDialogOpen}
						onUploaded={(url) =>
							form.setValue("logoUrl", url, { shouldDirty: true })
						}
						open={logoDialogOpen}
						upload={uploadCompanyLogo}
					/>
				</div>

				<div className={LAYOUT.fields}>
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
								<FormDescription>
									{t("company.form.nameDescription")}
								</FormDescription>
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
								<FormDescription>
									{t("company.form.addressDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className={LAYOUT.pair}>
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
									<FormDescription>
										{t("company.form.emailDescription")}
									</FormDescription>
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
									<FormDescription>
										{t("company.form.phoneDescription")}
									</FormDescription>
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
								<FormDescription>
									{t("company.form.websiteDescription")}
								</FormDescription>
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

/** A field of the skeleton: the real label and description around a placeholder input. */
function FieldSkeleton({
	Icon,
	label,
	description,
}: {
	Icon: LucideIcon;
	label: string;
	description: string;
}) {
	return (
		<div className="grid gap-2">
			<Label>
				<Icon className="inline-block size-3.5" /> {label}
			</Label>
			<Skeleton className="h-9 w-full" />
			<p className="text-2xs text-muted-foreground">{description}</p>
		</div>
	);
}

/**
 * Loading state with the exact layout of `CompanyProfileForm`. Labels and
 * descriptions don't depend on the company, so they render for real and only
 * the values are placeholders.
 */
export function CompanyProfileFormSkeleton() {
	const { t } = useTranslation();

	return (
		<div aria-busy="true" className={LAYOUT.root}>
			<div className={LAYOUT.logo}>
				<div>
					<h3 className="font-medium text-sm">{t("company.logo.title")}</h3>
					<p className="text-muted-foreground text-xs">
						{t("company.logo.description")}
					</p>
				</div>
				<Skeleton className="aspect-video w-full rounded-md" />
				<Skeleton className="h-7.5 w-full" />
			</div>
			<div className={LAYOUT.fields}>
				<FieldSkeleton
					description={t("company.form.nameDescription")}
					Icon={Building2}
					label={t("company.form.name")}
				/>
				<FieldSkeleton
					description={t("company.form.cnpjDescription")}
					Icon={IdCard}
					label={t("company.form.cnpj")}
				/>
				<FieldSkeleton
					description={t("company.form.addressDescription")}
					Icon={MapPin}
					label={t("company.form.address")}
				/>
				<div className={LAYOUT.pair}>
					<FieldSkeleton
						description={t("company.form.emailDescription")}
						Icon={Mail}
						label={t("company.form.email")}
					/>
					<FieldSkeleton
						description={t("company.form.phoneDescription")}
						Icon={PhoneIcon}
						label={t("company.form.phone")}
					/>
				</div>
				<FieldSkeleton
					description={t("company.form.websiteDescription")}
					Icon={Globe}
					label={t("company.form.website")}
				/>
				<div className="flex justify-end">
					<Skeleton className="h-8.5 w-36" />
				</div>
			</div>
		</div>
	);
}
