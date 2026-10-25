"use client";

import { PASSWORD_RESTRICTION_REGEXES as REGEXES } from "@fixr/constants/enforcements";
import { useMessage, useTranslation } from "@fixr/i18n/react";
import { changePasswordAuthenticatedSchema as baseChangePasswordAuthenticatedSchema } from "@fixr/schemas/credentials";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { AxiosError } from "axios";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axios } from "@/lib/auth/axios";
import { api } from "@/lib/utils";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from "../ui/form";

export function ChangePassword() {
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);

	const changePasswordAuthenticatedSchema =
		baseChangePasswordAuthenticatedSchema
			.extend({
				new: z
					.string()
					.min(8, { message: t("validation.password.min", { count: 8 }) })
					.max(128, { message: t("validation.password.max", { count: 128 }) })
					.refine((password) => REGEXES.lowercase.test(password), {
						message: t("validation.password.uppercase"),
					})
					.refine((password) => REGEXES.uppercase.test(password), {
						message: t("validation.password.lowercase"),
					})
					.refine((password) => REGEXES.number.test(password), {
						message: t("validation.password.number"),
					})
					.refine((password) => REGEXES.special.test(password), {
						message: t("validation.password.special"),
					}),
				confirmNew: z
					.string({ error: t("validation.password.confirm") })
					.min(1, { message: t("validation.password.confirm") }),
			})
			.refine((data) => data.new === data.confirmNew, {
				message: t("validation.password.mismatch"),
				path: ["confirmNew"],
			});

	const form = useForm<z.infer<typeof changePasswordAuthenticatedSchema>>({
		resolver: zodResolver(changePasswordAuthenticatedSchema),
		defaultValues: {
			old: "",
			new: "",
		},
		mode: "all",
	});

	const { formState } = form;

	async function onSubmit(
		values: z.infer<typeof changePasswordAuthenticatedSchema>
	) {
		setLoading(true);
		try {
			const res = await axios.put<ApiResponse>(
				api("/credentials/password"),
				values,
				{
					withCredentials: true,
				}
			);
			if (res.status === 200) {
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
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button size={"sm"}>{t("account.changePassword.trigger")}</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("account.changePassword.title")}</DialogTitle>
					<DialogDescription>
						{t("account.changePassword.description")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						className="grid gap-4 py-4"
						id="change_password"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						<div className="grid grid-cols-4 items-start gap-4">
							<Label className="py-3 text-right" htmlFor="name">
								{t("account.changePassword.current")}
							</Label>
							<FormField
								control={form.control}
								name="old"
								render={({ field }) => (
									<FormItem className="col-span-3">
										<FormControl>
											<Input
												className="col-span-3"
												placeholder="••••••••"
												required
												type="password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-4 items-start gap-4">
							<Label className="py-3 text-right" htmlFor="username">
								{t("account.changePassword.new")}
							</Label>
							<FormField
								control={form.control}
								name="new"
								render={({ field }) => (
									<FormItem className="col-span-3">
										<FormControl>
											<Input
												placeholder="••••••••"
												required
												type="password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-4 items-start gap-4">
							<Label className="py-3 text-right" htmlFor="name">
								{t("account.changePassword.confirm")}
							</Label>
							<FormField
								control={form.control}
								name="confirmNew"
								render={({ field }) => (
									<FormItem className="col-span-3">
										<FormControl>
											<Input
												className="col-span-3"
												placeholder="••••••••"
												required
												type="password"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											{t("account.changePassword.confirmDescription")}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</form>
				</Form>
				<div />
				<DialogFooter>
					<Button
						disabled={loading || !formState.isValid}
						form="change_password"
						type="submit"
					>
						{loading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<>
								{t("common.actions.save")} <Save />
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
