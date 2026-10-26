import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** The pill above every landing page heading, same as the hero's. */
export function SectionBadge({
	icon: Icon,
	children,
	className,
}: {
	icon: LucideIcon;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"w-max rounded-full border border-primary bg-primary/15 px-3 py-2 font-light text-primary text-xs md:px-4 md:text-sm",
				className
			)}
		>
			<Icon className="mr-2 inline-block size-4" />
			{children}
		</div>
	);
}

/**
 * Badge, two part heading and description. The highlighted part uses the
 * heading face, like the hero and the features title.
 */
export function SectionHeading({
	icon,
	badge,
	titleBefore,
	titleHighlight,
	description,
	align = "center",
	className,
}: {
	icon: LucideIcon;
	badge: string;
	titleBefore: string;
	titleHighlight: string;
	description?: string;
	align?: "center" | "left";
	className?: string;
}) {
	const centered = align === "center";

	return (
		<Reveal
			className={cn(
				"flex flex-col gap-4",
				centered ? "items-center text-center" : "items-start text-left",
				className
			)}
		>
			<SectionBadge icon={icon}>{badge}</SectionBadge>
			<h2 className="max-w-170 text-balance font-light text-3xl md:text-5xl">
				{titleBefore} <span className="font-heading">{titleHighlight}</span>
			</h2>
			{description && (
				<p className="max-w-170 text-pretty font-light text-base text-muted-foreground md:text-lg">
					{description}
				</p>
			)}
		</Reveal>
	);
}
