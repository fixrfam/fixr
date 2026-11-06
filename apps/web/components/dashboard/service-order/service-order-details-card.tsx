import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ServiceOrderDetailsCardProps {
	icon: LucideIcon;
	title: string;
	description?: string;
	/** Compact control on the right of the header (edit, add...). */
	action?: ReactNode;
	children: ReactNode;
}

export function ServiceOrderDetailsCard({
	icon: Icon,
	title,
	description,
	action,
	children,
}: ServiceOrderDetailsCardProps) {
	return (
		<div className="rounded-lg border bg-background">
			<div className="flex items-start gap-3 border-b px-4 py-3">
				<Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
				<div className="min-w-0 flex-1">
					<h2 className="font-medium text-2xs">{title}</h2>
					{description && (
						<p className="text-2xs text-muted-foreground">{description}</p>
					)}
				</div>
				{action && <div className="-my-1 -mr-1.5 shrink-0">{action}</div>}
			</div>
			<div className="px-4 py-3">{children}</div>
		</div>
	);
}
