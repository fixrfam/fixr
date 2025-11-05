import { ClipboardPlus } from 'lucide-react'
import { BackButton } from '@/components/dashboard/back-button'
import { Heading } from '@/components/dashboard/heading'
import { NewServiceOrderForm } from '@/components/dashboard/service-order/new-service-order-form'

export default function NewServiceOrderPage() {
  return (
    <div className="space-y-6">
      <BackButton className="-translate-x-2" />
      <Heading
        Icon={ClipboardPlus}
        title="Criar nova ordem de serviço"
        description="Preencha os campos abaixo para criar uma nova ordem de serviço."
      />
      <div>
        <NewServiceOrderForm className="max-w-2xl" />
      </div>
    </div>
  )
}
