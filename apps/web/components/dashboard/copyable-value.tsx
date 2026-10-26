"use client";

import { useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const RESET_AFTER_MS = 1600;

/**
 * A value with a copy button next to it. Inside a data table row the button
 * shows on row hover or focus; on touch screens it is always visible.
 */
export function CopyableValue({
	value,
	label,
	children,
	className,
}: {
	/** What goes to the clipboard. */
	value: string;
	/** Names the value in the button label and the toast, e.g. "CNPJ". */
	label: string;
	/** What is shown; defaults to the copied value. */
	children?: ReactNode;
	className?: string;
}) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return;
		}
		const timer = setTimeout(() => setCopied(false), RESET_AFTER_MS);
		return () => clearTimeout(timer);
	}, [copied]);

	async function copy(event: React.MouseEvent) {
		// Rows can be clickable: copying must not open the row.
		event.stopPropagation();
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			toast.success({ text: t("common.clipboard.copied", { label }) });
		} catch {
			toast.error({ text: t("common.clipboard.failed") });
		}
	}

	return (
		<span
			className={cn(
				"group/copy inline-flex items-center gap-1.5 whitespace-nowrap",
				className
			)}
		>
			<span className="tabular-nums">{children ?? value}</span>
			<motion.button
				aria-label={t("common.clipboard.copy", { label })}
				className={cn(
					"inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[opacity,color,background-color]",
					"hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					"opacity-0 focus-visible:opacity-100 group-hover/copy:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
					copied && "text-emerald-600 opacity-100 dark:text-emerald-400"
				)}
				onClick={copy}
				type="button"
				whileTap={{ scale: 0.85 }}
			>
				<AnimatePresence initial={false} mode="popLayout">
					<motion.span
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						exit={{ opacity: 0, scale: 0.5, rotate: copied ? 0 : -45 }}
						initial={{ opacity: 0, scale: 0.5, rotate: copied ? -45 : 0 }}
						key={copied ? "copied" : "copy"}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
					>
						{copied ? (
							<Check className="size-3.5" />
						) : (
							<Copy className="size-3.5" />
						)}
					</motion.span>
				</AnimatePresence>
			</motion.button>
		</span>
	);
}
