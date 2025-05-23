"use client";

import { messages, fallbackMessages } from "@/lib/messages";
import { api } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { confirmPasswordResetSchema as baseConfirmPasswordResetSchema } from "@fixr/schemas/credentials";
import { ApiResponse } from "@fixr/schemas/utils";
import axios, { AxiosError } from "axios";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function ResetPasswordForm({
    onSuccess,
    token,
}: {
    onSuccess: Dispatch<SetStateAction<boolean>>;
    token: string;
}) {
    const [loading, setLoading] = useState(false);

    const confirmPasswordResetSchema = baseConfirmPasswordResetSchema
        .extend({
            password: z
                .string()
                .min(8, { message: "Deve ter pelo menos 8 caracteres." })
                .max(128, { message: "Deve ter no máximo 128 caracteres." })
                .refine((password) => /[A-Z]/.test(password), {
                    message: "Deve conter pelo menos uma letra maiúscula.",
                })
                .refine((password) => /[a-z]/.test(password), {
                    message: "Deve conter pelo menos uma letra minúscula.",
                })
                .refine((password) => /[0-9]/.test(password), {
                    message: "Deve conter pelo menos um número.",
                })
                .refine((password) => /[#?!@$%^&*-]/.test(password), {
                    message: "Deve conter pelo menos um caractere especial.",
                }),
            confirmPassword: z
                .string({ required_error: "Por favor, confirme sua senha." })
                .min(1, { message: "Confirme sua senha." }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: "As senhas não coincidem.",
            path: ["confirmPassword"],
        });

    const form = useForm<z.infer<typeof confirmPasswordResetSchema>>({
        resolver: zodResolver(confirmPasswordResetSchema),
        defaultValues: {
            token: token,
            password: "",
            confirmPassword: "",
        },
        mode: "all",
    });

    const { formState } = form;

    async function onSubmit(values: z.infer<typeof confirmPasswordResetSchema>) {
        setLoading(true);
        try {
            const res = await axios.put<ApiResponse>(
                api("/credentials/password/reset"),
                { token: token, password: values.password },
                {
                    withCredentials: true,
                }
            );
            if (res.status === 200) {
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
                        <Lock className='size-5' />
                    </div>
                    <h1 className='text-2xl font-bold tracking-tight whitespace-nowrap'>
                        Alterar sua senha
                    </h1>
                    <p className='text-balance text-sm text-muted-foreground'>
                        Crie uma nova senha segura e preencha abaixo.
                    </p>
                </div>
                <div className='grid gap-6'>
                    <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Senha *</FormLabel>
                                <FormControl>
                                    <Input
                                        type='password'
                                        placeholder='••••••••'
                                        required
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='confirmPassword'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmar senha *</FormLabel>
                                <FormControl>
                                    <Input
                                        type='password'
                                        placeholder='••••••••'
                                        required
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    A confirmação ajuda a garantir que não haja erros de digitação,
                                    mantendo sua conta segura.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type='submit'
                        className='w-full'
                        disabled={loading || !formState.isValid}
                    >
                        {!loading ? "Alterar senha" : <Loader2 className='animate-spin size-4' />}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
