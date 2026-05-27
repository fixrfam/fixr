"use client";

import { cpf, unmask } from "@fixr/constants/masks";
import { getDevices } from "@fixr/mock";
import { createOrderServiceSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Trash2, UserPlus } from "lucide-react";
import { type ComponentPropsWithoutRef, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DeviceOption {
	id: string;
	marca: string;
	categoria: string;
	modelo: string;
}

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NewClientForm } from "../clients/new-client-form";

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error("Erro ao ler imagem"));
		reader.readAsDataURL(file);
	});
}
function getFilePreviewKey(file: File): string {
	return `${file.name}-${file.size}-${file.lastModified}`;
}

export function NewServiceOrderForm({
	className,
	...props
}: ComponentPropsWithoutRef<"form">) {
	const form = useForm<z.infer<typeof createOrderServiceSchema>>({
		resolver: zodResolver(createOrderServiceSchema),
		defaultValues: {
			customerCPF: "",
			deviceIMEI: "",
			description: "",
			notes: "",
			deviceId: "",
			assigned_to: "",
			images: [],
		},
		mode: "all",
	});

	const cpfMask = useMaskito({ options: { mask: cpf } });

	const handleCustomerCreated = (cpf: string) => {
		form.setValue("customerCPF", cpf);
	};

	const onSubmit = (values: z.infer<typeof createOrderServiceSchema>) => {
		const formattedValues = {
			...values,
			customerCPF: unmask.cpf(values.customerCPF),
		};

		console.log("Ordem de serviço a ser criada:", formattedValues);
	};

	const [selectedMarca, setSelectedMarca] = useState("");
	const [selectedCategoria, setSelectedCategoria] = useState("");

	const { data: devices = [], isLoading: loadingDevices } = useQuery<
		DeviceOption[]
	>({
		queryKey: ["devices"],
		queryFn: getDevices,
		//TODO: implementar fetch real para devices
	});

	const marcas = useMemo(() => {
		return [...new Set(devices.map((device) => device.marca))];
	}, [devices]);

	const categorias = useMemo(() => {
		if (!selectedMarca) {
			return [];
		}
		return [
			...new Set(
				devices
					.filter((device) => device.marca === selectedMarca)
					.map((device) => device.categoria)
			),
		];
	}, [devices, selectedMarca]);

	const modelos = useMemo(() => {
		if (!(selectedMarca && selectedCategoria)) {
			return [];
		}

		return devices.filter(
			(device) =>
				device.marca === selectedMarca && device.categoria === selectedCategoria
		);
	}, [devices, selectedMarca, selectedCategoria]);

	const modeloPlaceholder = useMemo(() => {
		if (!(selectedMarca && selectedCategoria)) {
			return "Selecione marca e categoria primeiro";
		}

		if (loadingDevices) {
			return "Carregando modelos...";
		}

		return "Selecione um modelo";
	}, [selectedMarca, selectedCategoria, loadingDevices]);

	const selectedImages = form.watch("images") ?? [];

	const { data: previewUrlsByKey = {} } = useQuery<Record<string, string>>({
		queryKey: ["image-previews", selectedImages.map(getFilePreviewKey)],
		enabled: selectedImages.length > 0,
		queryFn: () =>
			Promise.all(
				selectedImages.map(async (file) => {
					const key = getFilePreviewKey(file);
					const url = await fileToDataUrl(file);
					return [key, url] as const;
				})
			).then((entries) => Object.fromEntries(entries)),
		staleTime: Number.POSITIVE_INFINITY,
	});

	return (
		<Form {...form}>
			<form
				className={cn("space-y-4", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div className="flex grow gap-4">
					<div className="flex grow flex-col gap-4">
						<FormField
							control={form.control}
							name="customerCPF"
							render={({ field }) => (
								<FormItem className="grow">
									<FormLabel>CPF do cliente</FormLabel>
									<FormControl>
										<Input
											placeholder="123.456.789-00"
											{...field}
											onInput={(e) =>
												form.setValue("customerCPF", e.currentTarget.value)
											}
											ref={cpfMask}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Sheet>
						<SheetTrigger asChild className="mt-5.5">
							<Button className="shrink-0" type="button">
								Cadastrar novo <UserPlus className="size-4" />
							</Button>
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>Novo cliente</SheetTitle>
								<SheetDescription>
									Cadastre um novo cliente preenchendo os campos abaixo.
								</SheetDescription>
							</SheetHeader>
							<NewClientForm
								className="px-4"
								onCustomerCreated={handleCustomerCreated}
							/>
						</SheetContent>
					</Sheet>
				</div>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Defeito relatado pelo cliente</FormLabel>
							<FormControl>
								<Textarea
									autoCapitalize="off"
									autoCorrect="off"
									placeholder="Descreva o defeito relatado pelo cliente"
									spellCheck={false}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormItem className="flex-grow">
					<FormLabel>Marca</FormLabel>
					<FormControl>
						<Select
							disabled={loadingDevices}
							onValueChange={(value) => {
								setSelectedMarca(value);
								setSelectedCategoria("");
								form.setValue("deviceId", "", { shouldValidate: true });
							}}
							value={selectedMarca}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={
										loadingDevices ? "Carregando..." : "Selecione uma marca"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{marcas.map((marca) => (
									<SelectItem key={marca} value={marca}>
										{marca}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormControl>
					<FormMessage />
				</FormItem>

				<FormItem className="flex-grow">
					<FormLabel>Categoria do aparelho</FormLabel>
					<FormControl>
						<Select
							disabled={!selectedMarca || loadingDevices}
							onValueChange={(value) => {
								setSelectedCategoria(value);
								form.setValue("deviceId", "", { shouldValidate: true });
							}}
							value={selectedCategoria}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={
										loadingDevices
											? "Carregando categorias..."
											: "Selecione uma categoria"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{categorias.map((categoria) => (
									<SelectItem key={categoria} value={categoria}>
										{categoria}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormControl>
					<FormMessage />
				</FormItem>

				<FormField
					control={form.control}
					name="deviceId"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Modelo</FormLabel>
							<FormControl>
								<Select
									disabled={
										!(selectedMarca && selectedCategoria) || loadingDevices
									}
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={modeloPlaceholder} />
									</SelectTrigger>
									<SelectContent>
										{modelos.map((modelo) => (
											<SelectItem key={modelo.id} value={modelo.id}>
												{modelo.modelo}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="deviceIMEI"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Número de IMEI</FormLabel>
							<FormControl>
								<Input placeholder="123456789012345" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Observações</FormLabel>
							<FormControl>
								<Textarea
									autoCapitalize="off"
									autoCorrect="off"
									placeholder="Adicione observações sobre a ordem de serviço"
									spellCheck={false}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="images"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Fotos do aparelho</FormLabel>
							<FormControl>
								<div className="space-y-3">
									<input
										accept="image/*"
										className="hidden"
										id="images-upload"
										multiple
										onChange={(e) => {
											const files = Array.from(e.target.files ?? []);
											field.onChange(files);
										}}
										type="file"
									/>

									<label
										className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-muted-foreground text-sm hover:bg-accent hover:text-foreground"
										htmlFor="images-upload"
									>
										<span>
											{selectedImages.length > 0
												? `${selectedImages.length} imagem(ns) selecionada(s)`
												: "Selecione fotos do aparelho (PNG, JPG, WEBP)"}
										</span>
										<ImagePlus className="h-4 w-4" />
									</label>

									{selectedImages.length > 0 ? (
										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
											{selectedImages.map((file) => {
												const fileKey = getFilePreviewKey(file);
												const url = previewUrlsByKey[fileKey];

												if (!url) {
													return null;
												}

												return (
													<div
														className="relative aspect-square overflow-hidden rounded-md border"
														key={fileKey}
													>
														<img
															alt={file.name}
															className="h-full w-full object-cover"
															height={320}
															src={url}
															width={320}
														/>

														<button
															aria-label={`Remover ${file.name}`}
															className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
															onClick={() => {
																const nextFiles = selectedImages.filter(
																	(currentFile) =>
																		getFilePreviewKey(currentFile) !== fileKey
																);
																field.onChange(nextFiles);
															}}
															type="button"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												);
											})}
										</div>
									) : null}
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="pt-4">
					<Button className="w-full" type="submit">
						Salvar ordem de serviço
					</Button>
				</div>
			</form>
		</Form>
	);
}
