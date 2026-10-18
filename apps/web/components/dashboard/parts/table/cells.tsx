import { ExternalLink, Pencil } from "lucide-react";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STOCK_STATUS_LABELS, type StockStatusId } from "./data";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

function formatDuration(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}min`;
	if (rest === 0) return `${hours}h`;
	return `${hours}h ${rest}min`;
}

const STOCK_STATUS_STYLES: Record<StockStatusId, string> = {
	in_stock:
		"border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	low_stock:
		"border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
	out_of_stock:
		"border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

export function SkuCell({ sku }: { sku: string }) {
	return <span className="font-mono font-semibold text-xs">{sku}</span>;
}

export function NameCell({
	name,
	description,
	clickable,
}: {
	name: string;
	description?: string;
	clickable?: boolean;
}) {
	return (
		<div className="flex flex-col">
			<span className="font-medium">
				{name}
				{clickable && (
					<>
						{" "}
						<ExternalLink className="inline-block size-3.5" />
					</>
				)}
			</span>
			{description && (
				<span className="max-w-80 truncate text-muted-foreground text-xs">
					{description}
				</span>
			)}
		</div>
	);
}

export function TextCell({ value }: { value: string }) {
	return <span className="text-2xs">{value}</span>;
}

export function PriceCell({ value }: { value: number }) {
	return (
		<span className="whitespace-nowrap tabular-nums">
			{currencyFormatter.format(value)}
		</span>
	);
}

export function StockCell({
	stock,
	status,
}: {
	stock: number;
	status: StockStatusId;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="font-medium tabular-nums">{stock}</span>
			<Badge
				className={cn("rounded-md", STOCK_STATUS_STYLES[status])}
				variant="outline"
			>
				{STOCK_STATUS_LABELS[status]}
			</Badge>
		</div>
	);
}

export function QuantityCell({ value }: { value: number }) {
	return <span className="tabular-nums">{value}</span>;
}

export function SupplierCell({ name, cnpj }: { name?: string; cnpj?: string }) {
	if (!name) {
		return (
			<span className="text-muted-foreground text-xs">Sem fornecedor</span>
		);
	}

	return (
		<div className="flex flex-col">
			<span className="font-medium">{name}</span>
			{cnpj && <span className="text-muted-foreground text-xs">{cnpj}</span>}
		</div>
	);
}

export function ContactCell({
	primary,
	secondary,
}: {
	primary: string;
	secondary?: string;
}) {
	return (
		<div className="flex flex-col">
			<span className="font-medium">{primary}</span>
			{secondary && (
				<span className="text-muted-foreground text-xs">{secondary}</span>
			)}
		</div>
	);
}

export function DurationCell({ minutes }: { minutes: number }) {
	return (
		<span className="whitespace-nowrap tabular-nums">
			{formatDuration(minutes)}
		</span>
	);
}

export function LinkedItemsCell({
	items,
	emptyLabel,
}: {
	items: { id: string; label: string }[];
	emptyLabel: string;
}) {
	if (items.length === 0) {
		return <span className="text-muted-foreground text-xs">{emptyLabel}</span>;
	}

	const visible = items.slice(0, 2);
	const remaining = items.length - visible.length;

	return (
		<div className="flex flex-nowrap gap-1">
			{visible.map((item) => (
				<Badge
					className="whitespace-nowrap rounded-md px-2 py-0.5 text-xs"
					key={item.id}
					variant="secondary"
				>
					{item.label}
				</Badge>
			))}
			{remaining > 0 && (
				<Badge
					className="whitespace-nowrap rounded-md px-2 py-0.5 text-xs"
					title={items
						.slice(2)
						.map((item) => item.label)
						.join(", ")}
					variant="outline"
				>
					+{remaining}
				</Badge>
			)}
		</div>
	);
}

export function EditCell({
	href,
	label,
	subdomain,
}: {
	href: string;
	label: string;
	subdomain: string;
}) {
	return (
		<div>
			<Button
				asChild
				onClick={(e) => e.stopPropagation()}
				size="sm"
				type="button"
				variant="outline"
			>
				<DashLink aria-label={label} href={href} subdomain={subdomain}>
					<Pencil className="size-3.5" /> Editar
				</DashLink>
			</Button>
		</div>
	);
}
