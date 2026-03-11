"use client";

import { cpf, phone, unmask } from "@fixr/constants/masks";
import { createClientSchema } from "@fixr/schemas/clients";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMaskito } from "@maskito/react";
import { toast } from "@pheralb/toast";
import {
	Building,
	IdCard,
	Loader2,
	Mail,
	MapPin,
	PhoneIcon,
	Smartphone,
	User,
} from "lucide-react";
import { type ComponentPropsWithoutRef, useState } from "react";
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

export function NewClientForm({
	onCustomerCreated,
	cols = 1,
	className,
	...props
}: {
	onCustomerCreated: (cpf: string) => void;
	cols?: number;
} & ComponentPropsWithoutRef<"form">) {
	const [loading, setLoading] = useState(false);

	const form = useForm<z.infer<typeof createClientSchema>>({
		resolver: zodResolver(createClientSchema),
		defaultValues: {
			name: "",
			email: "",
			cpf: "",
			phone: "",
			alternativePhone: "",
			address: "",
			state: "",
			city: "",
		},
		mode: "all",
	});

	const cpfMask = useMaskito({ options: { mask: cpf } });
	const phoneMask = useMaskito({ options: { mask: phone } });
	const altPhoneMask = useMaskito({ options: { mask: phone } });

	function onSubmit(values: z.infer<typeof createClientSchema>) {
		setLoading(true);

		const formattedData = {
			...values,
			cpf: unmask.cpf(values.cpf),
			phone: unmask.phone(values.phone),
			alternativePhone: values.alternativePhone
				? unmask.phone(values.alternativePhone)
				: null,
		};

		try {
			toast.success({
				text: "Cliente cadastrado com sucesso!",
			});

			onCustomerCreated(formattedData.cpf);
		} catch {
			toast.error({
				text: "Erro ao cadastrar cliente",
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form
				className={cn("space-y-3", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div
					className={cn(
						"grid grid-cols-1 gap-4",
						cols === 2 && "md:grid-cols-2"
					)}
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<User className="inline-block size-3.5" /> Nome
								</FormLabel>
								<FormControl>
									<Input placeholder="João da Silva" {...field} />
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
									<Input placeholder="joao.silva@email.com" {...field} />
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
						name="alternativePhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Smartphone className="inline-block size-3.5" /> Telefone
									alternativo
								</FormLabel>
								<FormControl>
									<Input
										placeholder="(00) 00000-0000"
										{...field}
										onInput={(e) =>
											form.setValue("alternativePhone", e.currentTarget.value)
										}
										ref={altPhoneMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="cpf"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<IdCard className="inline-block size-3.5" /> CPF
								</FormLabel>
								<FormControl>
									<Input
										placeholder="000.000.000-00"
										{...field}
										onInput={(e) => form.setValue("cpf", e.currentTarget.value)}
										ref={cpfMask}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>
									<MapPin className="inline-block size-3.5" /> Endereço
								</FormLabel>
								<FormControl>
									<Input placeholder="Rua, Av..." {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="state"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Building className="inline-block size-3.5" /> Estado
								</FormLabel>
								<FormControl>
									<Input placeholder="UF" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Building className="inline-block size-3.5" /> Cidade
								</FormLabel>
								<FormControl>
									<Input placeholder="Cidade" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button className="mt-4 w-full" disabled={loading} type="submit">
					Finalizar cadastro{" "}
					{loading ? <Loader2 className="animate-spin" /> : <User />}
				</Button>
			</form>
		</Form>
	);
}
