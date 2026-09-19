import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Vertical list for label/value pairs used in service order detail cards.
 */
function ServiceOrderKeyValueList({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <dl className={cn("grid gap-y-3 text-sm", className)}>{children}</dl>;
}

/**
 * Single label/value row with wrapping-safe alignment.
 */
function ServiceOrderKeyValueItem({
	label,
	value,
	stacked,
	align = "right",
	className,
	valueClassName,
}: {
	label: string;
	value: ReactNode;
	stacked?: boolean;
	align?: "left" | "right";
	className?: string;
	valueClassName?: string;
}) {
	if (stacked) {
		return (
			<div className={cn("space-y-1 text-2xs", className)}>
				<dt className="text-muted-foreground">{label}</dt>
				<dd className={cn("wrap-break-word font-medium", valueClassName)}>
					{value}
				</dd>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-start justify-between gap-4 text-2xs",
				className
			)}
		>
			<dt className="shrink-0 text-muted-foreground">{label}</dt>
			<dd
				className={cn(
					"wrap-break-words min-w-0 flex-1 font-medium",
					align === "right" ? "text-right" : "text-left",
					valueClassName
				)}
			>
				{value}
			</dd>
		</div>
	);
}

export { ServiceOrderKeyValueItem, ServiceOrderKeyValueList };
