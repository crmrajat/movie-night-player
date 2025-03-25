"use client"

import { Toaster as SonnerToaster } from "sonner"
import { useTheme } from "next-themes"

export function SonnerToastProvider() {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontSize: "14px",
        },
        className: "group",
      }}
      theme={theme as "light" | "dark" | "system"}
      richColors
      closeButton
    />
  )
}

