"use client"

import { ArrowLeft, Construction } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="w-full h-dvh grid place-items-center text-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-primary/20 border border-primary text-primary ring-primary/50 ring-2 size-12 grid place-items-center rounded-md">
          <Construction className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Em breve por aqui!</h1>
          <p className="mt-2">Essa funcionalidade ainda está em construção.</p>
          <p className="text-sm text-gray-700 mt-1">
            Estamos trabalhando para lançar novidades o quanto antes. Obrigado
            pela paciência!
          </p>
        </div>
        <Button variant={"default"} onClick={() => router.back()}>
          <ArrowLeft /> Voltar
        </Button>
      </div>
    </div>
  )
}
