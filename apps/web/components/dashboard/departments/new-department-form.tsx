"use client";

import { useTranslation } from "@fixr/i18n/react";
import { createDepartmentSchema } from "@fixr/schemas/departments";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Loader2, Network } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
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
import type { DepartmentDetail } from "@/lib/services/departments";
import { useCreateDepartment } from "./store";

/** Name a new department; the caller decides where to go with it. */
export function NewDepartmentForm({
	onSuccess,
}: {
	onSuccess?: (department: DepartmentDetail) => void;
}) {
	const { t } = useTranslation();
	const create = useCreateDepartment();
	const toastError = useApiErrorToast();
	const form = useForm<z.infer<typeof createDepartmentSchema>>({
		resolver: zodResolver(createDepartmentSchema),
		defaultValues: { name: "" },
	});

	async function onSubmit(values: z.infer<typeof createDepartmentSchema>) {
		try {
			const department = await create.mutateAsync(values.name);
			toast.success({ text: t("departments.form.created") });
			onSuccess?.(department as DepartmentDetail);
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<Form {...form}>
			<form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("departments.form.nameLabel")}</FormLabel>
							<FormControl>
								<Input
									autoFocus
									maxLength={80}
									placeholder={t("departments.form.namePlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{t("departments.form.nameDescription")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button disabled={create.isPending} size="lg" type="submit">
					{t("departments.form.submit")}
					{create.isPending ? (
						<Loader2 className="animate-spin" />
					) : (
						<Network />
					)}
				</Button>
			</form>
		</Form>
	);
}
