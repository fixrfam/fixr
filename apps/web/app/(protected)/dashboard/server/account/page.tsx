import { ProfileAvatar } from "@/components/account/profile-avatar";
import { Settings } from "@/components/account/settings";
import { SignOutButton } from "@/components/auth/signout-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { axios } from "@/lib/auth/axios";
import { firstUpper } from "@/lib/utils";
import { accountSchema } from "@repo/schemas/account";
import { ApiResponse } from "@repo/schemas/utils";
import { ArrowRight, BriefcaseBusiness, Building2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

export default async function ServerPage() {
    const res = await axios.get<ApiResponse<z.infer<typeof accountSchema>>>("/account");

    const content = res.data.data;

    return (
        <div className='w-full flex flex-col items-center space-y-10'>
            <div className='w-full flex items-center justify-between'>
                <div className='flex gap-2 items-center'>
                    <h1 className='text-2xl font-semibold tracking-tight'>Account (server)</h1>
                    <Button asChild variant={"link"}>
                        <Link href='/dashboard/client/account'>
                            Client <ArrowRight />
                        </Link>
                    </Button>
                </div>
                <div className='flex gap-2 items-center'>
                    <SignOutButton variant={"outline"}>Signout</SignOutButton>
                </div>
            </div>
            <div className='w-full flex flex-col lg:flex-row gap-10'>
                <div className='w-full lg:max-w-[20rem] space-y-4'>
                    <ProfileAvatar
                        fallbackHash={content?.id as string}
                        className='size-32 text-4xl'
                    />
                    <div className='space-y-5'>
                        <div>
                            <h2
                                className={`text-3xl w-full tracking-tight truncate ${content?.displayName && "font-semibold"}`}
                            >
                                {content?.displayName ?? "No display name"}
                            </h2>
                            <p className='text-muted-foreground'>{content?.email}</p>
                        </div>
                        <Separator className='my-8' />
                        <div>
                            <p className='text-xs font-semibold text-muted-foreground uppercase mb-4'>
                                Info
                            </p>
                            <div className='flex flex-col gap-2'>
                                <p className='inline-flex items-center gap-2 tracking-tight'>
                                    <div className='text-primary bg-primary/30 p-1 rounded-md'>
                                        <Building2 className='size-5' />
                                    </div>
                                    {content?.company?.name}
                                </p>
                                <p className='inline-flex items-center gap-2 tracking-tight'>
                                    <div className='text-primary bg-primary/30 p-1 rounded-md'>
                                        <BriefcaseBusiness className='size-5' />
                                    </div>
                                    {firstUpper(content?.company?.role as string)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='w-full space-y-6'>
                    <Settings />
                </div>
            </div>
        </div>
    );
}
