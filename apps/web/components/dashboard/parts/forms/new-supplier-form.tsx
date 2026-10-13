"use client";

import { cnpj, phone } from "@fixr/constants/masks";
import { createSupplierSchema } from "@fixr/schemas/parts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import { Building2, IdCard, Mail, PhoneIcon, Plus, User } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePartsStore } from "../store";

export function NewSupplierForm({
	onSuccess,
	className,
	...props
}: ComponentPropsWithoutRef<"form"> & {
	onSuccess?: () => void;
}) {
	const addSupplier = usePartsStore((state) => state.addSupplier);

	const form = useForm<z.infer<typeof createSupplierSchema>>({
		resolver: zodResolver(createSupplierSchema),
		defaultValues: {
			name: "",
			cnpj: "",
			contact: "",
			phone: "",
			email: "",
		},
		mode: "all",
	});

	const cnpjMask = useMaskito({ options: { mask: cnpj } });
	const phoneMask = useMaskito({ options: { mask: phone } });

	function onSubmit(values: z.infer<typeof createSupplierSchema>) {
		//TODO: enviar para a API (com CNPJ e telefone sem máscara) quando a rota de fornecedores existir
		addSupplier(values);

		toast.success({ text: "Fornecedor cadastrado com sucesso!" });
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
								<FormLabel>
									<Building2 className="inline-block size-3.5" /> Nome
								</FormLabel>
								<FormControl>
									<Input placeholder="TechParts Distribuidora" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="cnpj"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<IdCard className="inline-block size-3.5" /> CNPJ
								</FormLabel>
								<FormControl>
									<Input
										placeholder="00.000.000/0000-00"
										{...field}
										onInput={(e) =>
											form.setValue("cnpj", e.currentTarget.value)
										}
										ref={cnpjMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="contact"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<User className="inline-block size-3.5" /> Contato
								</FormLabel>
								<FormControl>
									<Input placeholder="Nome do responsável" {...field} />
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
									<PhoneIcon className="inline-block size-3.5" /> Telefone
								</FormLabel>
								<FormControl>
									<Input
										placeholder="(00) 00000-0000"
										{...field}
										onInput={(e) =>
											form.setValue("phone", e.currentTarget.value)
										}
										ref={phoneMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Mail className="inline-block size-3.5" /> Email
								</FormLabel>
								<FormControl>
									<Input placeholder="vendas@fornecedor.com.br" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button className="w-full" type="submit">
					Cadastrar fornecedor <Plus />
				</Button>
			</form>
		</Form>
	);
}
