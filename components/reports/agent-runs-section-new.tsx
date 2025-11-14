"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink } from "lucide-react"
import { getRunsByReportAndVariant, getPersonaLabel, type PersonaAggregation } from "@/components/agent-runs/mock-data"

interface AgentRunsSectionProps {
  reportId: string
  category: string
}

function aggregateByPersona(runs: any[]): PersonaAggregation[] {
  const personaMap = new Map<string, any[]>()

  runs.forEach((run) => {
    if (!personaMap.has(run.personaType)) {
      personaMap.set(run.personaType, [])
    }
    personaMap.get(run.personaType)!.push(run)
  })

  const aggregations: PersonaAggregation[] = []

  personaMap.forEach((personaRuns, personaType) => {
    const totalRuns = personaRuns.length
    const successCount = personaRuns.filter((r) => r.status === "success").length
    const errorCount = personaRuns.filter((r) => r.status === "error").length

    const avgProgress = personaRuns.reduce((sum, r) => sum + (r.stepsCompleted / r.totalSteps) * 100, 0) / totalRuns
    const avgDuration = personaRuns.reduce((sum, r) => sum + r.duration, 0) / totalRuns
    const successRate = (successCount / totalRuns) * 100

    aggregations.push({
      personaType,
      personaLabel: getPersonaLabel(personaType),
      totalRuns,
      successCount,
      errorCount,
      avgProgress,
      avgDuration,
      successRate,
    })
  })

  return aggregations.sort((a, b) => a.personaLabel.localeCompare(b.personaLabel))
}

function PersonaTable({
  aggregations,
  variant,
  reportId,
  category
}: {
  aggregations: PersonaAggregation[]
  variant: "baseline" | "test"
  reportId: string
  category: string
}) {
  if (aggregations.length === 0) {
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
            <TableHead className="text-right">Total Runs</TableHead>
            <TableHead className="text-right">Success Rate</TableHead>
            <TableHead className="text-right">Avg Progress</TableHead>
            <TableHead className="text-right">Avg Duration</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregations.map((agg) => (
            <TableRow key={agg.personaType}>
              <TableCell className="font-medium">{agg.personaLabel}</TableCell>
              <TableCell className="text-right">
                {agg.totalRuns}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={agg.successRate >= 75 ? "default" : agg.successRate >= 50 ? "secondary" : "destructive"}>
                  {agg.successRate.toFixed(0)}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${agg.avgProgress}%` }}
                    />
                  </div>
                  <span className="text-sm">{agg.avgProgress.toFixed(0)}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm">{Math.round(agg.avgDuration)}s</TableCell>
              <TableCell className="text-center">
                <Link
                  href={`/agent-runs?reportId=${reportId}&variant=${variant}&persona=${agg.personaType}&category=${encodeURIComponent(category)}`}
                >
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Display
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function AgentRunsSection({ reportId, category }: AgentRunsSectionProps) {
  const baselineRuns = useMemo(() => getRunsByReportAndVariant(reportId, "baseline"), [reportId])
  const testRuns = useMemo(() => getRunsByReportAndVariant(reportId, "test"), [reportId])

  const baselineAggregations = useMemo(() => aggregateByPersona(baselineRuns), [baselineRuns])
  const testAggregations = useMemo(() => aggregateByPersona(testRuns), [testRuns])

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
      <h3 className="text-lg font-semibold">Agent Runs by Persona</h3>

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
        <PersonaTable aggregations={baselineAggregations} variant="baseline" reportId={reportId} category={category} />
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
        <PersonaTable aggregations={testAggregations} variant="test" reportId={reportId} category={category} />
      </Card>
    </div>
  )
}
