"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateRandomPassword } from "@/lib/utils/generateRandomPassword";
import { cpf, phone, unmask } from "@fixr/constants/masks";
import { useMaskito } from "@maskito/react";
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
import { Button } from "@/components/ui/button";
import {
    BriefcaseBusiness,
    Dices,
    IdCard,
    Loader2,
    Lock,
    Mail,
    PhoneIcon,
    Plus,
    User,
} from "lucide-react";
import PasswordInput from "@/components/ui/password-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { roleLabels } from "@fixr/constants/roles";
import { axios } from "@/lib/auth/axios";
import { AxiosError, AxiosResponse } from "axios";
import { ApiResponse } from "@fixr/schemas/utils";
import { defaultMessages, messages } from "@fixr/constants/messages";
import { useState } from "react";
import { api, tryCatch } from "@/lib/utils";
import { toast } from "@pheralb/toast";
import { userJWT } from "@fixr/schemas/auth";

export function CreateEmployeeForm({
    session,
    onSuccess,
}: {
    session: z.infer<typeof userJWT>;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof createEmployeeSchema>>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
            cpf: "",
            email: "",
            name: "",
            password: "",
        },
        mode: "all",
        reValidateMode: "onChange",
    });

    async function onSubmit(values: z.infer<typeof createEmployeeSchema>) {
        setLoading(true);

        const formatted: z.infer<typeof createEmployeeSchema> = {
            ...values,
            cpf: unmask.cpf(values.cpf),
        };

        try {
            const { data: response, error } = await tryCatch<AxiosResponse<ApiResponse>>(
                axios.post(api(`/companies/${session.company?.id}/employees`), formatted)
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

            onSuccess();
        } finally {
            setLoading(false);
        }
    }

    const cpfMask = useMaskito({ options: { mask: cpf } });
    const phoneMask = useMaskito({ options: { mask: phone } });

    function generatePwd() {
        form.setValue("password", generateRandomPassword());
        form.trigger();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 max-w-xl'>
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                <User className='size-3.5 inline-block mr-1' />
                                Nome do funcionário
                            </FormLabel>
                            <FormControl>
                                <Input placeholder='João da Silva' {...field} />
                            </FormControl>
                            <FormDescription>Este será o nome exibido no sistema.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='role'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                <BriefcaseBusiness className='size-3.5 inline-block mr-1' />
                                Cargo
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Selecione um cargo' />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(roleLabels).map(([role, label]) => (
                                        <SelectItem key={role} value={role}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Nível de acesso do funcionário no Fixr.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='cpf'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                <IdCard className='size-3.5 inline-block mr-1' />
                                CPF
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder='123.456.789-00'
                                    {...field}
                                    ref={cpfMask}
                                    onInput={(e) => form.setValue("cpf", e.currentTarget.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                <Mail className='size-3.5 inline-block mr-1' />
                                Email
                            </FormLabel>
                            <FormControl>
                                <Input placeholder='email@funcionario.com' {...field} />
                            </FormControl>
                            <FormDescription>Utilizado para login no sistema.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                <Lock className='size-3.5 inline-block mr-1' />
                                Senha
                            </FormLabel>
                            <FormControl>
                                <div className='flex items-center gap-2 w-full'>
                                    <PasswordInput
                                        placeholder='••••••••'
                                        className='grow'
                                        {...field}
                                    />
                                    <Button
                                        type='button'
                                        variant={"outline"}
                                        onClick={() => generatePwd()}
                                    >
                                        <Dices className='size-3.5' />
                                        Gerar
                                    </Button>
                                </div>
                            </FormControl>
                            <FormDescription>A senha de login do funcionário</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className='pt-2'>
                    <Button
                        type='submit'
                        disabled={!form.formState.isValid || loading}
                        className='w-full'
                    >
                        Cadastrar {!loading ? <Plus /> : <Loader2 className='animate-spin' />}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
