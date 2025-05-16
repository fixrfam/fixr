"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonProps } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackButton({ className, ...props }: ButtonProps) {
    const router = useRouter();

    return (
        <Button
            variant={"ghost"}
            className={cn("text-foreground px-0", className)}
            onClick={() => router.back()}
            {...props}
        >
            <ArrowLeft />
            Voltar
        </Button>
    );
}
