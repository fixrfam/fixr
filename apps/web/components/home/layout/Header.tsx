"use client"

import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { TextLogo } from "@/components/svg/TextLogo"
import { Button } from "@/components/ui/button"
import { useScrollPosition } from "@/lib/hooks/use-scroll-position"
import { cn } from "@/lib/utils"

export default function Header() {
  const { hasScrolled } = useScrollPosition()

  return (
    <header
      className={`flex items-center w-full h-20 justify-center p-8 border-b border-border border-opacity-10 fixed z-99 bg-background/50 backdrop-blur-lg`}
    >
      <div
        className={cn(
          `w-full transition-all duration-500 flex justify-between items-center`,
          hasScrolled ? "max-w-7xl" : "max-w-full",
        )}
      >
        <div className="flex gap-8">
          <Link href="/" prefetch>
            <TextLogo className="w-16 text-primary" />
          </Link>
          <nav className="hidden lg:block">
            <ul className="flex gap-6 font-light">
              <li>Funcionalidades</li>
              <li>Produtos</li>
              <li>Preços</li>
              <li>Clientes</li>
              <li>Contato</li>
            </ul>
          </nav>
        </div>
        <div className="flex gap-2">
          <Link href={process.env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
            <Button
              variant="outline"
              className="font-light hidden lg:block"
              size="sm"
            >
              Docs <ExternalLink className="w-3.5 h-3.5 inline-block" />
            </Button>
          </Link>
          <Link href="/auth/login" prefetch>
            <Button size="sm">Entrar</Button>
          </Link>
          <ModeToggle size={"sm"} />
        </div>
      </div>
    </header>
  )
}
