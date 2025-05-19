"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMaskito } from "@maskito/react";
import { cnpj, cpf, unmask } from "@fixr/constants/masks";
import { messages, defaultMessages } from "@fixr/constants/messages";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsUpDown, Dices, Loader2, Plus } from "lucide-react";
import { generateRandomPassword, tryCatch } from "@/lib/utils";
import PasswordInput from "@/components/ui/password-input";
import { toast } from "@pheralb/toast";
import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiResponse } from "@fixr/schemas/utils";
import { createCompanySchema } from "@fixr/schemas/companies";
import { useState } from "react";

export function CreateCompany() {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof createCompanySchema>>({
        resolver: zodResolver(createCompanySchema),
        defaultValues: {
            name: "",
            cnpj: "",
            address: "",
            subdomain: "",
            owner_email: "",
            owner_password: "",
        },
        mode: "all",
    });

    async function onSubmit(values: z.infer<typeof createCompanySchema>) {
        setLoading(true);

        const formatted: z.infer<typeof createCompanySchema> = {
            ...values,
            subdomain: values.subdomain.toLowerCase(),
            cnpj: unmask.cnpj(values.cnpj),
            owner_cpf: unmask.cpf(values.owner_cpf),
        };

        try {
            const { data: response, error } = await tryCatch<AxiosResponse<ApiResponse>>(
                axios.post("/api/companies", formatted)
            );

            if (error && error instanceof AxiosError) {
                const message = messages[error.response?.data.code] ?? defaultMessages.error;

                toast.error({
                    text: message.title,
                    description: message.description,
                });
                return;
            }

            const message = messages[response?.data.code as string] ?? defaultMessages.success;

            toast.success({
                text: message.title,
                description: message.description,
            });
        } finally {
            setLoading(false);
        }
    }

    const cnpjMask = useMaskito({ options: { mask: cnpj } });
    const cpfMask = useMaskito({ options: { mask: cpf } });

    function setPwd() {
        form.setValue("owner_password", generateRandomPassword());
        form.trigger();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 max-w-md'>
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da empresa *</FormLabel>
                            <FormControl>
                                <Input placeholder='Acme Inc.' {...field} />
                            </FormControl>
                            <FormDescription>Como o nome fantasia da empresa.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='cnpj'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CNPJ *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder='12.345.678/0001-00'
                                    {...field}
                                    ref={cnpjMask}
                                    onInput={(e) => form.setValue("cnpj", e.currentTarget.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='subdomain'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subdomínio</FormLabel>
                            <FormControl>
                                <Input placeholder='example' {...field} />
                            </FormControl>
                            <FormDescription>
                                Domínio -{" "}
                                {form.getValues("subdomain").length
                                    ? form.getValues("subdomain")
                                    : "exemplo"}
                                .fixr.ricardo.gg
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='owner_email'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email do proprietário *</FormLabel>
                            <FormControl>
                                <Input placeholder='email@exemplo.com' {...field} />
                            </FormControl>
                            <FormDescription>
                                Ele receberá sua senha de acesso (redefinível) neste email.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='owner_cpf'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CPF do proprietário *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder='123.456.789-00'
                                    {...field}
                                    ref={cpfMask}
                                    onInput={(e) =>
                                        form.setValue("owner_cpf", e.currentTarget.value)
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='owner_password'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha do proprietário*</FormLabel>
                            <FormControl>
                                <div className='flex items-center gap-2 w-full'>
                                    <PasswordInput
                                        placeholder='•••••••'
                                        className='grow'
                                        {...field}
                                    />
                                    <Button
                                        type='button'
                                        variant={"outline"}
                                        onClick={() => setPwd()}
                                    >
                                        <Dices className='size-4' />
                                        Gerar
                                    </Button>
                                </div>
                            </FormControl>
                            <FormDescription>
                                Será enviada para o email especificado.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Collapsible>
                    <CollapsibleTrigger className='inline-flex items-center text-xs gap-1 text-muted-foreground'>
                        <ChevronsUpDown className='size-3' />
                        Campos opcionais
                    </CollapsibleTrigger>
                    <CollapsibleContent className='mt-2'>
                        <FormField
                            control={form.control}
                            name='address'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl>
                                        <Input placeholder='1234 Main St' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CollapsibleContent>
                </Collapsible>
                <Button
                    type='submit'
                    disabled={!form.formState.isValid || loading}
                    className='w-full'
                >
                    Criar {!loading ? <Plus /> : <Loader2 className='animate-spin' />}
                </Button>
            </form>
        </Form>
    );
}
