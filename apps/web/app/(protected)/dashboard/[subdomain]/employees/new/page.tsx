"use client"

import { UserRoundPlus } from "lucide-react"
import { redirect, useParams, useRouter } from "next/navigation"
import { BackButton } from "@/components/dashboard/back-button"
import { CreateEmployeeForm } from "@/components/dashboard/employees/new/CreateEmployeeForm"
import { Heading } from "@/components/dashboard/heading"
import { useSession } from "@/lib/hooks/use-session"

export default function NewEmployeePage() {
  const session = useSession()

  const router = useRouter()
  const params = useParams<{ subdomain: string }>()

  if (!session) {
    return redirect("/auth/login")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <BackButton variant={"link"} />
        <Heading
          Icon={UserRoundPlus}
          title={"Cadastrar funcionários"}
          description={"Adicione um ou mais os funcionários na sua empresa."}
        />
      </div>
      <CreateEmployeeForm
        session={session}
        onSuccess={() =>
          router.push(`/dashboard/${params.subdomain}/employees`)
        }
      />
    </div>
  )
}
