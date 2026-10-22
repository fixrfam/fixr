"use client";

import { type Locale, localeNames, locales } from "@fixr/i18n";
import { useTranslation } from "@fixr/i18n/react";
import { Languages } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Language switcher. The choice is remembered in a cookie. */
export function LanguageToggle(
	props: React.ComponentProps<typeof Button> &
		React.ComponentProps<typeof buttonVariants>
) {
	const { t, locale, setLocale } = useTranslation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon" variant="ghost" {...props}>
					<Languages className="h-[1.2rem] w-[1.2rem]" />
					<span className="sr-only">{t("common.language.change")}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
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
