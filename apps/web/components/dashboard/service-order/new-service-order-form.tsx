"use client";

import { createOrderServiceSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, UserPlus } from "lucide-react";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Option {
	id: string;
	name: string;
}
interface CategoriaOption {
	id: string;
	name: string;
}
interface ModeloOption {
	id: string;
	name: string;
}
interface EmployeeOption {
	id: string;
	name: string;
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
			customerCpf: "",
			customerImei: "",
			openData: "",
			openHora: "",
			descricao: "",
			observacoes: "",
			marcaId: "",
			categoriaId: "",
			modeloId: "",
			creatorEmployeeId: "",
		},
		mode: "all",
	});

	const handleCustomerCreated = (cpf: string) => {
		form.setValue("customerCpf", cpf);
	};

	const onSubmit = (values: z.infer<typeof createOrderServiceSchema>) => {
		console.log("Ordem de serviço a ser criada:", values);
	};

	const [marcas, setMarcas] = useState<Option[]>([]);
	const [loadingMarcas, setLoadingMarcas] = useState(false);

	useEffect(() => {
		const loadMarcas = async () => {
			setLoadingMarcas(true);
			try {
				const res = await fetch("/api/marcas"); //alterar dps a rota correta
				const data = await res.json();
				setMarcas(data);
			} finally {
				setLoadingMarcas(false);
			}
		};
		loadMarcas();
	}, []);

	const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
	const [loadingCategorias, setLoadingCategorias] = useState(false);

	useEffect(() => {
		const loadCategorias = async () => {
			setLoadingCategorias(true);
			try {
				const res = await fetch("/api/categorias-aparelho"); //alterar dps a rota correta
				const data = await res.json();
				setCategorias(data);
			} finally {
				setLoadingCategorias(false);
			}
		};

		loadCategorias();
	}, []);

	const [modelos, setModelos] = useState<ModeloOption[]>([]);
	const [loadingModelos, setLoadingModelos] = useState(false);

	const marcaId = form.watch("marcaId");
	const categoriaId = form.watch("categoriaId");

	useEffect(() => {
		const loadModelos = async () => {
			if (!(marcaId && categoriaId)) {
				setModelos([]);
				form.setValue("modeloId", "");
				return;
			}

			setLoadingModelos(true);
			try {
				const params = new URLSearchParams({ marcaId, categoriaId });
				const res = await fetch(`/api/modelos?${params.toString()}`);
				const data = await res.json();
				setModelos(data);
			} finally {
				setLoadingModelos(false);
			}
		};

		loadModelos();
	}, [marcaId, categoriaId, form]);

	const preencherHoraAtual = () => {
		const agora = new Date();
		const hora = agora.toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		form.setValue("openHora", hora, {
			shouldValidate: true,
			shouldDirty: true,
		});
	};

	const [employees, setEmployees] = useState<EmployeeOption[]>([]);
	const [loadingEmployees, setLoadingEmployees] = useState(false);

	useEffect(() => {
		const loadEmployees = async () => {
			setLoadingEmployees(true);
			try {
				const res = await fetch("/api/employees");
				const data = await res.json();
				setEmployees(data);
			} finally {
				setLoadingEmployees(false);
			}
		};

		loadEmployees();
	}, []);

	let modeloPlaceholder = "Selecione marca e categoria primeiro";
	if (marcaId && categoriaId) {
		modeloPlaceholder = loadingModelos
			? "Carregando modelos..."
			: "Selecione um modelo";
	}

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
							name="customerCpf"
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
													form.setError("customerCpf", {
														type: "manual",
														message: "Este CPF já está cadastrado.",
													});
												} else {
													form.clearErrors("customerCpf");
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
					name="openData"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Data da Abertura</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="openHora"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Hora da Abertura</FormLabel>
							<FormControl>
								<div className="relative">
									<Input placeholder="HH:MM" {...field} className="pr-10" />
									<button
										aria-label="Preencher hora atual"
										className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onClick={preencherHoraAtual}
										type="button"
									>
										<Clock3 className="size-4" />
									</button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="descricao"
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

				<FormField
					control={form.control}
					name="marcaId"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Marca</FormLabel>
							<FormControl>
								<Select
									disabled={loadingMarcas}
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={
												loadingMarcas ? "Carregando..." : "Selecione uma marca"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{marcas.map((m) => (
											<SelectItem key={m.id} value={m.id}>
												{m.name}
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
					name="categoriaId"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Categoria do aparelho</FormLabel>
							<FormControl>
								<Select
									disabled={loadingCategorias}
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={
												loadingCategorias
													? "Carregando categorias..."
													: "Selecione uma categoria"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{categorias.map((categoria) => (
											<SelectItem key={categoria.id} value={categoria.id}>
												{categoria.name}
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
					name="modeloId"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Modelo</FormLabel>
							<FormControl>
								<Select
									disabled={!(marcaId && categoriaId) || loadingModelos}
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={modeloPlaceholder} />
									</SelectTrigger>
									<SelectContent>
										{modelos.map((modelo) => (
											<SelectItem key={modelo.id} value={modelo.id}>
												{modelo.name}
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
					name="customerImei"
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
					name="creatorEmployeeId"
					render={({ field }) => (
						<FormItem className="flex-grow">
							<FormLabel>Criador da ordem</FormLabel>
							<FormControl>
								<Select
									disabled={loadingEmployees}
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={
												loadingEmployees
													? "Carregando funcionários..."
													: "Selecione o funcionário"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{employees.map((employee) => (
											<SelectItem key={employee.id} value={employee.id}>
												{employee.name}
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
					name="observacoes"
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
