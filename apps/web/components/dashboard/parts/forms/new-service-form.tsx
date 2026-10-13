"use client";

import { type ServiceRow, serviceDeviceCategories } from "@fixr/mock";
import { createServiceSchema } from "@fixr/schemas/parts";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Check, ChevronsUpDown, Plus, Save, X } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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
import { usePartsStore } from "../store";
import { numberInputProps } from "./number-input";
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
			toast.success({ text: "Serviço atualizado com sucesso!" });
		} else {
			addService(data);
			toast.success({ text: "Serviço cadastrado com sucesso!" });
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
								<FormLabel>Nome</FormLabel>
								<FormControl>
									<Input placeholder="Troca de tela" {...field} />
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
								<FormLabel>Descrição</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Descreva o que está incluso no serviço"
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
								<FormLabel>Categorias de aparelho</FormLabel>
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
									Em quais tipos de aparelho este serviço é feito.
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
								<FormLabel>Duração estimada (minutos)</FormLabel>
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
								<FormLabel>Preço (R$)</FormLabel>
								<FormControl>
									<Input
										min={0}
										placeholder="0,00"
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
									<FormLabel>Peças vinculadas</FormLabel>
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
														? `${selected.length} peça(s) selecionada(s)`
														: "Selecione as peças usadas no serviço"}
													<ChevronsUpDown className="size-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent
											align="start"
											className="w-(--radix-popover-trigger-width) p-0"
										>
											<Command>
												<CommandInput placeholder="Busque por nome ou SKU..." />
												<CommandList>
													<CommandEmpty>Nenhuma peça encontrada.</CommandEmpty>
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
														aria-label={`Remover ${part.name}`}
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
										Opcional. Serviços como diagnóstico não usam peças.
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
								<FormLabel>O que testar após o reparo</FormLabel>
								<TopicsInput
									onChange={field.onChange}
									placeholder="Ex.: Testar o toque em toda a área da tela"
									value={field.value}
								/>
								<FormDescription>
									Adicione um tópico por vez. Eles aparecem como lista nos
									detalhes do serviço.
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
								<FormLabel>Parâmetros de teste</FormLabel>
								<TopicsInput
									onChange={field.onChange}
									placeholder="Ex.: Temperatura em carga: até 40 °C"
									value={field.value}
								/>
								<FormDescription>
									Valores de referência para considerar o reparo aprovado.
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
						Salvar alterações <Save />
					</Button>
				) : (
					<Button className="w-full" type="submit">
						Cadastrar serviço <Plus />
					</Button>
				)}
			</form>
		</Form>
	);
}
