"use client";

import { createOrderServiceSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
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
		},
		mode: "all",
	});

	const handleCustomerCreated = (cpf: string) => {
		form.setValue("customerCPF", cpf);
	};

	const onSubmit = (values: z.infer<typeof createOrderServiceSchema>) => {
		console.log("Ordem de serviço a ser criada:", values);
	};

	const [selectedMarca, setSelectedMarca] = useState("");
	const [selectedCategoria, setSelectedCategoria] = useState("");

	const { data: devices = [], isLoading: loadingDevices } = useQuery<
		DeviceOption[]
	>({
		queryKey: ["devices"],
		queryFn: async () => {
			const res = await fetch("/api/devices");
			if (!res.ok) {
				throw new Error("Erro ao carregar devices");
			}
			return res.json();
		},
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

	return (
		<Form {...form}>
			<form
				className={cn("space-y-4", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div className="flex flex-grow items-end gap-4">
					<div className="flex flex-grow flex-col gap-4">
						<FormField
							control={form.control}
							name="customerCPF"
							render={({ field }) => (
								<FormItem className="flex-grow">
									<FormLabel>CPF do cliente</FormLabel>
									<FormControl>
										<Input
											placeholder="123.456.789-00"
											{...field}
											onBlur={async (e) => {
												field.onBlur();

												const cpf = e.target.value.replace(/\D/g, "");
												if (!cpf) {
													return;
												}
												const res = await fetch(
													`/api/customers/exists?cpf=${cpf}`
												);
												const data = await res.json();

												if (data.exists) {
													form.setError("customerCPF", {
														type: "manual",
														message: "Este CPF já está cadastrado.",
													});
												} else {
													form.clearErrors("customerCPF");
												}
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Sheet>
						<SheetTrigger asChild>
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
								<Textarea placeholder="Descreva o defeito" {...field} />
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
									placeholder="Adicione observações sobre a ordem de serviço"
									{...field}
								/>
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
