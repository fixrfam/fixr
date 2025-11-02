"use client";

import { useState, ReactNode } from "react";
import { Alert, AlertProps } from "./ui/alert";
import { cn, isClientSide } from "@/lib/utils";

export type CookieAlertProps = {
    show: boolean;
    cookieKey: string;
    children: ReactNode;
} & Omit<AlertProps, "dismissable" | "onDismiss">;

export default function CookieAlert({
    show,
    cookieKey,
    className,
    children,
    ...props
}: CookieAlertProps) {
    const [showAlert, setShowAlert] = useState(show);

    if (show && isClientSide()) {
        document.cookie = `${cookieKey}=; max-age=0; path=/`;
    }

    if (!showAlert) return null;

    return (
        <Alert
            className={cn("border-destructive/50 bg-destructive/20", className)}
            dismissable={true as const}
            onDismiss={() => setShowAlert(false)}
            {...props}
        >
            {children}
        </Alert>
    );
}
