"use client"

import { useState, useMemo } from "react"
import { Grid, List, Table as TableIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MOCK_FEATURES, MOCK_REPORTS, METRIC_CATEGORIES, getReportsByFeature, getReportById, formatReportDate, calculateMetricsFromRuns } from "./mock-data"
import { MetricsBreakdown } from "./metrics-breakdown"
import { AgentRunsSection } from "./agent-runs-section-new"
import { getRunsByReportAndVariant } from "@/components/agent-runs/mock-data"

export function ReportsDashboard() {
  const [featureFilter, setFeatureFilter] = useState<string>("feat-1")
  const [reportFilter, setReportFilter] = useState<string>("rep-1-1")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const [viewMode, setViewMode] = useState<"list" | "card" | "table">("list")

  const availableReports = useMemo(
    () => getReportsByFeature(featureFilter),
    [featureFilter]
  )

  const selectedReport = useMemo(
    () => getReportById(reportFilter),
    [reportFilter]
  )

  const filteredMetrics = useMemo(() => {
    if (!selectedReport) return []
    if (!categoryFilter || categoryFilter === "") return []

    // Calculate metrics from agent runs
    const baselineRuns = getRunsByReportAndVariant(selectedReport.id, "baseline")
    const testRuns = getRunsByReportAndVariant(selectedReport.id, "test")
    const calculatedMetrics = calculateMetricsFromRuns(baselineRuns, testRuns)

    // Return all metrics if "All" is selected, otherwise filter by category
    if (categoryFilter === "All") {
      return calculatedMetrics
    }
    return calculatedMetrics.filter((m) => m.category === categoryFilter)
  }, [selectedReport, categoryFilter])

  // Update report filter when feature changes
  const handleFeatureChange = (featureId: string) => {
    setFeatureFilter(featureId)
    const reports = getReportsByFeature(featureId)
    if (reports.length > 0) {
      setReportFilter(reports[0].id)
    }
  }

  if (!selectedReport) {
    return <div className="p-6 text-muted-foreground">No report selected</div>
  }

  const selectedFeature = MOCK_FEATURES.find((f) => f.id === featureFilter)

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Feature</label>
            <Select value={featureFilter} onValueChange={handleFeatureChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select feature" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_FEATURES.map((feature) => (
                  <SelectItem key={feature.id} value={feature.id}>
                    {feature.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Report Date</label>
            <Select value={reportFilter} onValueChange={setReportFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select report date" />
              </SelectTrigger>
              <SelectContent>
                {availableReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {formatReportDate(report.createdAt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Metric Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {METRIC_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {selectedFeature && (
              <span>
                {selectedFeature.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">View:</span>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <Grid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown */}
      {categoryFilter && categoryFilter !== "" ? (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-4">Metrics Breakdown</h3>
            <MetricsBreakdown metrics={filteredMetrics} viewMode={viewMode} />
          </div>

          {/* Agent Runs Section */}
          <AgentRunsSection reportId={selectedReport.id} category={categoryFilter} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-muted-foreground">No Metric Category Selected</h3>
            <p className="text-sm text-muted-foreground/70">Please select a metric category from the filter above to view comparison data</p>
          </div>
        </div>
      )}
    </div>
  )
}
