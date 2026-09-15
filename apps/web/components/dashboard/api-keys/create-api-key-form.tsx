"use client";

import { defaultMessages, messages } from "@fixr/constants/messages";
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
	{ value: "never", label: "Sem expiração", days: null },
	{ value: "30", label: "30 dias", days: 30 },
	{ value: "90", label: "90 dias", days: 90 },
	{ value: "365", label: "1 ano", days: 365 },
] as const;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface CreatedKey {
	secret: string;
	name: string;
}

export function CreateApiKeyForm({
	onCreated,
}: {
	onCreated: (key: CreatedKey) => void;
}) {
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
	const availableScopes = groupScopes([...ability.permissions]);

	const form = useForm<z.input<typeof createApiKeySchema>>({
		resolver: zodResolver(createApiKeySchema),
		defaultValues: { name: "", scopes: [] },
		mode: "all",
		reValidateMode: "onChange",
	});

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
				const message =
					messages[error.response?.data.code] ?? defaultMessages.error;

				toast.error({
					text: message.title,
					description: message.description,
				});
				return;
			}

			const secret = response?.data.data?.secret;

			if (!secret) {
				toast.error({
					text: defaultMessages.error.title,
					description: defaultMessages.error.description,
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
								Nome da chave
							</FormLabel>
							<FormControl>
								<Input placeholder="Integração com o ERP" {...field} />
							</FormControl>
							<FormDescription>
								Use um nome que identifique onde a chave será usada.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormItem>
					<FormLabel>
						<CalendarClock className="mr-1 inline-block size-3.5" />
						Validade
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
									{preset.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormDescription>
						Chaves com prazo reduzem o impacto de um vazamento.
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
								Permissões
								<span className="ml-2 text-muted-foreground">
									{scopes.length === 0
										? "herda seu cargo"
										: `${scopes.length} selecionada(s)`}
								</span>
							</span>
							<ChevronsUpDown className="size-4" />
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-4 border-border border-t p-3">
						<p className="text-muted-foreground text-xs">
							Sem nenhuma selecionada, a chave usa exatamente as permissões do
							seu cargo. Selecionar restringe: uma chave nunca pode ter mais
							acesso do que você.
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
												{scopeLabel(scope)}
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
					Criar chave{" "}
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
