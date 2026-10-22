"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { createAbility } from "@fixr/permissions";
import { createApiKeySchema } from "@fixr/schemas/api-keys";
import type { ApiResponse } from "@fixr/schemas/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import {
	CalendarClock,
	ChevronsUpDown,
	KeyRound,
	Loader2,
	Tag,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { axios } from "@/lib/auth/axios";
import { useSession } from "@/lib/hooks/use-session";
import { api, tryCatch } from "@/lib/utils";
import { groupScopes, scopeLabel } from "./scope-labels";

const EXPIRATION_PRESETS = [
	{ value: "never", days: null },
	{ value: "30", days: 30 },
	{ value: "90", days: 90 },
	{ value: "365", days: 365 },
] as const;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_A_YEAR = 365;

interface CreatedKey {
	secret: string;
	name: string;
}

export function CreateApiKeyForm({
	onCreated,
}: {
	onCreated: (key: CreatedKey) => void;
}) {
	const { t, locale } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const [expiration, setExpiration] = useState<string>("never");
	const [scopes, setScopes] = useState<string[]>([]);
	const { subdomain } = useParams<{ subdomain: string }>();
	const { session } = useSession();
	const queryClient = useQueryClient();

	/**
	 * Only the creator's own permissions can be offered: the API rejects any
	 * scope the creator does not hold, since a key may narrow but never widen.
	 */
	const ability = createAbility(session?.company?.role ?? "guest");
	const availableScopes = groupScopes(t, locale, [...ability.permissions]);

	const form = useForm<z.input<typeof createApiKeySchema>>({
		resolver: zodResolver(createApiKeySchema),
		defaultValues: { name: "", scopes: [] },
		mode: "all",
		reValidateMode: "onChange",
	});

	/** The presets are data, so their copy is resolved at render time. */
	function expirationLabel(days: number | null) {
		if (days === null) {
			return t("apiKeys.create.expirationNever");
		}

		if (days === DAYS_IN_A_YEAR) {
			return t("apiKeys.create.expirationYear");
		}

		return t("apiKeys.create.expirationDays", { count: days });
	}

	function toggleScope(scope: string) {
		setScopes((current) =>
			current.includes(scope)
				? current.filter((s) => s !== scope)
				: [...current, scope]
		);
	}

	async function onSubmit(values: z.input<typeof createApiKeySchema>) {
		setLoading(true);

		const preset = EXPIRATION_PRESETS.find((p) => p.value === expiration);
		const expiresAt = preset?.days
			? new Date(Date.now() + preset.days * MILLISECONDS_PER_DAY)
			: null;

		try {
			const { data: response, error } = await tryCatch<
				AxiosResponse<ApiResponse<{ secret: string; name: string }>>
			>(
				axios.post(api(`/companies/${subdomain}/api-keys`), {
					name: values.name,
					scopes,
					expiresAt,
				})
			);

			if (error && error instanceof AxiosError) {
				const feedback = message(error.response?.data.code, "error");

				toast.error({
					text: feedback.title,
					description: feedback.description,
				});
				return;
			}

			const secret = response?.data.data?.secret;

			if (!secret) {
				const feedback = message(undefined, "error");

				toast.error({
					text: feedback.title,
					description: feedback.description,
				});
				return;
			}

			queryClient.invalidateQueries({ queryKey: ["apiKeysData"] });
			onCreated({ secret, name: values.name });
		} finally {
			setLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<Tag className="mr-1 inline-block size-3.5" />
								{t("apiKeys.create.nameLabel")}
							</FormLabel>
							<FormControl>
								<Input
									placeholder={t("apiKeys.create.namePlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{t("apiKeys.create.nameDescription")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormItem>
					<FormLabel>
						<CalendarClock className="mr-1 inline-block size-3.5" />
						{t("apiKeys.create.expirationLabel")}
					</FormLabel>
					<Select onValueChange={setExpiration} value={expiration}>
						<FormControl>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{EXPIRATION_PRESETS.map((preset) => (
								<SelectItem key={preset.value} value={preset.value}>
									{expirationLabel(preset.days)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormDescription>
						{t("apiKeys.create.expirationDescription")}
					</FormDescription>
				</FormItem>

				<Collapsible className="rounded-md border border-border">
					<CollapsibleTrigger asChild>
						<Button
							className="w-full justify-between px-3"
							type="button"
							variant="ghost"
						>
							<span className="text-sm">
								{t("apiKeys.create.scopesLabel")}
								<span className="ml-2 text-muted-foreground">
									{scopes.length === 0
										? t("apiKeys.create.scopesInherit")
										: t("apiKeys.create.scopesSelected", {
												count: scopes.length,
											})}
								</span>
							</span>
							<ChevronsUpDown className="size-4" />
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-4 border-border border-t p-3">
						<p className="text-muted-foreground text-xs">
							{t("apiKeys.create.scopesHint")}
						</p>
						{availableScopes.map((group) => (
							<div className="space-y-2" key={group.resource}>
								<p className="font-medium text-sm">{group.label}</p>
								<div className="flex flex-wrap gap-1.5">
									{group.scopes.map((scope) => {
										const selected = scopes.includes(scope);
										return (
											<Button
												key={scope}
												onClick={() => toggleScope(scope)}
												size="sm"
												type="button"
												variant={selected ? "default" : "outline"}
											>
												{scopeLabel(t, scope)}
											</Button>
										);
									})}
								</div>
							</div>
						))}
					</CollapsibleContent>
				</Collapsible>

				<Button
					className="w-full"
					disabled={!form.formState.isValid || loading}
					type="submit"
				>
					{t("apiKeys.create.submit")}{" "}
					{loading ? (
						<Loader2 className="animate-spin" />
					) : (
						<KeyRound className="size-4" />
					)}
				</Button>
			</form>
		</Form>
	);
}
