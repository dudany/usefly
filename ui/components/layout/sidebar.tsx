"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, FileText, ScrollText, Zap, Globe, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWebsite } from "@/components/providers/website-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const navItems = [
  { href: "/new-report", label: "New Report", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/agent-runs", label: "Agent Runs", icon: Zap },
]

const archivedItems = [
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/replay", label: "Replay", icon: Activity },
  { href: "/archived/reports", label: "Archived Reports", icon: ScrollText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { selectedWebsite, setSelectedWebsite } = useWebsite()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar pt-6 flex flex-col">
      {/* Logo */}
      <div className="px-6 pb-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          Griply
        </Link>
      </div>

      {/* Website Filter */}
      <div className="px-6 pb-6">
        <label className="text-xs font-medium text-sidebar-foreground/70 mb-2 block">
          Website
        </label>
        <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="www.test.com">www.test.com</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Archived Section */}
      <div className="border-t border-border px-4 py-4 space-y-2">
        <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-2">
          Archived
        </div>
        {archivedItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors opacity-50",
                isActive
                  ? "bg-sidebar-accent/50 text-sidebar-primary/70"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent/30",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </div>

    </aside>
  )
}
