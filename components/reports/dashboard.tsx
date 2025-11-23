"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { MOCK_AGENT_RUNS } from "@/components/agent-runs/mock-data"
import { MOCK_REPORTS, MOCK_FEATURES, formatReportDate } from "@/components/archived/reports/mock-data"
import { useWebsite } from "@/components/providers/website-provider"
import { JourneySankey } from "./journey-sankey"
import { JourneyTable } from "./journey-table"

export function ReportsDashboard() {
  const { selectedWebsite } = useWebsite()

  // Filters
  const [selectedReportId, setSelectedReportId] = useState<string>("")
  const [segmentType, setSegmentType] = useState<string>("location")
  const [segmentFilter, setSegmentFilter] = useState<string>("all")
  const [personaFilter, setPersonaFilter] = useState<string>("all")

  // Get available segment values based on segment type
  const availableSegments = useMemo(() => {
    if (segmentType === "location") {
      const locations = new Set(MOCK_AGENT_RUNS.map((run) => run.location))
      return Array.from(locations).sort()
    } else if (segmentType === "platform") {
      const platforms = new Set(MOCK_AGENT_RUNS.map((run) => run.platform))
      return Array.from(platforms).sort()
    } else if (segmentType === "status") {
      const statuses = new Set(MOCK_AGENT_RUNS.map((run) => run.status))
      return Array.from(statuses).sort()
    }
    return []
  }, [segmentType])

  // Get unique personas
  const availablePersonas = useMemo(() => {
    const personas = new Set(MOCK_AGENT_RUNS.map((run) => run.personaType))
    return Array.from(personas).sort()
  }, [])

  // Reset segment filter when segment type changes
  const handleSegmentTypeChange = (value: string) => {
    setSegmentType(value)
    setSegmentFilter("all")
  }

  // Filter runs for selected report and additional filters
  const filteredRuns = useMemo(() => {
    if (!selectedReportId) return []

    return MOCK_AGENT_RUNS.filter((run) => {
      // Website filter
      if (run.website !== selectedWebsite) return false

      // Report filter
      if (run.reportId !== selectedReportId) return false

      // Segment filter (dynamic based on segment type)
      if (segmentFilter !== "all") {
        if (segmentType === "location" && run.location !== segmentFilter) return false
        if (segmentType === "platform" && run.platform !== segmentFilter) return false
        if (segmentType === "status" && run.status !== segmentFilter) return false
      }

      // Persona filter
      if (personaFilter !== "all" && run.personaType !== personaFilter) return false

      return true
    })
  }, [selectedReportId, selectedWebsite, segmentType, segmentFilter, personaFilter])

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Segment Type Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Segment Type</label>
            <Select value={segmentType} onValueChange={handleSegmentTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Segment Value Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Segment</label>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`All ${segmentType.charAt(0).toUpperCase() + segmentType.slice(1)}s`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {segmentType.charAt(0).toUpperCase() + segmentType.slice(1)}s</SelectItem>
                {availableSegments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          {selectedFeature && (
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
              groupByLocation={segmentType === "location" && segmentFilter === "all"}
              groupByPersona={personaFilter === "all"}
            />
          </Card>
        </>
      )}
    </div>
  )
}
