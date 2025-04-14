import { ProfileAvatar } from "../account/profile-avatar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { emailDisplayName, getSession } from "@/lib/auth/utils";
import { cookies } from "next/headers";
import { Button } from "../ui/button";
import { Building2, Settings } from "lucide-react";
import { Separator } from "../ui/separator";
import { SignOutButton } from "../auth/signout-button";
import Link from "next/link";
import { Badge } from "../ui/badge";

export async function AccountPopover() {
    const cookieStore = cookies();
    const session = getSession(cookieStore);
    const displayName = session.displayName || emailDisplayName(session.email || "");

    return (
        <Popover>
            <PopoverTrigger asChild>
                <ProfileAvatar fallbackHash={session.id} className='!size-8 hover:cursor-pointer' />
            </PopoverTrigger>
            <PopoverContent className='w-80 p-0' align='end'>
                <div className='flex gap-4 p-4'>
                    <ProfileAvatar fallbackHash={session.id} className='size-12 text-4xl' />
                    <div className='flex flex-col space-y-1 min-w-0'>
                        <p className='font-medium leading-5 truncate'>{displayName}</p>
                        <p className='text-xs leading-none text-muted-foreground truncate'>
                            {session.email}
                        </p>
                        <div className='grid grid-cols-2 gap-2 !mt-3 w-full'>
                            <Button
                                variant='outline'
                                className='w-full h-7 text-xs'
                                size='sm'
                                asChild
                            >
                                <Link href='/dashboard/client/account'>
                                    <Settings className='size-4' />
                                    Manage
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
