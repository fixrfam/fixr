import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				pending: "bg-sky-600/25 text-sky-800 dark:text-sky-300",
				diagnosing: "bg-amber-600/25 text-amber-800 dark:text-amber-300",
				waiting_approval:
					"bg-yellow-600/25 text-yellow-800 dark:text-yellow-300",
				approved: "bg-indigo-600/25 text-indigo-800 dark:text-indigo-300",
				fixing: "bg-blue-600/25 text-blue-800 dark:text-blue-300",
				ready: "bg-emerald-600/25 text-emerald-800 dark:text-emerald-300",
				delivered: "bg-muted text-muted-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

function ServiceOrderStatusBadge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			className={cn(badgeVariants({ variant }), className)}
			data-slot="badge"
			{...props}
		/>
	);
}

export { ServiceOrderStatusBadge, badgeVariants };
