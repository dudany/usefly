"use client"

import { Fragment } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { MetricComparison } from "./mock-data"

interface MetricsBreakdownProps {
  metrics: MetricComparison[]
  viewMode: "list" | "card" | "table"
}

interface GroupedMetrics {
  parentMetric: string
  category: string
  subMetrics: MetricComparison[]
}

// Helper function to group metrics by parent metric
function groupMetricsByParent(metrics: MetricComparison[]): GroupedMetrics[] {
  const grouped = new Map<string, GroupedMetrics>()

  for (const metric of metrics) {
    const key = `${metric.category}-${metric.parentMetric}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        parentMetric: metric.parentMetric,
        category: metric.category,
        subMetrics: [],
      })
    }
    grouped.get(key)!.subMetrics.push(metric)
  }

  return Array.from(grouped.values())
}

function getImpactColor(impact: "positive" | "negative" | "neutral") {
  switch (impact) {
    case "positive":
      return "text-emerald-500"
    case "negative":
      return "text-red-500"
    default:
      return "text-muted-foreground"
  }
}

function getTrendIcon(trend: "up" | "down" | "neutral", impact: "positive" | "negative" | "neutral") {
  const color = getImpactColor(impact)
  if (trend === "up") return <TrendingUp className={`w-4 h-4 ${color}`} />
  if (trend === "down") return <TrendingDown className={`w-4 h-4 ${color}`} />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

function formatMetricValue(value: number, metricName: string): string {
  // Extract unit from metric name (e.g., "Time to Value (minutes)" -> "minutes")
  const unitMatch = metricName.match(/\(([^)]+)\)/)

  if (unitMatch) {
    const unit = unitMatch[1].toLowerCase()

    // For time/count based metrics, show the unit without percentage
    if (unit === "minutes" || unit === "steps") {
      return `${value.toFixed(1)} ${unit}`
    }
  }

  // Default to percentage for rate-based metrics
  return `${value.toFixed(1)}%`
}

function formatMetricDelta(delta: number, metricName: string): string {
  const sign = delta > 0 ? "+" : ""
  const unitMatch = metricName.match(/\(([^)]+)\)/)

  if (unitMatch) {
    const unit = unitMatch[1].toLowerCase()
    if (unit === "minutes" || unit === "steps") {
      return `${sign}${delta.toFixed(1)} ${unit}`
    }
  }

  return `${sign}${delta.toFixed(1)}`
}

function MetricCard({ metric }: { metric: MetricComparison }) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{metric.category}</p>
          <p className="text-sm font-medium mt-1">{metric.subMetricName}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Baseline</p>
            <p className="font-semibold">{formatMetricValue(metric.baselineValue, metric.subMetricName)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Test</p>
            <p className="font-semibold">{formatMetricValue(metric.testValue, metric.subMetricName)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            {getTrendIcon(metric.trend, metric.impact)}
            <span className={`text-sm font-semibold ${getImpactColor(metric.impact)}`}>
              {metric.deltaPercent > 0 ? "+" : ""}
              {metric.deltaPercent.toFixed(1)}%
            </span>
          </div>
          <Badge variant={metric.impact === "positive" ? "default" : metric.impact === "negative" ? "destructive" : "secondary"}>
            {metric.impact}
          </Badge>
        </div>
      </div>
    </Card>
  )
}

function MetricListItem({ metric, isIndented = false }: { metric: MetricComparison; isIndented?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-accent/50">
      <div className="flex-1">
        <p className={`text-sm font-medium ${isIndented ? "pl-6" : ""}`}>{metric.subMetricName}</p>
        <p className={`text-xs text-muted-foreground ${isIndented ? "pl-6" : ""}`}>{metric.category}</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Baseline avg.</p>
          <p className="text-sm font-semibold">{formatMetricValue(metric.baselineValue, metric.subMetricName)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Test avg.</p>
          <p className="text-sm font-semibold">{formatMetricValue(metric.testValue, metric.subMetricName)}</p>
        </div>
        <div className="flex items-center gap-2 min-w-[100px]">
          {getTrendIcon(metric.trend, metric.impact)}
          <span className={`text-sm font-semibold ${getImpactColor(metric.impact)}`}>
            {metric.deltaPercent > 0 ? "+" : ""}
            {metric.deltaPercent.toFixed(1)}%
          </span>
        </div>
        <Badge
          variant={metric.impact === "positive" ? "default" : metric.impact === "negative" ? "destructive" : "secondary"}
          className="min-w-[80px] justify-center"
        >
          {metric.impact}
        </Badge>
      </div>
    </div>
  )
}

export function MetricsBreakdown({ metrics, viewMode }: MetricsBreakdownProps) {
  if (metrics.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
        No metrics to display
      </div>
    )
  }

  const groupedMetrics = groupMetricsByParent(metrics)

  if (viewMode === "card") {
    return (
      <div className="space-y-6">
        {groupedMetrics.map((group, groupIdx) => (
          <div key={`${group.category}-${group.parentMetric}-${groupIdx}`}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group.parentMetric}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.subMetrics.map((metric, idx) => (
                <MetricCard key={`${metric.category}-${metric.subMetricName}-${idx}`} metric={metric} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {groupedMetrics.map((group, groupIdx) => (
          <Card key={`${group.category}-${group.parentMetric}-${groupIdx}`}>
            <div className="p-4 bg-muted/30 border-b border-border">
              <h3 className="text-sm font-semibold">{group.parentMetric}</h3>
              <p className="text-xs text-muted-foreground">{group.category}</p>
            </div>
            {group.subMetrics.map((metric, idx) => (
              <MetricListItem key={`${metric.category}-${metric.subMetricName}-${idx}`} metric={metric} isIndented={true} />
            ))}
          </Card>
        ))}
      </div>
    )
  }

  // Table view with visual hierarchy
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Baseline</TableHead>
              <TableHead className="text-right">Test</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead className="text-right">Change %</TableHead>
              <TableHead className="text-center">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedMetrics.map((group, groupIdx) => (
              <Fragment key={`group-${group.category}-${group.parentMetric}-${groupIdx}`}>
                {/* Parent metric header row */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={7} className="font-semibold">
                    <div className="flex items-center gap-2">
                      <span>{group.parentMetric}</span>
                      <span className="text-xs text-muted-foreground font-normal">({group.category})</span>
                    </div>
                  </TableCell>
                </TableRow>
                {/* Sub-metric rows */}
                {group.subMetrics.map((metric, idx) => (
                  <TableRow key={`${metric.category}-${metric.subMetricName}-${idx}`}>
                    <TableCell className="font-medium pl-8">{metric.subMetricName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{metric.category}</TableCell>
                    <TableCell className="text-right">{formatMetricValue(metric.baselineValue, metric.subMetricName)}</TableCell>
                    <TableCell className="text-right">{formatMetricValue(metric.testValue, metric.subMetricName)}</TableCell>
                    <TableCell className="text-right">
                      {formatMetricDelta(metric.delta, metric.subMetricName)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(metric.trend, metric.impact)}
                        <span className={getImpactColor(metric.impact)}>
                          {metric.deltaPercent > 0 ? "+" : ""}
                          {metric.deltaPercent.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          metric.impact === "positive" ? "default" : metric.impact === "negative" ? "destructive" : "secondary"
                        }
                      >
                        {metric.impact}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
