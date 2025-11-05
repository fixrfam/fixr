'use client'

import { ApiResponse } from '@fixr/schemas/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@pheralb/toast'
import { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { axios } from '@/lib/auth/axios'
import { fallbackMessages, messages } from '@/lib/messages'
import { api } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'

export function DeleteAccount() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const requestAccountDeletionSchema = z.object({
    confirmPhrase: z.string().regex(/^delete my account$/, {
      message: 'Frase inválida.',
    }),
  })

  const form = useForm<z.infer<typeof requestAccountDeletionSchema>>({
    resolver: zodResolver(requestAccountDeletionSchema),
    defaultValues: { confirmPhrase: '' },
    mode: 'all',
  })

  const { formState } = form

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function onSubmit(_: z.infer<typeof requestAccountDeletionSchema>) {
    setLoading(true)
    try {
      const res = await axios.post<ApiResponse>(
        api('/account/request-deletion'),
        {
          withCredentials: true,
        },
      )
      if (res.status === 201) {
        const message = messages[res.data.code] ?? fallbackMessages.success
        setOpen(false)

        toast.success({
          text: message.title,
          description: message.description,
        })
      }
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size={'sm'} variant={'destructive'}>
          Solicitar exclusão
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua
            conta e removerá seus dados dos nossos servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form id="change_password" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="confirmPhrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Por favor, digite &quot;delete my account&quot; para
                    continuar
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      required
                      placeholder="Digite aqui"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            variant={'destructive'}
            type="submit"
            disabled={loading || !formState.isValid}
            form="change_password"
          >
            {!loading ? (
              <>Excluir</>
            ) : (
              <Loader2 className="animate-spin size-4" />
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
