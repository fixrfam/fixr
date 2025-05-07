"use client";

import { SignOutButton } from "@/components/auth/signout-button";
import { axios } from "@/lib/auth/axios";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ApiResponse } from "@repo/schemas/utils";
import { AxiosResponse } from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings } from "@/components/account/settings";
import { Avatar } from "@/components/account/profile-avatar";
import { BriefcaseBusiness, Building2 } from "lucide-react";
import { accountSchema } from "@repo/schemas/account";
import { Separator } from "@/components/ui/separator";
import { firstUpper } from "@/lib/utils";
import { Heading } from "@/components/dashboard/heading";

export default function ClientPage() {
    const { isPending, data } = useQuery<AxiosResponse<ApiResponse<z.infer<typeof accountSchema>>>>(
        {
            queryKey: ["accountData"],
            queryFn: async () => await axios.get("/account"),
        }
    );

    // if (error) return "An error has occurred: " + error.message;

    const content = data?.data.data;

    return (
        <div className='w-full flex flex-col items-center space-y-10'>
            <div className='w-full flex items-center justify-between'>
                <Heading title='Account' description='Manage your account settings' />
                <div className='flex gap-2 items-center'>
                    <SignOutButton variant={"outline"}>Signout</SignOutButton>
                </div>
            </div>
            <div className='w-full flex flex-col lg:flex-row gap-10'>
                <div className='w-full lg:max-w-[20rem] space-y-4'>
                    {!isPending ? (
                        <Avatar fallbackHash={content?.id as string} className='size-32 text-4xl' />
                    ) : (
                        <Skeleton className='w-32 h-32 rounded-full' />
                    )}
                    {!isPending ? (
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
                                    <div className='inline-flex items-center gap-2 tracking-tight'>
                                        <div className='text-primary bg-primary/30 p-1 rounded-md'>
                                            <Building2 className='size-5' />
                                        </div>
                                        {content?.company?.name}
                                    </div>
                                    <div className='inline-flex items-center gap-2 tracking-tight'>
                                        <div className='text-primary bg-primary/30 p-1 rounded-md'>
                                            <BriefcaseBusiness className='size-5' />
                                        </div>
                                        {firstUpper(content?.company?.role as string)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            <Skeleton className='w-48 h-8' />
                            <Skeleton className='w-64 h-4' />
                        </div>
                    )}
                </div>
                <div className='w-full space-y-6'>
                    {!isPending ? (
                        <Settings />
                    ) : (
                        <>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className='w-full h-56' />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
