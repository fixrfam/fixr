import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Heading({
	title,
	description,
	Icon,
}: {
	title: ReactNode;
	description: ReactNode;
	Icon?: LucideIcon;
}) {
	return (
		<div className="flex items-center gap-4">
			{Icon && (
				<div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary">
					<Icon className="size-6 text-white" />
				</div>
			)}
			<div>
				<h1 className="font-heading font-semibold text-3xl">{title}</h1>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
		</div>
	);
}
