import type React from "react"
import { Sidebar } from "./sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1">
        <div className="sticky top-0 z-50 flex justify-end px-6 py-4 bg-background/95 backdrop-blur border-b border-border">
          <ThemeToggle />
        </div>
        <div className="bg-background">{children}</div>
      </main>
    </div>
  )
}
