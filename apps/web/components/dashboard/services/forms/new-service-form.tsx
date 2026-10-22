"use client";

import { useTranslation } from "@fixr/i18n/react";
import { type ServiceRow, serviceDeviceCategories } from "@fixr/mock";
import { createServiceSchema } from "@fixr/schemas/services";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Check, ChevronsUpDown, Plus, Save, X } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { numberInputProps } from "@/components/dashboard/parts/forms/number-input";
import { usePartsStore } from "@/components/dashboard/parts/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TopicsInput } from "./topics-input";

function toggle(ids: string[], id: string) {
	return ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id];
}

export function NewServiceForm({
	service,
	onSuccess,
	className,
	...props
}: ComponentPropsWithoutRef<"form"> & {
	/** When given, the form edits this service instead of creating a new one. */
	service?: ServiceRow;
	onSuccess?: () => void;
}) {
	const { t, format } = useTranslation();
	const parts = usePartsStore((state) => state.parts);
	const addService = usePartsStore((state) => state.addService);
	const updateService = usePartsStore((state) => state.updateService);

	const form = useForm<z.infer<typeof createServiceSchema>>({
		resolver: zodResolver(createServiceSchema),
		defaultValues: service ?? {
			name: "",
			description: "",
			partIds: [],
			deviceCategories: [],
			testInstructions: [],
			testParameters: [],
		},
		mode: "all",
	});

	function onSubmit(values: z.infer<typeof createServiceSchema>) {
		//TODO: enviar para a API quando a rota de serviços existir
		const data = {
			...values,
			deviceCategories:
				values.deviceCategories as ServiceRow["deviceCategories"],
		};

		if (service) {
			updateService(service.id, data);
			toast.success({ text: t("services.form.updated") });
		} else {
			addService(data);
			toast.success({ text: t("services.form.created") });
		}

		onSuccess?.();
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
								<FormLabel>{t("services.form.nameLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("services.form.namePlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>{t("services.form.descriptionLabel")}</FormLabel>
								<FormControl>
									<Textarea
										placeholder={t("services.form.descriptionPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="deviceCategories"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>
									{t("services.form.deviceCategoriesLabel")}
								</FormLabel>
								<div className="flex flex-wrap gap-2">
									{serviceDeviceCategories.map((category) => {
										const selected = field.value.includes(category);

										return (
											<Button
												aria-pressed={selected}
												key={category}
												onClick={() =>
													field.onChange(toggle(field.value, category))
												}
												size="sm"
												type="button"
												variant={selected ? "default" : "outline"}
											>
												{selected && <Check className="size-3.5" />}
												{category}
											</Button>
										);
									})}
								</div>
								<FormDescription>
									{t("services.form.deviceCategoriesDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="estimatedDurationMinutes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("services.form.durationLabel")}</FormLabel>
								<FormControl>
									<Input
										min={1}
										placeholder="60"
										step="1"
										{...numberInputProps(field)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("services.form.priceLabel")}</FormLabel>
								<FormControl>
									<Input
										min={0}
										placeholder={format.number(0, { minimumFractionDigits: 2 })}
										step="0.01"
										{...numberInputProps(field)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="partIds"
						render={({ field }) => {
							const selected = parts.filter((part) =>
								field.value.includes(part.id)
							);

							return (
								<FormItem className="col-span-full">
									<FormLabel>{t("services.form.partsLabel")}</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													className="w-full justify-between font-normal"
													role="combobox"
													type="button"
													variant="outline"
												>
													{selected.length > 0
														? t("services.form.partsSelected", {
																count: selected.length,
															})
														: t("services.form.partsPlaceholder")}
													<ChevronsUpDown className="size-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent
											align="start"
											className="w-(--radix-popover-trigger-width) p-0"
										>
											<Command>
												<CommandInput
													placeholder={t("services.form.partsSearch")}
												/>
												<CommandList>
													<CommandEmpty>
														{t("services.form.partsEmpty")}
													</CommandEmpty>
													<CommandGroup>
														{parts.map((part) => (
															<CommandItem
																key={part.id}
																keywords={[part.sku, part.category]}
																onSelect={() =>
																	field.onChange(toggle(field.value, part.id))
																}
																value={part.name}
															>
																<Check
																	className={cn(
																		"size-4",
																		field.value.includes(part.id)
																			? "opacity-100"
																			: "opacity-0"
																	)}
																/>
																<span className="flex-1 truncate">
																	{part.name}
																</span>
																<span className="font-mono text-muted-foreground text-xs">
																	{part.sku}
																</span>
															</CommandItem>
														))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									{selected.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{selected.map((part) => (
												<Badge
													className="rounded-md"
													key={part.id}
													variant="secondary"
												>
													{part.name}
													<button
														aria-label={t("services.form.removeItem", {
															name: part.name,
														})}
														onClick={() =>
															field.onChange(toggle(field.value, part.id))
														}
														type="button"
													>
														<X className="size-3" />
													</button>
												</Badge>
											))}
										</div>
									)}
									<FormDescription>
										{t("services.form.partsDescription")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="testInstructions"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>
									{t("services.form.testInstructionsLabel")}
								</FormLabel>
								<TopicsInput
									onChange={field.onChange}
									placeholder={t("services.form.testInstructionsPlaceholder")}
									value={field.value}
								/>
								<FormDescription>
									{t("services.form.testInstructionsDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="testParameters"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>{t("services.form.testParametersLabel")}</FormLabel>
								<TopicsInput
									onChange={field.onChange}
									placeholder={t("services.form.testParametersPlaceholder")}
									value={field.value}
								/>
								<FormDescription>
									{t("services.form.testParametersDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{service ? (
					<Button
						className="w-full"
						disabled={!form.formState.isDirty}
						type="submit"
					>
						{t("common.actions.saveChanges")} <Save />
					</Button>
				) : (
					<Button className="w-full" type="submit">
						{t("services.form.submit")} <Plus />
					</Button>
				)}
			</form>
		</Form>
	);
}
