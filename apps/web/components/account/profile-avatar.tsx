/* eslint-disable @next/next/no-img-element */

import BoringAvatar from "boring-avatars";
import { forwardRef, type HTMLAttributes } from "react";
import { cn, type RequireAtLeastOne } from "@/lib/utils";

export type AvatarProps = HTMLAttributes<HTMLDivElement> &
	RequireAtLeastOne<{ src?: string | null; fallbackHash?: string }> & {
		variant?: "rounded" | "square";
		fallbackType?: "beam" | "marble" | "pixel" | "sunset" | "ring" | "bauhaus";
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

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	(
		{
			src,
			fallbackHash,
			className,
			variant = "rounded",
			fallbackType = "beam" as const,
			...props
		},
		ref
	) => {
		const round = { square: "rounded-md", rounded: "rounded-full" };

		return (
			<div
				className={cn(
					"flex aspect-square items-center justify-center overflow-clip border border-border",
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
						alt="Foto do usuário"
						className="aspect-square size-full object-cover"
						height={256}
						src={src}
						width={256}
					/>
				)}
			</div>
		);
	}
);
Avatar.displayName = "ProfileAvatar";
