/* eslint-disable @next/next/no-img-element */
"use client";

import { useTranslation } from "@fixr/i18n/react";
import BoringAvatar from "boring-avatars";
import { Camera, X } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";
import { cn, type RequireAtLeastOne } from "@/lib/utils";

/**
 * Props for the reusable Avatar component.
 *
 * @param src - URL to the avatar image (or null/undefined to show fallback).
 * @param fallbackHash - String hash used to generate the Boring Avatar fallback.
 * @param variant - Shape variant: "rounded" (circle, default) or "square".
 * @param fallbackType - Boring Avatar style variant (default: "beam").
 * @param onEdit - When set, renders a camera overlay button on hover.
 * @param onDelete - When set, renders a trash overlay button on hover.
 */
export type AvatarProps = HTMLAttributes<HTMLDivElement> &
	RequireAtLeastOne<{ src?: string | null; fallbackHash?: string }> & {
		variant?: "rounded" | "square";
		fallbackType?: "beam" | "marble" | "pixel" | "sunset" | "ring" | "bauhaus";
		onEdit?: () => void;
		onDelete?: () => void;
	};

const avatarColors = [
	"#b9daff",
	"#89c4ff",
	"#51a3ff",
	"#297eff",
	"#1f65fe",
	"#0b45ea",
	"#1039bd",
	"#1039bd",
	"#11225a",
];

/**
 * Renders a user avatar with a Boring Avatar fallback and optional
 * ghost-style action buttons (edit camera, delete trash) on hover.
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	(
		{
			src,
			fallbackHash,
			className,
			variant = "rounded",
			fallbackType = "beam" as const,
			onEdit,
			onDelete,
			...props
		},
		ref
	) => {
		const { t } = useTranslation();
		const round = { square: "rounded-md", rounded: "rounded-full" };

		return (
			<div
				className={cn(
					"group relative flex aspect-square items-center justify-center overflow-clip border border-border",
					round[variant],
					className
				)}
				ref={ref}
				{...props}
			>
				{!src && (
					<BoringAvatar
						className="size-full"
						colors={avatarColors}
						name={fallbackHash}
						square={variant === "square"}
						variant={fallbackType}
					/>
				)}
				{src && (
					<img
						aria-label={t("account.avatar.userPhoto")}
						className="aspect-square size-full object-cover"
						height={256}
						src={src}
						width={256}
					/>
				)}
				{(onEdit || onDelete) && (
					<span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
						{onEdit && (
							<button
								className="inline-flex items-center justify-center rounded-md p-1.5 text-white transition-colors hover:bg-white/20"
								onClick={onEdit}
								type="button"
							>
								<Camera className="size-6" />
								<span className="sr-only">{t("account.avatar.change")}</span>
							</button>
						)}
						{onDelete && (
							<button
								className="inline-flex items-center justify-center rounded-md p-1.5 text-white transition-colors hover:bg-white/20"
								onClick={onDelete}
								type="button"
							>
								<X className="size-6" />
								<span className="sr-only">{t("account.avatar.remove")}</span>
							</button>
						)}
					</span>
				)}
			</div>
		);
	}
);
Avatar.displayName = "ProfileAvatar";
