import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
                parts_pending: "bg-blue-100 text-blue-900",
                analysis: "bg-amber-100 text-amber-900 [a&]:hover:bg-amber-100",
                finished: "bg-emerald-100 text-emerald-900 [a&]:hover:bg-emerald-100",
                canceled: "bg-rose-100 text-rose-900 [a&]:hover:bg-rose-100",
                quote_pending: "bg-yellow-100 text-yellow-900 [a&]:hover:bg-yellow-100",
                approval_pending: "bg-yellow-100 text-yellow-900 [a&]:hover:bg-yellow-100",
                in_progress: "bg-blue-100 text-blue-900 [a&]:hover:bg-blue-100",
                ready_for_pickup: "bg-green-100 text-green-900 [a&]:hover:bg-green-100",
                contacted: "bg-gray-100 text-gray-900 [a&]:hover:bg-gray-100",
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

