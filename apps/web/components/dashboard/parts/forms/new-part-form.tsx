"use client";

import { type PartRow, partCategories } from "@fixr/mock";
import { createPartSchema } from "@fixr/schemas/parts";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Plus, Save } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePartsStore } from "../store";
import { numberInputProps } from "./number-input";

export function NewPartForm({
	part,
	onSuccess,
	className,
	...props
}: Omit<ComponentPropsWithoutRef<"form">, "part"> & {
	/** When given, the form edits this part instead of creating a new one. */
	part?: PartRow;
	onSuccess?: () => void;
}) {
	const suppliers = usePartsStore((state) => state.suppliers);
	const addPart = usePartsStore((state) => state.addPart);
	const updatePart = usePartsStore((state) => state.updatePart);

	const form = useForm<z.infer<typeof createPartSchema>>({
		resolver: zodResolver(createPartSchema),
		defaultValues: part ?? {
			sku: "",
			name: "",
			category: "",
			supplierId: "",
		},
		mode: "all",
	});

	function onSubmit(values: z.infer<typeof createPartSchema>) {
		//TODO: enviar para a API quando a rota de peças existir
		const data = {
			...values,
			category: values.category as PartRow["category"],
		};

		if (part) {
			updatePart(part.id, data);
			toast.success({ text: "Peça atualizada com sucesso!" });
		} else {
			addPart(data);
			toast.success({ text: "Peça cadastrada com sucesso!" });
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
						name="sku"
						render={({ field }) => (
							<FormItem>
								<FormLabel>SKU</FormLabel>
								<FormControl>
									<Input placeholder="TEL-IP13-OLED" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nome</FormLabel>
								<FormControl>
									<Input placeholder="Tela OLED iPhone 13" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Categoria</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecione uma categoria" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{partCategories.map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="supplierId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Fornecedor</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecione um fornecedor" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{suppliers.map((supplier) => (
											<SelectItem key={supplier.id} value={supplier.id}>
												{supplier.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="costPrice"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Preço de custo (R$)</FormLabel>
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
						name="salePrice"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Preço de venda (R$)</FormLabel>
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
						name="stock"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Estoque</FormLabel>
								<FormControl>
									<Input
										min={0}
										placeholder="0"
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
						name="minStock"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Estoque mínimo</FormLabel>
								<FormControl>
									<Input
										min={0}
										placeholder="0"
										step="1"
										{...numberInputProps(field)}
									/>
								</FormControl>
								<FormDescription>
									Abaixo ou igual a esse valor a peça aparece como estoque
									baixo.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{part ? (
					<Button
						className="w-full"
						disabled={!form.formState.isDirty}
						type="submit"
					>
						Salvar alterações <Save />
					</Button>
				) : (
					<Button className="w-full" type="submit">
						Cadastrar peça <Plus />
					</Button>
				)}
			</form>
		</Form>
	);
}
