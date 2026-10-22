"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "../ui/button";

export function BackButton({ className, ...props }: ButtonProps) {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<Button
			className={cn("px-0 text-foreground", className)}
			onClick={() => router.back()}
			variant={"ghost"}
			{...props}
		>
			<ArrowLeft />
			{t("common.actions.back")}
		</Button>
	);
}
