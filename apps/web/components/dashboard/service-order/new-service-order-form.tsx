"use client";

import { createOrderServiceSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
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
		},
	});

	const handleCustomerCreated = (cpf: string) => {
		form.setValue("customerCpf", cpf);
	};

	const onSubmit = (_values: z.infer<typeof createOrderServiceSchema>) => {
		// TODO: Implement service order creation API call
	};

	return (
		<Form {...form}>
			<form
				className={cn("space-y-4", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div className="flex items-end gap-4">
					<FormField
						control={form.control}
						name="customerCpf"
						render={({ field }) => (
							<FormItem className="flex-grow">
								<FormLabel>CPF do cliente</FormLabel>
								<div className="flex items-center gap-2">
									<FormControl>
										<Input placeholder="123.456.789-00" {...field} />
									</FormControl>
									<Sheet>
										<SheetTrigger asChild>
											<Button type="button">
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
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="pt-4">
					<Button className="w-full" type="submit">
						Salvar ordem de serviço
					</Button>
				</div>
			</form>
		</Form>
	);
}
