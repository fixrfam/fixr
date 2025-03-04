import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

interface SettingsCardProps extends HTMLAttributes<HTMLDivElement> {
    destructive?: boolean;
}

export const SettingsCard = forwardRef<HTMLDivElement, SettingsCardProps>(
    ({ children, className, destructive, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-card border pt-6 rounded-lg space-y-2",
                    destructive ? "border-destructive" : "border-border",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
SettingsCard.displayName = "SettingsCard";

export const SettingsCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ children, className, ...props }, ref) => {
        return (
            <h4
                ref={ref}
                className={cn("text-xl px-6 tracking-tight font-semibold", className)}
                {...props}
            >
                {children}
            </h4>
        );
    }
);
SettingsCardTitle.displayName = "SettingsCardTitle";

export const SettingsCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ children, className, ...props }, ref) => {
        return (
            <div ref={ref} className={cn("pb-6 px-6 space-y-2", className)} {...props}>
                {children}
            </div>
        );
    }
);
SettingsCardContent.displayName = "SettingsCardContent";

interface SettingsCardFooterProps extends HTMLAttributes<HTMLDivElement> {
    destructive?: boolean;
}
export const SettingsCardFooter = forwardRef<HTMLDivElement, SettingsCardFooterProps>(
    ({ children, className, destructive, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "border-t px-6 py-4 w-full flex justify-between items-center gap-4",
                    destructive
                        ? "bg-destructive/50 border-destructive"
                        : "bg-accent border-border",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
SettingsCardFooter.displayName = "SettingsCardFooter";
