import { Avatar } from "../account/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { emailDisplayName, getSession } from "@/lib/auth/utils";
import { cookies } from "next/headers";
import { Button } from "../ui/button";
import { LogOut, Settings } from "lucide-react";
import { Separator } from "../ui/separator";
import { SignOutButton } from "../auth/signout-button";
import Link from "next/link";

export async function AccountPopover() {
    const cookieStore = cookies();
    const session = getSession(cookieStore);
    const displayName = session.displayName || emailDisplayName(session.email || "");

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant='ghost' className='relative size-8 rounded-full'>
                    <Avatar identiconHash={session.id} className='size-8' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80 p-0' align='end'>
                <div className='flex items-center gap-4 p-4'>
                    <Avatar identiconHash={session.id} className='size-12' />
                    <div className='flex flex-col space-y-1 min-w-0'>
                        <p className='font-medium leading-5 truncate'>{displayName}</p>
                        <p className='text-xs leading-none text-muted-foreground truncate'>
                            {session.email}
                        </p>
                    </div>
                </div>
                <Separator />
                <div className='p-2'>
                    <div className='grid grid-cols-2 gap-2'>
                        <Button variant='outline' className='w-full h-7 text-xs' size='sm' asChild>
                            <Link href='/dashboard/client/account'>
                                Manage
                                <Settings className='size-4' />
                            </Link>
                        </Button>
                        <SignOutButton variant='outline' className='w-full h-7 text-xs' size='sm'>
                            Signout
                        </SignOutButton>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
