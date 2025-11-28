"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { MOCK_AGENT_RUNS } from "@/components/agent-runs/mock-data"
import { MOCK_REPORTS, MOCK_FEATURES, formatReportDate } from "@/components/archived/reports/mock-data"
import { useWebsite } from "@/components/providers/website-provider"
import { useSegments } from "@/components/providers/segments-provider"
import { SegmentsFilter } from "@/components/filters/segments-filter"
import { JourneySankey } from "./journey-sankey"
import { JourneyTable } from "./journey-table"

export function ReportsDashboard() {
  const { selectedWebsite } = useWebsite()
  const { selectedSegments } = useSegments()

  // Filters
  const [selectedReportId, setSelectedReportId] = useState<string>("")
  const [personaFilter, setPersonaFilter] = useState<string>("all")

  // Get unique personas
  const availablePersonas = useMemo(() => {
    const personas = new Set(MOCK_AGENT_RUNS.map((run) => run.personaType))
    return Array.from(personas).sort()
  }, [])

  // Filter runs for selected report and additional filters (AND logic)
  const filteredRuns = useMemo(() => {
    if (!selectedReportId) return []

    return MOCK_AGENT_RUNS.filter((run) => {
      // Website filter
      if (run.website !== selectedWebsite) return false

      // Report filter
      if (run.reportId !== selectedReportId) return false

      // Segment filters - AND logic (must match all selected segments)
      if (selectedSegments.length > 0) {
        for (const segment of selectedSegments) {
          if (segment.type === "location" && run.location !== segment.value) return false
          if (segment.type === "platform" && run.platform !== segment.value) return false
          if (segment.type === "status" && run.status !== segment.value) return false
        }
      }

      // Persona filter
      if (personaFilter !== "all" && run.personaType !== personaFilter) return false

      return true
    })
  }, [selectedReportId, selectedWebsite, selectedSegments, personaFilter])

  // Get feature name for selected report
  const selectedReport = MOCK_REPORTS.find((r) => r.id === selectedReportId)
  const selectedFeature = selectedReport
    ? MOCK_FEATURES.find((f) => f.id === selectedReport.featureId)
    : null

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Report ID Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Report</label>
            <Select value={selectedReportId} onValueChange={setSelectedReportId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a report" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_REPORTS.map((report) => {
                  const feature = MOCK_FEATURES.find((f) => f.id === report.featureId)
                  return (
                    <SelectItem key={report.id} value={report.id}>
                      {feature?.name} - {formatReportDate(report.createdAt)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Unified Segment Multi-Select */}
          <SegmentsFilter />

          {/* Persona Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Persona</label>
            <Select value={personaFilter} onValueChange={setPersonaFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Personas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Personas</SelectItem>
                {availablePersonas.map((persona) => (
                  <SelectItem key={persona} value={persona}>
                    {persona.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {!selectedReportId ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Select a report to view journey analysis</p>
            <p className="text-sm">Use the filters above to choose a report and optionally filter by segment and persona</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Report Header */}
          {selectedFeature && selectedReport && (
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground">{selectedFeature.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Report from {formatReportDate(selectedReport.createdAt)} • {filteredRuns.length} runs
              </p>
            </div>
          )}

          {/* Journey Sankey Diagram */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Journey Flow</h3>
            <JourneySankey />
          </Card>

          {/* Journey Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Journey Metrics</h3>
            <JourneyTable
              runs={filteredRuns}
              groupByLocation={!selectedSegments.some((s) => s.type === "location")}
              groupByPersona={personaFilter === "all"}
            />
          </Card>
        </>
      )}
    </div>
  )
}
