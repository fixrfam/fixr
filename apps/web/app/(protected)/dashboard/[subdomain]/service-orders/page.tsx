import { Plus } from "lucide-react"
import { DashLink } from "@/components/dashboard/dash-link"
import { Heading } from "@/components/dashboard/heading"
import { Button } from "@/components/ui/button"

type Params = Promise<{ subdomain: string }>

export default async function ServiceOrdersPage({
  params,
}: {
  params: Params
}) {
  const { subdomain } = await params

  return (
    <div className="space-y-4">
      <Heading
        title={"Ordens de serviço"}
        description={"Controle as ordens de serviço de seus clientes"}
      />
      <Button asChild>
        <DashLink href={"/service-orders/new"} subdomain={subdomain} prefetch>
          Nova ordem de serviço <Plus className="size-4" />
        </DashLink>
      </Button>
    </div>
  )
}
