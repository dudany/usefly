"use client"

import { useState, useMemo, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader, X } from "lucide-react"
import { reportApi, personaRecordsApi, scenarioApi } from "@/lib/api-client"
import { ReportListItem, ReportAggregate, PersonaRun, Scenario } from "@/types/api"
import { JourneySankey } from "./journey-sankey"
import { JourneyTable } from "./journey-table"
import { getPersonaLabel } from "@/components/runs/mock-data"

export function ReportsDashboard() {

  // State for data fetching
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [reportList, setReportList] = useState<ReportListItem[]>([])
  const [selectedReportData, setSelectedReportData] = useState<ReportAggregate | null>(null)
  const [agentRuns, setAgentRuns] = useState<PersonaRun[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAggregate, setLoadingAggregate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [scenarioFilter, setScenarioFilter] = useState<string>("all")
  const [selectedReportId, setSelectedReportId] = useState<string>("")
  const [personaFilter, setPersonaFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Fetch report list and scenarios on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [reportsData, scenariosData] = await Promise.all([
          reportApi.list(),
          scenarioApi.list(),
        ])
        setReportList(reportsData)
        setScenarios(scenariosData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch reports")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter reports by scenario and date range
  const filteredReports = useMemo(() => {
    return reportList.filter((report) => {
      // Scenario filter
      if (scenarioFilter !== "all" && report.scenario_id !== scenarioFilter) return false

      // Date range filter
      if (dateFrom) {
        const reportDate = new Date(report.first_run)
        const fromDate = new Date(dateFrom)
        if (reportDate < fromDate) return false
      }
      if (dateTo) {
        const reportDate = new Date(report.last_run)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (reportDate > toDate) return false
      }

      return true
    })
  }, [reportList, scenarioFilter, dateFrom, dateTo])

  // Reset report selection when scenario changes
  const handleScenarioChange = (value: string) => {
    setScenarioFilter(value)
    setSelectedReportId("") // Reset report selection
  }

  // Clear all filters
  const clearFilters = () => {
    setScenarioFilter("all")
    setSelectedReportId("")
    setPersonaFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  // Check if any filter is active
  const hasActiveFilters = scenarioFilter !== "all" || selectedReportId ||
    personaFilter !== "all" || dateFrom || dateTo

  // Fetch aggregated data and runs when report is selected
  useEffect(() => {
    if (!selectedReportId) {
      setSelectedReportData(null)
      setAgentRuns([])
      return
    }

    const fetchReportData = async () => {
      try {
        setLoadingAggregate(true)
        const [aggregateData, runsData] = await Promise.all([
          reportApi.getAggregate(selectedReportId),
          personaRecordsApi.list({ limit: 1000 }),
        ])
        setSelectedReportData(aggregateData)
        // Filter runs for this report_id
        const reportRuns = runsData.filter((run) => run.report_id === selectedReportId)
        setAgentRuns(reportRuns)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch report data")
      } finally {
        setLoadingAggregate(false)
      }
    }

    fetchReportData()
  }, [selectedReportId])

  // Get unique personas from agent runs
  const availablePersonas = useMemo(() => {
    const personas = new Set(agentRuns.map((run) => run.persona_type))
    return Array.from(personas).sort()
  }, [agentRuns])

  // Filter runs for journey table (applying persona filter)
  const filteredRuns = useMemo(() => {
    if (!selectedReportId) return []

    return agentRuns.filter((run) => {
      // Persona filter
      if (personaFilter !== "all" && run.persona_type !== personaFilter) return false

      return true
    })
  }, [selectedReportId, agentRuns, personaFilter])

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

  if (reportList.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">No reports found</p>
          <p className="text-sm">Run some persona tests to generate reports</p>
        </div>
      </Card>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
            <Select value={selectedReportId} onValueChange={setSelectedReportId}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select a report" />
              </SelectTrigger>
              <SelectContent>
                {filteredReports.map((report) => (
                  <SelectItem key={report.report_id} value={report.report_id}>
                    {report.scenario_name} ({report.run_count} runs)
                  </SelectItem>
                ))}
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

      {/* Main Content */}
      {!selectedReportId ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Select a report to view journey analysis</p>
            <p className="text-sm">
              {filteredReports.length} reports available
              {scenarioFilter !== "all" && ` for selected scenario`}
            </p>
          </div>
        </Card>
      ) : loadingAggregate ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading report data...</span>
        </div>
      ) : selectedReportData ? (
        <>
          {/* Report Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">{selectedReportData.scenario_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Report ID: {selectedReportData.report_id.substring(0, 8)}... • {selectedReportData.run_count} total runs • {filteredRuns.length} filtered runs
            </p>
          </div>

          {/* Metrics Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Metrics Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold text-foreground">{selectedReportData.metrics_summary.total_runs}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{selectedReportData.metrics_summary.completed_runs}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{selectedReportData.metrics_summary.failed_runs}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {(selectedReportData.metrics_summary.success_rate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold text-foreground">
                  {selectedReportData.metrics_summary.avg_duration_seconds.toFixed(1)}s
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Steps</p>
                <p className="text-2xl font-bold text-foreground">
                  {selectedReportData.metrics_summary.avg_steps.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>

          {/* Journey Sankey Diagram */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Journey Flow</h3>
            <JourneySankey data={selectedReportData.journey_sankey} />
          </Card>

          {/* Journey Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Journey Metrics</h3>
            <JourneyTable
              runs={filteredRuns}
              groupByPlatform={true}
              groupByPersona={personaFilter === "all"}
            />
          </Card>
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Report not found</p>
            <p className="text-sm">The selected report could not be loaded</p>
          </div>
        </Card>
      )}
    </div>
  )
}

