"use client"

import { Toaster } from "@pheralb/toast"
import { useTheme } from "next-themes"
import { Themes } from "./theme-provider"

export const ThemedToaster = () => {
  const { theme } = useTheme()

  return <Toaster theme={theme as Themes} toastFont="Inter" />
}
