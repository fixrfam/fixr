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
				registered:
					"bg-sky-600/35 text-sky-800 dark:text-sky-300 [a&]:hover:bg-sky-100",
				parts_pending: "bg-blue-600/35 text-blue-800 dark:text-blue-300",
				analysis:
					"bg-amber-600/35 text-amber-800 dark:text-amber-300 [a&]:hover:bg-amber-100",
				finished:
					"bg-emerald-600/35 text-emerald-800 dark:text-emerald-300 [a&]:hover:bg-emerald-100",
				canceled:
					"bg-rose-600/35 text-rose-800 dark:text-rose-300 [a&]:hover:bg-rose-100",
				quote_pending:
					"bg-yellow-600/35 text-yellow-800 dark:text-yellow-300 [a&]:hover:bg-yellow-100",
				approval_pending:
					"bg-yellow-600/35 text-yellow-800 dark:text-yellow-300 [a&]:hover:bg-yellow-100",
				in_progress:
					"bg-blue-600/35 text-blue-800 dark:text-blue-300 [a&]:hover:bg-blue-100",
				ready_for_pickup:
					"bg-green-600/35 text-green-800 dark:text-green-300 [a&]:hover:bg-green-100",
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
