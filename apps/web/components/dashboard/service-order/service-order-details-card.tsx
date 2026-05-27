import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ServiceOrderDetailsCardProps {
	icon: LucideIcon;
	title: string;
	description?: string;
	children: ReactNode;
}

export function ServiceOrderDetailsCard({
	icon: Icon,
	title,
	description,
	children,
}: ServiceOrderDetailsCardProps) {
	return (
		<div className="rounded-lg border bg-card">
			<div className="flex gap-3 border-b px-4 py-3">
				<Icon className="mt-1 size-4 text-muted-foreground" />
				<div>
					<h2 className="font-medium">{title}</h2>
					{description && (
						<p className="text-muted-foreground text-xs">{description}</p>
					)}
				</div>
			</div>
			<div className="px-4 py-3">{children}</div>
		</div>
	);
}
