"use client";

/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";
import { createIconSVG } from "@/lib/blockies";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string;
    identiconHash?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ src, identiconHash, className, ...props }, ref) => {
        const iconDataUrl = createIconSVG({
            seed: identiconHash ?? "placeholder", // seed used to generate icon data, default: random
            bgcolor: "#fff",
            spotcolor: "#fff",
            size: 7, // width/height of the icon in blocks, default: 10
            scale: 32, // width/height of each block in pixels, default: 5
        });

        return (
            <div
                className={cn(
                    "rounded-full bg-accent aspect-square overflow-clip border border-border",
                    className
                )}
                ref={ref}
                {...props}
            >
                <img src={src ?? iconDataUrl} className='aspect-square object-cover' alt=''></img>
            </div>
        );
    }
);
Avatar.displayName = "Avatar";
