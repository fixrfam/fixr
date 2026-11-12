import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The Fixr wallpaper behind a surface, darkened enough for white text. Used
 * by the client portal's header and its featured surfaces.
 */
export function Wallpaper({
	className,
	children,
}: {
	className?: string;
	children?: ReactNode;
}) {
	return (
		<div
			className={cn(
				"relative isolate overflow-hidden bg-[#050b1f] text-white",
				className
			)}
		>
			<img
				alt=""
				aria-hidden
				className="absolute inset-0 -z-10 size-full object-cover opacity-80"
				decoding="async"
				height={900}
				src="/portal-bg.webp"
				width={1600}
			/>
			{/* Keeps white text readable on the brighter spots of the image. */}
			<div aria-hidden className="absolute inset-0 -z-10 bg-[#050b1f]/45" />
			{children}
		</div>
	);
}
