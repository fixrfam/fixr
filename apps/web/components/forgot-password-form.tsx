"use client";

import { messages, fallbackMessages } from "@/lib/messages";
import { api } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { requestPasswordResetSchema } from "@fixr/schemas/credentials";
import { ApiResponse } from "@fixr/schemas/utils";
import axios, { AxiosError } from "axios";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Loader2, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Link from "next/link";

export function ForgotPasswordForm({
    onSuccess,
}: {
    onSuccess: Dispatch<SetStateAction<boolean>>;
}) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof requestPasswordResetSchema>>({
        resolver: zodResolver(requestPasswordResetSchema),
        defaultValues: {
            email: "",
        },
        mode: "all",
    });

    const { formState } = form;

    async function onSubmit(values: z.infer<typeof requestPasswordResetSchema>) {
        setLoading(true);
        try {
            const res = await axios.post<ApiResponse>(api("/credentials/password/reset"), values, {
                withCredentials: true,
            });
            if (res.status === 201) {
                const message = messages[res.data.code] ?? fallbackMessages.success;

                toast.success({
                    text: message.title,
                    description: message.description,
                });
                onSuccess(true);
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorData = error.response?.data as ApiResponse;
                const message = messages[errorData.code] ?? fallbackMessages.error;

                toast.error({
                    text: message.title,
                    description: message.description,
                });
            }
        } finally {
            setLoading(false);
        }
    }
    return (
        <Form {...form}>
            <form className={cn("flex flex-col gap-6")} onSubmit={form.handleSubmit(onSubmit)}>
                <div className='flex flex-col items-center gap-2 text-center'>
                    <div className='p-1.5 bg-primary text-white rounded-md'>
                        <ShieldQuestion className='size-5' />
                    </div>
                    <h1 className='text-2xl font-bold tracking-tight whitespace-nowrap'>
                        Esqueceu sua senha?
                    </h1>
                    <p className='text-balance text-sm text-muted-foreground'>
                        Digite seu e-mail abaixo, redefinimos para você!
                    </p>
                </div>
                <div className='grid gap-6'>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail *</FormLabel>
                                <FormControl>
                                    <Input
                                        type='email'
                                        placeholder='email@exemplo.com'
                                        required
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type='submit'
                        className='w-full'
                        disabled={loading || !formState.isValid}
                    >
                        {!loading ? "Redefinir senha" : <Loader2 className='animate-spin size-4' />}
                    </Button>
                </div>
                <div className='text-center text-sm'>
                    <Link href='/auth/login' className='underline underline-offset-4'>
                        Voltar
                    </Link>
                </div>
            </form>
        </Form>
    );
}
