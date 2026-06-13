import { ExternalLink } from "lucide-react";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderStatusBadge } from "@/components/dashboard/service-order/service-order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServiceOrderStatusId } from "@/lib/utils/service-orders";

export function OrderNumberCell({
	orderNumber,
	receivedAt,
}: {
	orderNumber: string;
	receivedAt?: string;
}) {
	return (
		<div className="flex flex-col">
			<span className="font-semibold">
				#{orderNumber} <ExternalLink className="inline-block size-3.5" />
			</span>
			{receivedAt && (
				<span className="text-muted-foreground text-xs">{receivedAt}</span>
			)}
		</div>
	);
}

export function ClientCell({
	name,
	phone,
	cpf,
}: {
	name: string;
	phone: string;
	cpf: string;
}) {
	return (
		<div className="flex flex-col">
			<span className="font-medium">{name}</span>
			<span className="text-muted-foreground text-xs">{phone}</span>
			<span className="text-muted-foreground text-xs">{cpf}</span>
		</div>
	);
}

export function DeviceCell({
	mark,
	model,
	imei,
}: {
	mark: string;
	model: string;
	imei?: string;
}) {
	return (
		<div className="flex flex-col">
			<span className="font-medium">
				{mark} {model}
			</span>
			{imei && (
				<span className="text-muted-foreground text-xs">IMEI {imei}</span>
			)}
		</div>
	);
}

export function CategoryCell({ category }: { category: string }) {
	return <span className="text-2xs">{category}</span>;
}

export function TechnicianCell({ name }: { name: string }) {
	return <span className="font-medium">{name}</span>;
}

export function StatusCell({
	statusId,
	label,
}: {
	statusId: ServiceOrderStatusId;
	label: string;
}) {
	return (
		<ServiceOrderStatusBadge
			className="rounded-lg px-2.5 py-1 font-semibold text-xs"
			variant={statusId}
		>
			{label}
		</ServiceOrderStatusBadge>
	);
}

export function IssueCell({
	description,
	notes,
}: {
	description?: string;
	notes?: string;
}) {
	const desc = description ?? "Sem descrição registrada.";
	return (
		<div className="flex flex-col">
			<span className="max-w-55 truncate text-2xs">{desc}</span>
			{notes && (
				<span className="max-w-55 truncate text-muted-foreground text-xs">
					{notes}
				</span>
			)}
		</div>
	);
}

export function PartsCell({ parts }: { parts?: string[] }) {
	const list = parts ?? [];
	if (list.length === 0) {
		return <span className="text-muted-foreground text-xs">Sem peças</span>;
	}

	const visible = list.slice(0, 2);
	const remaining = list.length - visible.length;

	return (
		<div className="flex flex-nowrap gap-1">
			{visible.map((part) => (
				<Badge
					className="whitespace-nowrap rounded-md px-2 py-0.5 text-xs"
					key={part}
					variant="secondary"
				>
					{part}
				</Badge>
			))}
			{remaining > 0 && (
				<Badge
					className="whitespace-nowrap rounded-md px-2 py-0.5 text-xs"
					variant="outline"
				>
					+{remaining}
				</Badge>
			)}
		</div>
	);
}

export function UpdatedAtCell({
	history,
}: {
	history: { label: string; dateTime: string }[];
}) {
	const lastUpdate = history.at(-1);
	if (!lastUpdate) {
		return <span className="text-muted-foreground text-xs">Sem histórico</span>;
	}
	return (
		<div className="flex flex-col">
			<span className="font-medium">{lastUpdate.label}</span>
			<span className="text-muted-foreground text-xs">
				{lastUpdate.dateTime}
			</span>
		</div>
	);
}

export function ActionsCell({
	id,
	subdomain,
}: {
	id: string;
	subdomain: string;
}) {
	return (
		<div className="text-right">
			<Button
				asChild
				onClick={(e) => e.stopPropagation()}
				size="sm"
				type="button"
				variant="outline"
			>
				<DashLink href={`/service-orders/${id}`} subdomain={subdomain}>
					Ver mais
				</DashLink>
			</Button>
		</div>
	);
}
