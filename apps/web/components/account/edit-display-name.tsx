"use client";

import { Save, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { editAccountSchema } from "@repo/schemas/account";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { axios } from "@/lib/auth/axios";
import { ApiResponse } from "@repo/schemas/utils";
import { api } from "@/lib/utils";
import { fallbackMessages, messages } from "@/lib/messages";
import { toast } from "@pheralb/toast";
import { AxiosError } from "axios";
import { Form, FormField, FormItem, FormControl, FormMessage } from "../ui/form";
import { queryClient } from "@/lib/QueryClient";

export function EditDisplayName({ displayName }: { displayName: string }) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof editAccountSchema>>({
        resolver: zodResolver(editAccountSchema),
        defaultValues: {
            displayName: displayName,
        },
        mode: "all",
    });

    const { formState } = form;

    async function onSubmit(values: z.infer<typeof editAccountSchema>) {
        setLoading(true);
        try {
            const res = await axios.patch<ApiResponse>(api("/account"), values, {
                withCredentials: true,
            });
            if (res.status === 200) {
                const message = messages[res.data.code] ?? fallbackMessages.success;
                queryClient.invalidateQueries({ queryKey: ["accountData"] });

                toast.success({
                    text: message.title,
                    description: message.description,
                    action: {
                        text: "Reload",
                        onClick: () => {
                            window.location.reload();
                        },
                    },
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name='displayName'
                    render={({ field }) => (
                        <FormItem>
                            <div className='flex gap-2'>
                                <FormControl>
                                    <Input
                                        type='text'
                                        placeholder='John Doe'
                                        className='h-9 w-full max-w-64'
                                        required
                                        {...field}
                                    />
                                </FormControl>
                                <Button
                                    type='submit'
                                    size={"sm"}
                                    disabled={loading || !formState.isValid}
                                >
                                    {!loading ? (
                                        <>
                                            Save <Save />
                                        </>
                                    ) : (
                                        <Loader2 className='animate-spin size-4' />
                                    )}
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
