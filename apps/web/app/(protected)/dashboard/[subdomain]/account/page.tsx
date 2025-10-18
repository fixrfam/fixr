import { Avatar } from "@/components/account/profile-avatar";
import { Settings } from "@/components/account/settings";
import { SignOutButton } from "@/components/auth/signout-button";
import { Heading } from "@/components/dashboard/heading";
import { Separator } from "@/components/ui/separator";
import { axios } from "@/lib/auth/axios";
import { accountSchema } from "@fixr/schemas/account";
import { ApiResponse } from "@fixr/schemas/utils";
import { BriefcaseBusiness, Building2 } from "lucide-react";
import { z } from "zod";
import { roleLabels } from "@fixr/constants/roles";
import { employeeRoles } from "@fixr/schemas/roles";

export default async function ServerPage() {
    const res = await axios.get<ApiResponse<z.infer<typeof accountSchema>>>("/account");

    const content = res.data.data;

    return (
        <div className='w-full flex flex-col items-center space-y-10'>
            <div className='w-full flex items-center justify-between'>
                <Heading title='Perfil' description='Gerencie as configurações da sua conta.' />
                <div className='flex gap-2 items-center'>
                    <SignOutButton variant={"outline"}>Sair</SignOutButton>
                </div>
            </div>
            <div className='w-full flex flex-col lg:flex-row gap-10'>
                <div className='w-full lg:max-w-[20rem] space-y-4'>
                    <Avatar
                        fallbackHash={content?.id as string}
                        className='size-32 text-4xl'
                        src={content?.avatarUrl}
                    />
                    <div className='space-y-5'>
                        <div>
                            <h2
                                className={`text-3xl w-full tracking-tight truncate ${content?.displayName && "font-semibold"}`}
                            >
                                {content?.displayName ?? "Sem nome de exibição"}
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
                                    {
                                        roleLabels[
                                            content?.company?.role as z.infer<typeof employeeRoles>
                                        ]
                                    }
                                </div>
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
