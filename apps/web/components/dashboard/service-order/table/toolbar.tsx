import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashLink } from "../dash-link";

interface TableToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	onClear: () => void;
}

export function TableToolbar({
	search,
	onSearchChange,
	onClear,
}: TableToolbarProps) {
	const params = useParams<{ subdomain: string }>();

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex w-full items-center gap-3">
				<Input
					className="max-w-sm"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Busque por ordem, cliente, aparelho ou status..."
					value={search}
				/>
				<div className="flex items-center gap-2">
					<Button onClick={onClear} variant="ghost">
						Limpar
					</Button>
				</div>
			</div>
			<div className="flex justify-start">
				<Button asChild className="h-9.5 shrink-0">
					<DashLink
						href={"/service-orders/new"}
						prefetch
						subdomain={params.subdomain}
					>
						Nova ordem de serviço <Plus className="size-4" />
					</DashLink>
				</Button>
			</div>
		</div>
	);
}
