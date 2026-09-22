"use client";

import { type Locale, localeNames, locales } from "@fixr/i18n";
import { useTranslation } from "@fixr/i18n/react";
import { Languages } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageToggle({ ...props }: ButtonProps) {
	const { t, locale, setLocale } = useTranslation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon" variant="ghost" {...props}>
					<Languages className="h-[1.2rem] w-[1.2rem]" />
					<span className="sr-only">{t("common.language.change")}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="z-100">
				{locales.map((option: Locale) => (
					<DropdownMenuItem
						className={cn(option === locale && "font-medium")}
						key={option}
						onClick={() => setLocale(option)}
					>
						{localeNames[option]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
