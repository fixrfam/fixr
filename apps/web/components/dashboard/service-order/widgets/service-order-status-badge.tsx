import { cn } from "@/lib/utils";

type StatusTone = "done" | "active" | "pending" | "canceled";

const toneClass: Record<StatusTone, string> = {
	done: "bg-green-500/15 text-green-600 border-green-500/30",
	active: "bg-primary/15 text-primary border-primary/30",
	pending: "bg-primary/10 text-primary/60 border-primary/20",
	canceled: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

/**
 * Small status pill used in service order timeline headers.
 */
function ServiceOrderStatusPill({
	label,
	tone,
	className,
}: {
	label: string;
	tone: StatusTone;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium text-xs",
				toneClass[tone],
				className
			)}
		>
			{label}
		</span>
	);
}

export { ServiceOrderStatusPill, type StatusTone };
