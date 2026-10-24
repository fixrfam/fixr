"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { createAbility, permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { HandCoins, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useInventory } from "@/components/dashboard/parts/store";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/hooks/use-session";
import { estimatesApi } from "@/lib/services/estimates";
import {
	type ServiceOrderItem,
	type ServiceOrderItems as ServiceOrderItemsData,
	serviceOrderItemsApi,
} from "@/lib/services/service-orders";

type Change =
	| { kind: "add"; type: "part" | "service"; itemId: string }
	| { kind: "quantity"; itemId: string; quantity: number }
	| { kind: "remove"; itemId: string };

/**
 * Parts and services used on a service order, priced from the catalog, with
 * the order totals. Editing needs `serviceOrders:update`.
 */
export function ServiceOrderItems({
	serviceOrderId,
}: {
	serviceOrderId: string;
}) {
	const { t, format } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();
	const { session } = useSession();
	const ability = createAbility(session?.company?.role ?? "guest");
	const canEdit = ability.can(permissions.serviceOrders.update);
	const canEstimate = ability.can(permissions.estimates.create);
	const queryClient = useQueryClient();
	const toastError = useApiErrorToast();
	const queryKey = ["service-order-items", subdomain, serviceOrderId];

	const { data, isPending, error } = useQuery({
		queryKey,
		queryFn: () => serviceOrderItemsApi.list(subdomain, serviceOrderId),
		retry: false,
	});

	const change = useMutation({
		mutationFn: (action: Change) => {
			if (action.kind === "add") {
				return serviceOrderItemsApi.add(subdomain, serviceOrderId, {
					type: action.type,
					itemId: action.itemId,
				});
			}
			if (action.kind === "quantity") {
				return serviceOrderItemsApi.update(
					subdomain,
					serviceOrderId,
					action.itemId,
					{ quantity: action.quantity }
				);
			}
			return serviceOrderItemsApi.remove(
				subdomain,
				serviceOrderId,
				action.itemId
			);
		},
		onSuccess: (items: ServiceOrderItemsData) =>
			queryClient.setQueryData(queryKey, items),
		onError: toastError,
	});

	if (isPending) {
		return <Skeleton className="h-32 w-full" />;
	}

	if (error) {
		// Orders that only exist in the mocked list have no id the API knows (400/404).
		const unavailable =
			error instanceof AxiosError && (error.response?.status ?? 500) < 500;
		return (
			<p className="text-2xs text-muted-foreground">
				{unavailable
					? t("serviceOrders.items.unavailable")
					: t("messages.fallback.error.description")}
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{canEdit ? (
				<AddItemPicker
					disabled={change.isPending}
					onPick={(type, itemId) =>
						change.mutate({ kind: "add", type, itemId })
					}
				/>
			) : null}

			{data.items.length === 0 ? (
				<p className="text-2xs text-muted-foreground">
					{t("serviceOrders.items.empty")}
				</p>
			) : (
				<div className="grid gap-2">
					{data.items.map((item) => (
						<ItemRow
							canEdit={canEdit}
							disabled={change.isPending}
							item={item}
							key={item.id}
							onQuantity={(quantity) =>
								change.mutate({ kind: "quantity", itemId: item.id, quantity })
							}
							onRemove={() =>
								change.mutate({ kind: "remove", itemId: item.id })
							}
						/>
					))}
				</div>
			)}

			<dl className="space-y-1 border-t pt-3 text-2xs">
				<div className="flex justify-between text-muted-foreground">
					<dt>{t("serviceOrders.items.partsTotal")}</dt>
					<dd className="tabular-nums">{format.currency(data.totals.parts)}</dd>
				</div>
				<div className="flex justify-between text-muted-foreground">
					<dt>{t("serviceOrders.items.servicesTotal")}</dt>
					<dd className="tabular-nums">
						{format.currency(data.totals.services)}
					</dd>
				</div>
				<div className="flex justify-between font-semibold text-sm">
					<dt>{t("serviceOrders.items.total")}</dt>
					<dd className="tabular-nums">{format.currency(data.totals.total)}</dd>
				</div>
			</dl>

			{canEstimate && data.items.length > 0 ? (
				<CreateEstimateButton serviceOrderId={serviceOrderId} />
			) : null}
		</div>
	);
}

/** Turn the order's current items into a draft estimate and go to the estimates list. */
function CreateEstimateButton({ serviceOrderId }: { serviceOrderId: string }) {
	const { t } = useTranslation();
	const message = useMessage();
	const router = useRouter();
	const { subdomain } = useParams<{ subdomain: string }>();
	const toastError = useApiErrorToast();

	const create = useMutation({
		mutationFn: () => estimatesApi.create(subdomain, { serviceOrderId }),
		onSuccess: () => {
			const feedback = message("create_estimate_success", "success");
			toast.success({
				text: feedback.title,
				description: feedback.description,
			});
			router.push(`/dashboard/${subdomain}/estimates`);
		},
		onError: toastError,
	});

	return (
		<Button
			className="w-full"
			disabled={create.isPending}
			onClick={() => create.mutate()}
			size="sm"
			type="button"
		>
			{create.isPending ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				<HandCoins className="size-4" />
			)}
			{create.isPending
				? t("estimates.actions.creating")
				: t("estimates.actions.create")}
		</Button>
	);
}

function ItemRow({
	item,
	canEdit,
	disabled,
	onQuantity,
	onRemove,
}: {
	item: ServiceOrderItem;
	canEdit: boolean;
	disabled: boolean;
	onQuantity: (quantity: number) => void;
	onRemove: () => void;
}) {
	const { t, format } = useTranslation();

	return (
		<div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-2xs">
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="wrap-break-words font-medium">{item.name}</span>
					<Badge className="text-[0.625rem]" variant="secondary">
						{item.type === "part"
							? t("serviceOrders.items.part")
							: t("serviceOrders.items.service")}
					</Badge>
				</div>
				<span className="text-muted-foreground tabular-nums">
					{item.quantity} × {format.currency(item.unitPrice)}
				</span>
			</div>
			{canEdit ? (
				<div className="flex items-center gap-1">
					<Button
						aria-label={t("serviceOrders.items.decrease", { name: item.name })}
						className="size-6"
						disabled={disabled || item.quantity <= 1}
						onClick={() => onQuantity(item.quantity - 1)}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Minus className="size-3" />
					</Button>
					<Button
						aria-label={t("serviceOrders.items.increase", { name: item.name })}
						className="size-6"
						disabled={disabled}
						onClick={() => onQuantity(item.quantity + 1)}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Plus className="size-3" />
					</Button>
				</div>
			) : null}
			<span className="w-20 text-right font-medium tabular-nums">
				{format.currency(item.total)}
			</span>
			{canEdit ? (
				<Button
					aria-label={t("serviceOrders.items.remove", { name: item.name })}
					className="size-6 text-muted-foreground"
					disabled={disabled}
					onClick={onRemove}
					size="icon"
					type="button"
					variant="ghost"
				>
					<Trash2 className="size-3" />
				</Button>
			) : null}
		</div>
	);
}

/** Catalog search; parts and services missing from the catalog are created in their own forms. */
function AddItemPicker({
	disabled,
	onPick,
}: {
	disabled: boolean;
	onPick: (type: "part" | "service", itemId: string) => void;
}) {
	const { t, format } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();
	const { parts, services } = useInventory();
	const [open, setOpen] = useState(false);

	function pick(type: "part" | "service", itemId: string) {
		setOpen(false);
		onPick(type, itemId);
	}

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					className="w-full"
					disabled={disabled}
					size="sm"
					type="button"
					variant="outline"
				>
					<Plus className="size-4" />
					{t("serviceOrders.items.add")}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 p-0">
				<Command>
					<CommandInput placeholder={t("serviceOrders.items.search")} />
					<CommandList>
						<CommandEmpty>{t("serviceOrders.items.noResults")}</CommandEmpty>
						<CommandGroup heading={t("serviceOrders.items.partsGroup")}>
							{parts.map((part) => (
								<CommandItem
									key={part.id}
									onSelect={() => pick("part", part.id)}
									value={`${part.name} ${part.sku}`}
								>
									<div className="flex w-full items-center justify-between gap-2">
										<span className="truncate">{part.name}</span>
										<span className="text-muted-foreground text-xs tabular-nums">
											{format.currency(part.salePrice)}
										</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
						<CommandGroup heading={t("serviceOrders.items.servicesGroup")}>
							{services.map((service) => (
								<CommandItem
									key={service.id}
									onSelect={() => pick("service", service.id)}
									value={service.name}
								>
									<div className="flex w-full items-center justify-between gap-2">
										<span className="truncate">{service.name}</span>
										<span className="text-muted-foreground text-xs tabular-nums">
											{format.currency(service.price)}
										</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
					<CommandSeparator />
					<div className="flex gap-1 p-1">
						<Button asChild className="flex-1" size="sm" variant="ghost">
							<DashLink href="/parts/new" subdomain={subdomain}>
								<Plus className="size-3.5" />
								{t("serviceOrders.items.createPart")}
							</DashLink>
						</Button>
						<Button asChild className="flex-1" size="sm" variant="ghost">
							<DashLink href="/services/new" subdomain={subdomain}>
								<Plus className="size-3.5" />
								{t("serviceOrders.items.createService")}
							</DashLink>
						</Button>
					</div>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
