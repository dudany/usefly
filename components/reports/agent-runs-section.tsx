"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { MOCK_AGENT_RUNS, getPersonaLabel, type AgentRun } from "@/components/agent-runs/mock-data"

interface AgentRunsSectionProps {
  baselineRunIds: string[]
  testRunIds: string[]
}

function formatDate(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function getStatusIcon(status: AgentRun["status"]) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case "anomaly":
      return <AlertCircle className="w-4 h-4 text-amber-500" />
    case "in-progress":
      return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
  }
}

function getStatusVariant(status: AgentRun["status"]): "default" | "destructive" | "secondary" {
  switch (status) {
    case "success":
      return "default"
    case "error":
      return "destructive"
    default:
      return "secondary"
  }
}

function RunsTable({ runs, variant }: { runs: AgentRun[]; variant: "baseline" | "test" }) {
  if (runs.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No {variant} runs found
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Persona</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="font-medium">{getPersonaLabel(run.personaType)}</TableCell>
              <TableCell>
                <Badge variant="outline">{run.platform}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(run.status)}
                  <Badge variant={getStatusVariant(run.status)}>{run.status}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(run.stepsCompleted / run.totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {run.stepsCompleted}/{run.totalSteps}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm">{run.duration}s</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{formatDate(run.timestamp)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function AgentRunsSection({ baselineRunIds, testRunIds }: AgentRunsSectionProps) {
  const baselineRuns = useMemo(
    () => MOCK_AGENT_RUNS.filter((run) => baselineRunIds.includes(run.id)),
    [baselineRunIds]
  )

  const testRuns = useMemo(
    () => MOCK_AGENT_RUNS.filter((run) => testRunIds.includes(run.id)),
    [testRunIds]
  )

  const baselineStats = useMemo(() => {
    const total = baselineRuns.length
    const success = baselineRuns.filter((r) => r.status === "success").length
    const avgDuration = total > 0 ? baselineRuns.reduce((sum, r) => sum + r.duration, 0) / total : 0
    return { total, success, successRate: total > 0 ? (success / total) * 100 : 0, avgDuration }
  }, [baselineRuns])

  const testStats = useMemo(() => {
    const total = testRuns.length
    const success = testRuns.filter((r) => r.status === "success").length
    const avgDuration = total > 0 ? testRuns.reduce((sum, r) => sum + r.duration, 0) / total : 0
    return { total, success, successRate: total > 0 ? (success / total) * 100 : 0, avgDuration }
  }, [testRuns])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Agent Runs</h3>

      {/* Baseline Runs */}
      <Card>
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Baseline Runs</h4>
              <Badge variant="outline">Control Group</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Success: <span className="font-semibold text-foreground">{baselineStats.successRate.toFixed(1)}%</span>
              </span>
              <span className="text-muted-foreground">
                Avg Duration: <span className="font-semibold text-foreground">{baselineStats.avgDuration.toFixed(0)}s</span>
              </span>
              <span className="text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{baselineStats.total}</span>
              </span>
            </div>
          </div>
        </div>
        <RunsTable runs={baselineRuns} variant="baseline" />
      </Card>

      {/* Test Runs */}
      <Card>
        <div className="p-4 border-b border-border bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Test Runs</h4>
              <Badge>Test Variant</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Success: <span className="font-semibold text-foreground">{testStats.successRate.toFixed(1)}%</span>
              </span>
              <span className="text-muted-foreground">
                Avg Duration: <span className="font-semibold text-foreground">{testStats.avgDuration.toFixed(0)}s</span>
              </span>
              <span className="text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{testStats.total}</span>
              </span>
            </div>
          </div>
        </div>
        <RunsTable runs={testRuns} variant="test" />
      </Card>
    </div>
  )
}
