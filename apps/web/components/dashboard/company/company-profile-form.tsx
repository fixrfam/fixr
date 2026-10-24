"use client";

import { phone } from "@fixr/constants/masks";
import { useMessage, useTranslation } from "@fixr/i18n/react";
import { updateCompanyProfileSchema } from "@fixr/schemas/companies";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
	dropTargetProps,
	ImageDropzone,
	ImageUploadDialog,
	useImagePicker,
} from "@/components/image-upload-dialog";
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
	companyQueryKey,
	updateCompanyProfile,
	uploadCompanyLogo,
} from "@/lib/services/company";
import { cn } from "@/lib/utils";

type FormValues = z.input<typeof updateCompanyProfileSchema>;

/** Layout shared by the form and its skeleton, so loading never shifts it. */
const LAYOUT = {
	root: "flex flex-col gap-10",
	section: "space-y-5",
	identity: "grid gap-6 md:grid-cols-[15rem_1fr]",
	fields: "space-y-6",
	pair: "grid gap-6 md:grid-cols-2",
	logoFrame: "aspect-video w-full rounded-xl",
	footer: "flex items-center justify-between gap-4",
} as const;

/** Logos are cropped to the same 16:9 frame the preview shows. */
const LOGO_CROP = { shape: "rectangle", aspectRatio: 16 / 9 } as const;

/** Section header: title plus a one line explanation. */
function SectionHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="space-y-1">
			<h2 className="font-semibold text-xl tracking-tight">{title}</h2>
			<p className="text-muted-foreground text-sm">{description}</p>
		</div>
	);
}

/** Current logo with replace and remove actions on hover (always shown on touch screens). */
function LogoPreview({
	url,
	onPick,
	onRemove,
}: {
	url: string;
	onPick: (file: File) => void;
	onRemove: () => void;
}) {
	const { t } = useTranslation();
	const picker = useImagePicker(onPick);

	return (
		<div
			className={cn(
				"group relative overflow-hidden border bg-muted/30",
				LAYOUT.logoFrame,
				picker.isDragging && "border-primary border-dashed"
			)}
			{...dropTargetProps(picker)}
		>
			<input {...picker.getInputProps()} className="sr-only" tabIndex={-1} />
			<img
				alt={t("company.logo.alt")}
				className="size-full object-contain p-4"
				height={135}
				src={url}
				width={240}
			/>
			<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
				<Button
					onClick={picker.openFileDialog}
					size="sm"
					type="button"
					variant="outline"
				>
					<RefreshCw className="size-4" />
					{t("company.logo.replace")}
				</Button>
				<Button onClick={onRemove} size="sm" type="button" variant="secondary">
					<Trash2 className="size-4" />
					{t("company.logo.remove")}
				</Button>
			</div>
		</div>
	);
}

/** A field label with the description under the control, like `FormItem`. */
function StaticField({
	label,
	description,
	children,
}: {
	label: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="grid gap-2">
			<Label>{label}</Label>
			{children}
			<p className="text-2xs text-muted-foreground">{description}</p>
		</div>
	);
}

export function CompanyProfileForm({ company }: { company: Company }) {
	const { t } = useTranslation();
	const message = useMessage();
	const queryClient = useQueryClient();
	const phoneMask = useMaskito({ options: { mask: phone } });
	const [saving, setSaving] = useState(false);
	const [pickedLogo, setPickedLogo] = useState<File | null>(null);

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
		queryClient.invalidateQueries({
			queryKey: companyQueryKey(company.subdomain),
		});
		form.reset(values);
	}

	return (
		<Form {...form}>
			<form className={LAYOUT.root} onSubmit={form.handleSubmit(onSubmit)}>
				<section className={LAYOUT.section}>
					<SectionHeader
						description={t("company.sections.identity.description")}
						title={t("company.sections.identity.title")}
					/>
					<div className={LAYOUT.identity}>
						<StaticField
							description={t("company.logo.description")}
							label={t("company.logo.title")}
						>
							{logoUrl ? (
								<LogoPreview
									onPick={setPickedLogo}
									onRemove={() =>
										form.setValue("logoUrl", "", { shouldDirty: true })
									}
									url={logoUrl}
								/>
							) : (
								<ImageDropzone
									className={LAYOUT.logoFrame}
									compact
									hint={t("company.logo.pickHint")}
									onPick={setPickedLogo}
									title={t("company.logo.upload")}
								/>
							)}
						</StaticField>
						<div className={LAYOUT.fields}>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("company.form.name")}</FormLabel>
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
								<FormLabel>{t("company.form.cnpj")}</FormLabel>
								<Input disabled value={formatCnpj(company.cnpj)} />
								<FormDescription>
									{t("company.form.cnpjDescription")}
								</FormDescription>
							</FormItem>
						</div>
					</div>
				</section>

				<section className={LAYOUT.section}>
					<SectionHeader
						description={t("company.sections.contact.description")}
						title={t("company.sections.contact.title")}
					/>
					<div className={LAYOUT.fields}>
						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.form.address")}</FormLabel>
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
										<FormLabel>{t("company.form.email")}</FormLabel>
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
										<FormLabel>{t("company.form.phone")}</FormLabel>
										<FormControl>
											<Input
												inputMode="tel"
												placeholder={t("company.form.phonePlaceholder")}
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
									<FormLabel>{t("company.form.website")}</FormLabel>
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
					</div>
					<div className={LAYOUT.footer}>
						<p className="text-muted-foreground text-sm">
							{t("company.form.saveHint")}
						</p>
						<div className="flex items-center gap-2">
							{form.formState.isDirty ? (
								<Button
									disabled={saving}
									onClick={() => form.reset()}
									type="button"
									variant="ghost"
								>
									{t("company.form.discard")}
								</Button>
							) : null}
							<Button
								disabled={saving || !form.formState.isDirty}
								type="submit"
							>
								{saving ? <Loader2 className="size-4 animate-spin" /> : null}
								{t("company.form.save")}
							</Button>
						</div>
					</div>
				</section>
			</form>
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
				file={pickedLogo}
				icon={<ImageUp />}
				onOpenChange={(open) => {
					if (!open) {
						setPickedLogo(null);
					}
				}}
				onUploaded={(url) =>
					form.setValue("logoUrl", url, { shouldDirty: true })
				}
				open={pickedLogo !== null}
				upload={uploadCompanyLogo}
			/>
		</Form>
	);
}

/** A field of the skeleton: the real label and description around a placeholder input. */
function FieldSkeleton({
	label,
	description,
}: {
	label: string;
	description: string;
}) {
	return (
		<StaticField description={description} label={label}>
			<Skeleton className="h-9 w-full" />
		</StaticField>
	);
}

/**
 * Loading state with the exact layout of `CompanyProfileForm`. Titles, labels
 * and descriptions don't depend on the company, so they render for real and
 * only the values are placeholders.
 */
export function CompanyProfileFormSkeleton() {
	const { t } = useTranslation();

	return (
		<div aria-busy="true" className={LAYOUT.root}>
			<section className={LAYOUT.section}>
				<SectionHeader
					description={t("company.sections.identity.description")}
					title={t("company.sections.identity.title")}
				/>
				<div className={LAYOUT.identity}>
					<StaticField
						description={t("company.logo.description")}
						label={t("company.logo.title")}
					>
						<Skeleton className={LAYOUT.logoFrame} />
					</StaticField>
					<div className={LAYOUT.fields}>
						<FieldSkeleton
							description={t("company.form.nameDescription")}
							label={t("company.form.name")}
						/>
						<FieldSkeleton
							description={t("company.form.cnpjDescription")}
							label={t("company.form.cnpj")}
						/>
					</div>
				</div>
			</section>
			<section className={LAYOUT.section}>
				<SectionHeader
					description={t("company.sections.contact.description")}
					title={t("company.sections.contact.title")}
				/>
				<div className={LAYOUT.fields}>
					<FieldSkeleton
						description={t("company.form.addressDescription")}
						label={t("company.form.address")}
					/>
					<div className={LAYOUT.pair}>
						<FieldSkeleton
							description={t("company.form.emailDescription")}
							label={t("company.form.email")}
						/>
						<FieldSkeleton
							description={t("company.form.phoneDescription")}
							label={t("company.form.phone")}
						/>
					</div>
					<FieldSkeleton
						description={t("company.form.websiteDescription")}
						label={t("company.form.website")}
					/>
				</div>
				<div className={LAYOUT.footer}>
					<p className="text-muted-foreground text-sm">
						{t("company.form.saveHint")}
					</p>
					<Skeleton className="h-8.5 w-36" />
				</div>
			</section>
		</div>
	);
}
