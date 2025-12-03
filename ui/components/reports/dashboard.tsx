"use client"

import { useState, useMemo, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Loader } from "lucide-react"
import { reportApi, personaRecordsApi } from "@/lib/api-client"
import { Report, PersonaRun } from "@/types/api"
import { useSegments } from "@/components/providers/segments-provider"
import { SegmentsFilter } from "@/components/filters/segments-filter"
import { JourneySankey } from "./journey-sankey"
import { JourneyTable } from "./journey-table"
import { getPersonaLabel } from "@/components/runs/mock-data"

export function ReportsDashboard() {
  const { selectedSegments } = useSegments()

  // State for data fetching
  const [reports, setReports] = useState<Report[]>([])
  const [agentRuns, setAgentRuns] = useState<PersonaRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedReportId, setSelectedReportId] = useState<string>("")
  const [personaFilter, setPersonaFilter] = useState<string>("all")

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [reportsData, runsData] = await Promise.all([
          reportApi.list({ limit: 100 }),
          personaRecordsApi.list({ limit: 100 }),
        ])
        setReports(reportsData)
        setAgentRuns(runsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get unique personas from agent runs
  const availablePersonas = useMemo(() => {
    const personas = new Set(agentRuns.map((run) => run.persona_type))
    return Array.from(personas).sort()
  }, [agentRuns])

  // Filter runs for selected report and additional filters (AND logic)
  const filteredRuns = useMemo(() => {
    if (!selectedReportId) return []

    const selectedReport = reports.find((r) => r.id === selectedReportId)
    if (!selectedReport) return []

    // Get run IDs associated with this report
    const reportRunIds = new Set(
      agentRuns
        .filter((run) => run.config_id === selectedReport.config_id)
        .map((run) => run.id)
    )

    return agentRuns.filter((run) => {
      // Report filter (runs associated with selected report's config)
      if (!reportRunIds.has(run.id)) return false

      // Segment filters - AND logic (must match all selected segments)
      if (selectedSegments.length > 0) {
        for (const segment of selectedSegments) {
          if (segment.type === "platform" && run.platform !== segment.value) return false
          if (segment.type === "status" && run.status !== segment.value) return false
        }
      }

      // Persona filter
      if (personaFilter !== "all" && run.persona_type !== personaFilter) return false

      return true
    })
  }, [selectedReportId, reports, agentRuns, selectedSegments, personaFilter])

  // Get selected report
  const selectedReport = reports.find((r) => r.id === selectedReportId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    )
  }

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
                {reports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.name} - {new Date(report.created_at).toLocaleDateString()}
                  </SelectItem>
                ))}
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
                    {getPersonaLabel(persona)}
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
          {selectedReport && (
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground">{selectedReport.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Report from {new Date(selectedReport.created_at).toLocaleDateString()} • {filteredRuns.length} runs
              </p>
            </div>
          )}

          {/* Journey Sankey Diagram */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Journey Flow</h3>
            <JourneySankey data={selectedReport?.journey_sankey} />
          </Card>

          {/* Journey Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Journey Metrics</h3>
            <JourneyTable
              runs={filteredRuns}
              groupByPlatform={!selectedSegments.some((s) => s.type === "platform")}
              groupByPersona={personaFilter === "all"}
            />
          </Card>
        </>
      )}
    </div>
  )
}
