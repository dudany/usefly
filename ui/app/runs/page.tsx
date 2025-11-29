import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { AgentRunsDashboard } from "@/components/runs/dashboard"

export default function AgentRunsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Agent Runs</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and analyze simulated agent interactions</p>
        </div>
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          <AgentRunsDashboard />
        </Suspense>
      </div>
    </AppLayout>
  )
}
