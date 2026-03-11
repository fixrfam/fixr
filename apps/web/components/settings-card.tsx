import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SettingsCardProps extends HTMLAttributes<HTMLDivElement> {
	destructive?: boolean;
}

export const SettingsCard = forwardRef<HTMLDivElement, SettingsCardProps>(
	({ children, className, destructive, ...props }, ref) => {
		return (
			<div
				className={cn(
					"space-y-2 rounded-lg border bg-card pt-6",
					destructive ? "border-destructive" : "border-border",
					className
				)}
				ref={ref}
				{...props}
			>
				{children}
			</div>
		);
	}
);
SettingsCard.displayName = "SettingsCard";

export const SettingsCardTitle = forwardRef<
	HTMLHeadingElement,
	HTMLAttributes<HTMLHeadingElement>
>(({ children, className, ...props }, ref) => {
	return (
		<h4
			className={cn("px-6 font-semibold text-xl tracking-tight", className)}
			ref={ref}
			{...props}
		>
			{children}
		</h4>
	);
});
SettingsCardTitle.displayName = "SettingsCardTitle";

export const SettingsCardContent = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
	return (
		<div className={cn("space-y-2 px-6 pb-6", className)} ref={ref} {...props}>
			{children}
		</div>
	);
});
SettingsCardContent.displayName = "SettingsCardContent";

interface SettingsCardFooterProps extends HTMLAttributes<HTMLDivElement> {
	destructive?: boolean;
}
export const SettingsCardFooter = forwardRef<
	HTMLDivElement,
	SettingsCardFooterProps
>(({ children, className, destructive, ...props }, ref) => {
	return (
		<div
			className={cn(
				"flex w-full items-center justify-between gap-4 rounded-b-lg border-t px-6 py-4",
				destructive
					? "border-destructive bg-destructive/50"
					: "border-border bg-accent",
				className
			)}
			ref={ref}
			{...props}
		>
			{children}
		</div>
	);
});
SettingsCardFooter.displayName = "SettingsCardFooter";
