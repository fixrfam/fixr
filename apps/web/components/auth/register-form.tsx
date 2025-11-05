'use client'

import { createUserSchema as baseCreateUserSchema } from '@fixr/schemas/auth'
import { type ApiResponse } from '@fixr/schemas/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@pheralb/toast'
import { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { axios } from '@/lib/auth/axios'
import { fallbackMessages, messages } from '@/lib/messages'
import { api, cn } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'

export function RegisterForm({
  onSuccess,
}: {
  onSuccess: Dispatch<SetStateAction<boolean>>
}) {
  const [loading, setLoading] = useState(false)

  const createUserSchema = baseCreateUserSchema
    .extend({
      password: z
        .string()
        .min(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
        .max(128, { message: 'A senha deve ter no máximo 128 caracteres.' })
        .refine((password) => /[A-Z]/.test(password), {
          message: 'A senha deve conter pelo menos um caractere maiúsculo.',
        })
        .refine((password) => /[a-z]/.test(password), {
          message: 'A senha deve conter pelo menos um caractere minúsculo.',
        })
        .refine((password) => /[0-9]/.test(password), {
          message: 'A senha deve conter pelo menos um número.',
        })
        .refine((password) => /[#?!@$%^&*-]/.test(password), {
          message: 'A senha deve conter pelo menos um caractere especial.',
        }),
      confirmPassword: z
        .string({ required_error: 'Confirme sua senha.' })
        .min(1, { message: 'Confirme sua senha.' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'As senhas não coincidem.',
      path: ['confirmPassword'],
    })

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'all',
  })

  const { formState } = form

  async function onSubmit(values: z.infer<typeof createUserSchema>) {
    setLoading(true)
    try {
      const res = await axios.post<ApiResponse>(api('/auth/register'), values)
      const message = messages[res.data.code] ?? fallbackMessages.success

      if (res.status === 201) {
        toast.success({
          text: message.title,
          description: message.description,
        })
      }
      onSuccess(true)
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as ApiResponse
        const message = messages[errorData.code] ?? fallbackMessages.error

        toast.error({
          text: message.title,
          description: message.description,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col gap-6')}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Crie uma conta</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Preencha o formulário abaixo para começar
          </p>
        </div>
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
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
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="João Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar senha *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !formState.isValid}
        >
          {!loading ? 'Cadastrar' : <Loader2 className="animate-spin size-4" />}
        </Button>
        <div className="text-center text-sm">
          Já tem uma conta?{' '}
          <Link href="/auth/login" className="underline underline-offset-4">
            Faça login
          </Link>
        </div>
      </form>
    </Form>
  )
}
