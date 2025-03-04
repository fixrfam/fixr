"use client";

import { api, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createUserSchema as baseCreateUserSchema } from "@repo/schemas/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Dispatch, SetStateAction, useState } from "react";
import { AxiosError } from "axios";
import { axios } from "@/lib/auth/axios";
import { toast } from "@pheralb/toast";
import { fallbackMessages, messages } from "@/lib/messages";
import { type ApiResponse } from "@repo/schemas/utils";
import { Loader2 } from "lucide-react";

export function RegisterForm({ onSuccess }: { onSuccess: Dispatch<SetStateAction<boolean>> }) {
    const [loading, setLoading] = useState(false);

    const createUserSchema = baseCreateUserSchema
        .extend({
            password: z
                .string()
                .min(8, { message: "Must be at least 8 characters long." })
                .max(128, { message: "Must be at most 128 characters long." })
                .refine((password) => /[A-Z]/.test(password), {
                    message: "Must contain at least one uppercase letter.",
                })
                .refine((password) => /[a-z]/.test(password), {
                    message: "Must contain at least one lowercase letter.",
                })
                .refine((password) => /[0-9]/.test(password), {
                    message: "Must contain at least one number.",
                })
                .refine((password) => /[#?!@$%^&*-]/.test(password), {
                    message: "Must contain at least one special character.",
                }),
            confirmPassword: z
                .string({ required_error: "Please confirm your password." })
                .min(1, { message: "Confirm your password." }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: "Passwords do not match.",
            path: ["confirmPassword"],
        });

    const form = useForm<z.infer<typeof createUserSchema>>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "all",
    });

    const { formState } = form;

    async function onSubmit(values: z.infer<typeof createUserSchema>) {
        setLoading(true);
        try {
            const res = await axios.post<ApiResponse>(api("/auth/register"), values);
            const message = messages[res.data.code] ?? fallbackMessages.success;

            if (res.status === 201) {
                toast.success({
                    text: message.title,
                    description: message.description,
                });
            }
            onSuccess(true);
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
                    <h1 className='text-2xl font-bold tracking-tight'>Create a new account</h1>
                    <p className='text-balance text-sm text-muted-foreground'>
                        Fill in the form below to get started
                    </p>
                </div>
                <div className='grid gap-2'>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                    <Input
                                        type='email'
                                        placeholder='m@example.com'
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
                        name='displayName'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input type='text' placeholder='John Doe' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password *</FormLabel>
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
                                <FormLabel>Confirm password *</FormLabel>
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

                    {/* <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
                    <span className='relative z-10 bg-background px-2 text-muted-foreground'>
                        Or continue with
                    </span>
                </div>
                <Button variant='outline' className='w-full'>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                        <path
                            d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'
                            fill='currentColor'
                        />
                    </svg>
                    Login with GitHub
                </Button> */}
                </div>
                <Button type='submit' className='w-full' disabled={loading || !formState.isValid}>
                    {!loading ? "Register" : <Loader2 className='animate-spin size-4' />}
                </Button>
                <div className='text-center text-sm'>
                    Got an account?{" "}
                    <Link href='/auth/login' className='underline underline-offset-4'>
                        Sign in
                    </Link>
                </div>
            </form>
        </Form>
    );
}
