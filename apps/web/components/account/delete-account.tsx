"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axios } from "@/lib/auth/axios";
import { api } from "@/lib/utils";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";

const DELETE_MATCH_REGEX = /^delete my account$/;

export function DeleteAccount() {
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);

	const requestAccountDeletionSchema = z.object({
		confirmPhrase: z.string().regex(DELETE_MATCH_REGEX, {
			message: t("account.deleteAccount.phraseInvalid"),
		}),
	});

	const form = useForm<z.infer<typeof requestAccountDeletionSchema>>({
		resolver: zodResolver(requestAccountDeletionSchema),
		defaultValues: { confirmPhrase: "" },
		mode: "all",
	});

	const { formState } = form;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async function onSubmit(_: z.infer<typeof requestAccountDeletionSchema>) {
		setLoading(true);
		try {
			const res = await axios.post<ApiResponse>(
				api("/account/request-deletion"),
				{
					withCredentials: true,
				}
			);
			if (res.status === 201) {
				const feedback = message(res.data.code, "success");
				setOpen(false);

				toast.success({
					text: feedback.title,
					description: feedback.description,
				});
			}
		} catch (error) {
			if (error instanceof AxiosError) {
				const errorData = error.response?.data as ApiResponse;
				const feedback = message(errorData.code, "error");

				toast.error({
					text: feedback.title,
					description: feedback.description,
				});
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<AlertDialog onOpenChange={setOpen} open={open}>
			<AlertDialogTrigger asChild>
				<Button size={"sm"} variant={"destructive"}>
					{t("account.deleteAccount.trigger")}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("account.deleteAccount.title")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("account.deleteAccount.description")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<Form {...form}>
					<form id="change_password" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="confirmPhrase"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("account.deleteAccount.phraseLabel")}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t("account.deleteAccount.phrasePlaceholder")}
											required
											type="text"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
					<Button
						disabled={loading || !formState.isValid}
						form="change_password"
						type="submit"
						variant={"destructive"}
					>
						{loading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<>{t("account.deleteAccount.submit")}</>
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
