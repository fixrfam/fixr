"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { categoryIcon } from "./format";

/**
 * A model photo on a soft tile. `cover` fills the tile from the center (list
 * thumbnails); `contain` shows the whole photo (the details gallery). Without
 * a photo, or when it fails to load, the category icon stands in.
 */
export function ModelImage({
	src,
	alt,
	category,
	className,
	iconClassName,
	loading = "lazy",
	fit = "contain",
}: {
	src: string | null | undefined;
	alt: string;
	category: string | null | undefined;
	className?: string;
	iconClassName?: string;
	loading?: "lazy" | "eager";
	fit?: "cover" | "contain";
}) {
	const [failed, setFailed] = useState(false);
	const Icon = categoryIcon(category);

	return (
		<div
			className={cn(
				"relative grid shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-b from-muted/40 to-muted",
				className
			)}
		>
			{src && !failed ? (
				// biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError only swaps in the fallback icon
				<img
					alt={alt}
					className={cn(
						"size-full object-center",
						fit === "cover"
							? "object-cover"
							: "object-contain p-[8%] mix-blend-multiply dark:mix-blend-normal"
					)}
					decoding="async"
					height={512}
					loading={loading}
					onError={() => setFailed(true)}
					src={src}
					width={512}
				/>
			) : (
				<Icon
					aria-hidden
					className={cn("size-1/2 text-muted-foreground/60", iconClassName)}
				/>
			)}
		</div>
	);
}
