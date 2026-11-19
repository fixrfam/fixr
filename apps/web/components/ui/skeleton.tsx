"use client";

import { SkeletonBox } from "skullet/react";
import { cn } from "@/lib/utils";

/**
 * A loose placeholder box, sized by `className`. It shimmers in step with
 * skullet's measured skeletons; prefer `Reveal` (`@/components/skeleton`)
 * over real content wherever there is a sample to draw from.
 */
function Skeleton({
	className,
	style,
}: Pick<React.ComponentProps<"div">, "className" | "style">) {
	return (
		<SkeletonBox
			className={cn("block rounded-md", className)}
			// Sizes and corners come from `className`, not skullet's defaults.
			style={{
				width: undefined,
				height: undefined,
				borderRadius: undefined,
				...style,
			}}
		/>
	);
}

export { Skeleton };
