import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableToolbarProps {
	search: string;
	placeholder: string;
	createHref: string;
	createLabel: string;
	onSearchChange: (value: string) => void;
	onClear: () => void;
	children?: ReactNode;
}

export function TableToolbar({
	search,
	placeholder,
	createHref,
	createLabel,
	onSearchChange,
	onClear,
	children,
}: TableToolbarProps) {
	const params = useParams<{ subdomain: string }>();

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex w-full items-center gap-3">
				<Input
					className="max-w-md"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={placeholder}
					value={search}
				/>
				<div className="flex items-center gap-2">
					<Button onClick={onClear} variant="ghost">
						Limpar
					</Button>
				</div>
			</div>
			<div className="flex items-center justify-start gap-4">
				{children}
				<Button asChild className="shrink-0">
					<DashLink href={createHref} prefetch subdomain={params.subdomain}>
						{createLabel} <Plus className="size-3.5" />
					</DashLink>
				</Button>
			</div>
		</div>
	);
}
