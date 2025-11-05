'use client'

import { roleLabels } from '@fixr/constants/roles'
import { employeeSelectSchema } from '@fixr/db/schema'
import { accountSchema } from '@fixr/schemas/account'
import { ColumnDef } from '@tanstack/react-table'
import {
  ArrowRight,
  BriefcaseBusiness,
  MoreHorizontal,
  PencilLine,
  Trash2,
} from 'lucide-react'
import { z } from 'zod'
import { Avatar } from '@/components/account/profile-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const dataSchema = employeeSelectSchema.extend({
  account: accountSchema.pick({
    id: true,
    email: true,
    avatarUrl: true,
    createdAt: true,
  }),
})

export const columns: ColumnDef<z.infer<typeof dataSchema>>[] = [
  {
    accessorKey: 'name',
    header: 'Funcionário',
    cell: ({ row }) => {
      return (
        <div className="inline-flex items-center gap-3">
          <Avatar
            fallbackHash={row.original.account.id as string}
            className="size-9"
            src={row.original.account.avatarUrl}
          />
          <div className="flex flex-col">
            <p>{row.original.name}</p>
            <p className="text-xs inline-flex items-center text-muted-foreground hover:underline cursor-pointer">
              Ver perfil <ArrowRight className="size-3 ml-0.5" />
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'role',
    header: 'Cargo',
    cell: ({ row }) => {
      return (
        <div className="inline-flex items-center gap-2">
          <div className="text-primary bg-primary/30 p-1 rounded-md">
            <BriefcaseBusiness className="size-4" />
          </div>
          {roleLabels[row.original.role]}
        </div>
      )
    },
  },
  {
    accessorKey: 'account.email',
    header: 'Email',
  },
  {
    accessorKey: 'cpf',
    header: 'CPF',
    cell: ({ row }) => {
      return row.original.cpf.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4',
      )
    },
  },
  // {
  //     accessorKey: "phone",
  //     header: "Celular",
  // },
  {
    accessorKey: 'createdAt',
    header: 'Cadastrado em',
    cell: ({ row }) => {
      const date = new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(row.original.createdAt))

      return date
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <PencilLine />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
