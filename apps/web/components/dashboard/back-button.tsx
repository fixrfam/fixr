"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "../ui/button"

export function BackButton({ className, ...props }: ButtonProps) {
  const router = useRouter()

  return (
    <Button
      variant={"ghost"}
      className={cn("text-foreground px-0", className)}
      onClick={() => router.back()}
      {...props}
    >
      <ArrowLeft />
      Voltar
    </Button>
  )
}
