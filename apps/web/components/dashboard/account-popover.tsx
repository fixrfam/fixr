import { AvatarProps, Avatar } from "../account/profile-avatar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { emailDisplayName, getSession } from "@/lib/auth/utils";
import { cookies } from "next/headers";
import { Button } from "../ui/button";
import { Settings } from "lucide-react";
import { SignOutButton } from "../auth/signout-button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export async function AccountPopover({
    showData,
    variant = "rounded",
    className,
}: {
    variant?: AvatarProps["variant"];
    className?: string;
    showData?: boolean;
}) {
    const cookieStore = await cookies();
    const session = getSession(cookieStore);
    const displayName = session.displayName || emailDisplayName(session.email || "");

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className={cn("flex gap-4 items-center min-w-0 cursor-pointer", className)}>
                    <Avatar
                        fallbackHash={session?.id ?? ""}
                        className='!size-9 hover:cursor-pointer'
                        variant={variant}
                    />
                    {showData && (
                        <div className='flex flex-col min-w-0'>
                            <p className='truncate text-sm font-medium whitespace-nowrap overflow-hidden'>
                                {displayName}
                            </p>
                            <p className='truncate text-xs text-muted-foreground whitespace-nowrap overflow-hidden'>
                                {session?.email}
                            </p>
                        </div>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className='w-80 p-0' align='start' sideOffset={10}>
                <div className='flex gap-4 p-4'>
                    <Link href='/dashboard/account' className='cursor-pointer'>
                        <Avatar
                            fallbackHash={session?.id ?? ""}
                            className='size-12 text-4xl'
                            variant='square'
                        />
                    </Link>
                    <div className='flex flex-col space-y-1 min-w-0'>
                        <Link href='/dashboard/account' className='space-y-1 cursor-pointer'>
                            <p className='font-medium leading-5 truncate'>{displayName}</p>
                            <p className='text-xs leading-none text-muted-foreground truncate'>
                                {session?.email}
                            </p>
                        </Link>
                        <div className='grid grid-cols-2 gap-2 !mt-3 w-full'>
                            <Button
                                variant='outline'
                                className='w-full h-7 text-xs'
                                size='sm'
                                asChild
                            >
                                <Link href='/dashboard/account'>
                                    <Settings className='size-4' />
                                    Gerenciar
                                </Link>
                            </Button>
                            <SignOutButton
                                variant='outline'
                                className='h-7 text-xs'
                                size='icon'
                            ></SignOutButton>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
