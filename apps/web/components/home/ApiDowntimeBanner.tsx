"use client"

import { TriangleAlert, X } from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { getApiHealthStatus } from "@/lib/services/api"

const apiHealthQuery = getApiHealthStatus()

export function ApiDowntimeBanner() {
  const healthy = use(apiHealthQuery)

  if (healthy) return

  return (
    <div className="fixed bottom-2 z-97">
      <input type="checkbox" id="hide-api-banner" className="peer hidden" />

      <div className="peer-checked:hidden flex items-center justify-center bg-amber-500/30 px-3 py-1.5 rounded-full">
        <p className="text-center text-xs items-center text-amber-900 dark:text-amber-400">
          <TriangleAlert className="inline-flex size-3.5" /> API indisponível –{" "}
          <Link href="/downtime" className="underline">
            Saiba mais
          </Link>
        </p>

        <label
          htmlFor="hide-api-banner"
          className="inline-fle cursor-pointer ml-2"
          aria-label="Fechar"
        >
          <X className="size-4 text-amber-900 dark:text-amber-400" />
        </label>
      </div>
    </div>
  )
}
