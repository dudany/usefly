"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader, X } from "lucide-react"
import { RunTable } from "./run-table"
import { personaRecordsApi, reportApi, scenarioApi } from "@/lib/api-client"
import { Scenario, PersonaRun, ReportListItem } from "@/types/api"
import { getPersonaLabel } from "./mock-data"

// Status derived from is_done and judgement_data
type RunStatus = "success" | "failed" | "error" | "all"

function getRunStatus(run: PersonaRun): RunStatus {
  if (!run.is_done) return "error"
  if (run.judgement_data?.verdict === true) return "success"
  return "failed"
}

export function RunsDashboard() {
  const searchParams = useSearchParams()

  // State for data fetching
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [agentRuns, setAgentRuns] = useState<PersonaRun[]>([])
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [availablePersonas, setAvailablePersonas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [scenarioFilter, setScenarioFilter] = useState<string>("all")
  const [reportFilter, setReportFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<RunStatus>("all")
  const [personaFilter, setPersonaFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [scenariosData, runsData, reportsData, personasData] = await Promise.all([
          scenarioApi.list(),
          personaRecordsApi.list({ limit: 100 }),
          reportApi.list(),
          scenarioApi.getPersonas(),
        ])
        setScenarios(scenariosData)
        setAgentRuns(runsData)
        setReports(reportsData)

        // Also extract unique personas from the runs
        const runPersonas = new Set(runsData.map((run) => run.persona_type).filter(Boolean))
        const allPersonas = new Set([...personasData.personas, ...runPersonas])
        setAvailablePersonas(Array.from(allPersonas).sort())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Apply URL query parameters on mount
  useEffect(() => {
    const reportId = searchParams.get("reportId")
    const persona = searchParams.get("persona")
    const status = searchParams.get("status")

    if (reportId) {
      const report = reports.find((r) => r.report_id === reportId)
      if (report) {
        setScenarioFilter(report.scenario_id)
        setReportFilter(reportId)
      }
    }
    if (persona) {
      setPersonaFilter(persona)
    }
    if (status && ["success", "failed", "error"].includes(status)) {
      setStatusFilter(status as RunStatus)
    }
  }, [searchParams, reports])

  // Get available reports for selected scenario
  const availableReports = useMemo(() => {
    if (scenarioFilter === "all") return reports
    return reports.filter((r) => r.scenario_id === scenarioFilter)
  }, [scenarioFilter, reports])

  // Update report filter when scenario changes
  const handleScenarioChange = (scenarioId: string) => {
    setScenarioFilter(scenarioId)
    setReportFilter("all") // Reset report filter when scenario changes
  }

  // Clear all filters
  const clearFilters = () => {
    setScenarioFilter("all")
    setReportFilter("all")
    setStatusFilter("all")
    setPersonaFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  // Check if any filter is active
  const hasActiveFilters = scenarioFilter !== "all" || reportFilter !== "all" ||
    statusFilter !== "all" || personaFilter !== "all" || dateFrom || dateTo

  // Filter runs based on all criteria
  const filteredRuns = useMemo(() => {
    return agentRuns.filter((run) => {
      // Scenario filter
      if (scenarioFilter !== "all" && run.config_id !== scenarioFilter) return false

      // Report filter
      if (reportFilter !== "all" && run.report_id !== reportFilter) return false

      // Status filter
      if (statusFilter !== "all" && getRunStatus(run) !== statusFilter) return false

      // Persona filter
      if (personaFilter !== "all" && run.persona_type !== personaFilter) return false

      // Date range filter
      if (dateFrom) {
        const runDate = new Date(run.timestamp)
        const fromDate = new Date(dateFrom)
        if (runDate < fromDate) return false
      }
      if (dateTo) {
        const runDate = new Date(run.timestamp)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        if (runDate > toDate) return false
      }

      return true
    })
  }, [scenarioFilter, reportFilter, statusFilter, personaFilter, dateFrom, dateTo, agentRuns])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading agent runs...</span>
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
      <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Filters</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Scenario Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Scenario</label>
            <Select value={scenarioFilter} onValueChange={handleScenarioChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scenarios</SelectItem>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Report</label>
            <Select value={reportFilter} onValueChange={setReportFilter}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                {availableReports.map((report) => (
                  <SelectItem key={report.report_id} value={report.report_id}>
                    {new Date(report.first_run).toLocaleDateString()} ({report.run_count} runs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RunStatus)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">✓ Success</SelectItem>
                <SelectItem value="failed">✗ Goal Not Met</SelectItem>
                <SelectItem value="error">⚠ Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Persona Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Persona</label>
            <Select value={personaFilter} onValueChange={setPersonaFilter}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All" />
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

          {/* Date From */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To Date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRuns.length} of {agentRuns.length} runs
      </div>

      {/* Table */}
      {filteredRuns.length > 0 ? (
        <RunTable runs={filteredRuns} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No agent runs found. Try adjusting your filters.
        </div>
      )}
    </div>
  )
}
