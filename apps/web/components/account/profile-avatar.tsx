/* eslint-disable @next/next/no-img-element */
import { cn, RequireAtLeastOne } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";
import Avatar from "boring-avatars";

export type AvatarProps = HTMLAttributes<HTMLDivElement> &
    RequireAtLeastOne<{
        src?: string;
        fallbackHash?: string;
    }>;

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
    "#0d183e",
];

export const ProfileAvatar = forwardRef<HTMLDivElement, AvatarProps>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ src, fallbackHash, className, ...props }, ref) => {
        return (
            <div
                className={cn(
                    "rounded-full aspect-square overflow-clip border border-border flex items-center justify-center",
                    className
                )}
                ref={ref}
                {...props}
            >
                <Avatar
                    name={fallbackHash}
                    variant='beam'
                    className='size-full'
                    colors={avatarColors}
                />
                <img src={src} className='aspect-square object-cover' alt=''></img>
            </div>
        );
    }
);
ProfileAvatar.displayName = "ProfileAvatar";
