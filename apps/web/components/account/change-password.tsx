"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Save, Loader2 } from "lucide-react";
import { changePasswordAuthenticatedSchema as baseChangePasswordAuthenticatedSchema } from "@fixr/schemas/credentials";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { axios } from "@/lib/auth/axios";
import { ApiResponse } from "@fixr/schemas/utils";
import { api } from "@/lib/utils";
import { fallbackMessages, messages } from "@/lib/messages";
import { toast } from "@pheralb/toast";
import { AxiosError } from "axios";
import { Form, FormField, FormItem, FormControl, FormMessage, FormDescription } from "../ui/form";

export function ChangePassword() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const changePasswordAuthenticatedSchema = baseChangePasswordAuthenticatedSchema
        .extend({
            new: z
                .string()
                .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
                .max(128, { message: "A senha deve ter no máximo 128 caracteres." })
                .refine((password) => /[A-Z]/.test(password), {
                    message: "A senha deve conter pelo menos uma letra maiúscula.",
                })
                .refine((password) => /[a-z]/.test(password), {
                    message: "A senha deve conter pelo menos uma letra minúscula.",
                })
                .refine((password) => /[0-9]/.test(password), {
                    message: "A senha deve conter pelo menos um número.",
                })
                .refine((password) => /[#?!@$%^&*-]/.test(password), {
                    message: "A senha deve conter pelo menos um caractere especial.",
                }),
            confirmNew: z
                .string({ required_error: "Por favor, confirme sua senha." })
                .min(1, { message: "Confirme sua senha." }),
        })
        .refine((data) => data.new === data.confirmNew, {
            message: "As senhas não coincidem.",
            path: ["confirmNew"],
        });

    const form = useForm<z.infer<typeof changePasswordAuthenticatedSchema>>({
        resolver: zodResolver(changePasswordAuthenticatedSchema),
        defaultValues: {
            old: "",
            new: "",
        },
        mode: "all",
    });

    const { formState } = form;

    async function onSubmit(values: z.infer<typeof changePasswordAuthenticatedSchema>) {
        setLoading(true);
        try {
            const res = await axios.put<ApiResponse>(api("/credentials/password"), values, {
                withCredentials: true,
            });
            if (res.status === 200) {
                const message = messages[res.data.code] ?? fallbackMessages.success;
                setOpen(false);

                toast.success({
                    text: message.title,
                    description: message.description,
                });
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size={"sm"}>Mudar</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>Alterar senha</DialogTitle>
                    <DialogDescription>
                        Insira sua senha atual e a nova senha que você deseja usar.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        className='grid gap-4 py-4'
                        id='change_password'
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <div className='grid grid-cols-4 items-start gap-4'>
                            <Label htmlFor='name' className='text-right py-3'>
                                Atual
                            </Label>
                            <FormField
                                control={form.control}
                                name='old'
                                render={({ field }) => (
                                    <FormItem className='col-span-3'>
                                        <FormControl>
                                            <Input
                                                type='password'
                                                className='col-span-3'
                                                required
                                                placeholder='••••••••'
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className='grid grid-cols-4 items-start gap-4'>
                            <Label htmlFor='username' className='text-right py-3'>
                                Nova
                            </Label>
                            <FormField
                                control={form.control}
                                name='new'
                                render={({ field }) => (
                                    <FormItem className='col-span-3'>
                                        <FormControl>
                                            <Input
                                                type='password'
                                                required
                                                placeholder='••••••••'
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className='grid grid-cols-4 items-start gap-4'>
                            <Label htmlFor='name' className='text-right py-3'>
                                Confirmar
                            </Label>
                            <FormField
                                control={form.control}
                                name='confirmNew'
                                render={({ field }) => (
                                    <FormItem className='col-span-3'>
                                        <FormControl>
                                            <Input
                                                type='password'
                                                className='col-span-3'
                                                required
                                                placeholder='••••••••'
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Confirme sua senha para garantir que não haja erros de
                                            digitação, mantendo sua conta segura.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </form>
                </Form>
                <div></div>
                <DialogFooter>
                    <Button
                        type='submit'
                        disabled={loading || !formState.isValid}
                        form='change_password'
                    >
                        {!loading ? (
                            <>
                                Salvar <Save />
                            </>
                        ) : (
                            <Loader2 className='animate-spin size-4' />
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
