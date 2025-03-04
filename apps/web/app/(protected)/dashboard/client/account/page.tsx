"use client";

import { SignOutButton } from "@/components/auth/signout-button";
import { axios } from "@/lib/auth/axios";
import { useQuery } from "@tanstack/react-query";
import { nonSensitiveUser } from "@repo/schemas/auth";
import { z } from "zod";
import { ApiResponse } from "@repo/schemas/utils";
import { AxiosResponse } from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings } from "@/components/account/settings";
import { Avatar } from "@/components/account/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ClientPage() {
    const { isPending, data } = useQuery<
        AxiosResponse<ApiResponse<z.infer<typeof nonSensitiveUser>>>
    >({
        queryKey: ["accountData"],
        queryFn: async () => await axios.get("/account"),
    });

    // if (error) return "An error has occurred: " + error.message;

    const content = data?.data.data;

    return (
        <div className='w-full flex flex-col items-center space-y-10'>
            <div className='w-full flex items-center justify-between'>
                <div className='flex gap-2 items-center'>
                    <h1 className='text-2xl font-semibold tracking-tight'>Account (client)</h1>
                    <Button asChild variant={"link"}>
                        <Link href='/dashboard/server/account'>
                            Server <ArrowRight />
                        </Link>
                    </Button>
                </div>
                <div className='flex gap-2 items-center'>
                    <SignOutButton variant={"outline"}>Signout</SignOutButton>
                </div>
            </div>
            <div className='w-full flex flex-col lg:flex-row gap-10'>
                <div className='w-full lg:max-w-[20rem] space-y-4'>
                    {!isPending ? (
                        <Avatar identiconHash={content?.id} className='size-32' />
                    ) : (
                        <Skeleton className='w-32 h-32 rounded-full' />
                    )}
                    {!isPending ? (
                        <div className='space-y-1'>
                            <h2
                                className={`text-3xl w-full tracking-tight truncate ${content?.displayName && "font-semibold"}`}
                            >
                                {content?.displayName ?? "No display name"}
                            </h2>
                            <p className='text-muted-foreground'>{content?.email}</p>
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
                        <Settings displayName={content?.displayName ?? ""} />
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
