import { List, Plus } from 'lucide-react'
import Link from 'next/link'
import { DashHeader } from '@/components/dash/header'
import { Button } from '@/components/ui/button'

export default function Page() {
  return (
    <div className="space-y-4">
      <DashHeader title="Fixr - Admin" description="Painel de administrador" />
      <div className="flex gap-2">
        <Button asChild variant={'outline'}>
          <Link href="/dash/companies/new">
            <Plus />
            Criar nova empresa
          </Link>
        </Button>
        <Button asChild variant={'outline'}>
          <Link href="/dash/companies">
            <List />
            Ver empresas
          </Link>
        </Button>
      </div>
    </div>
  )
}
