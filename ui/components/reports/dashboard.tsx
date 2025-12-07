"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { reportApi, scenarioApi } from "@/lib/api-client"
import { ReportListItem, ReportAggregate, PersonaRun, Scenario } from "@/types/api"
import { JourneySankey } from "./journey-sankey"
import { JourneyTable } from "./journey-table"
import { RunFilters } from "@/components/runs/run-filters"

import { useFilterContext } from "@/contexts/filter-context"

export function ReportsDashboard() {
  const {
    scenarioFilter,
    reportFilter,
    statusFilter,
    personaFilter,
    platformFilter
  } = useFilterContext()

  // State for data fetching
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [reportList, setReportList] = useState<ReportListItem[]>([])
  const [selectedReportData, setSelectedReportData] = useState<ReportAggregate | null>(null)

  const [agentRuns, setAgentRuns] = useState<PersonaRun[]>([])
  const [availablePersonas, setAvailablePersonas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAggregate, setLoadingAggregate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sankeyMode, setSankeyMode] = useState<string>("compact")

  // Fetch report list, scenarios and personas on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [reportsData, scenariosData, personasData] = await Promise.all([
          reportApi.list(),
          scenarioApi.list(),
          scenarioApi.getPersonas(),
        ])
        setReportList(reportsData)
        setScenarios(scenariosData)
        setAvailablePersonas(personasData.personas.sort())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch reports")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch aggregated data (SERVER SIDE FILTERED) and runs when report or filters change
  useEffect(() => {
    // If no report selected (or "all" selected), we can't show aggregation
    if (!reportFilter || reportFilter === "all") {
      setSelectedReportData(null)
      setAgentRuns([])
      return
    }

    const fetchReportData = async () => {
      try {
        setLoadingAggregate(true)

        // Prepare filters for API
        const filters = {
          persona: personaFilter,
          status: statusFilter,
          platform: platformFilter
        }

        // Fetch aggregated data AND filtered runs in parallel
        // Both use _query_persona_runs on the backend with the same filters
        const [aggregateData, runsData] = await Promise.all([
          reportApi.getAggregate(reportFilter, sankeyMode, filters),
          reportApi.getRuns(reportFilter, filters)
        ])

        setSelectedReportData(aggregateData)
        setAgentRuns(runsData)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch report data")
        // Even if aggregate fails (e.g. 404 from empty filters?), we should handle gracefully
        // The backend now returns a zero-struct if possible, or 404 if report missing.
      } finally {
        setLoadingAggregate(false)
      }
    }

    fetchReportData()
  }, [reportFilter, personaFilter, statusFilter, platformFilter, sankeyMode])

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

      {/* Unified Filters */}
      <RunFilters
        scenarios={scenarios}
        reports={reportList}
        availablePersonas={availablePersonas}
        showPlatformFilter={true}
        showDateFilter={false}
      />

      {/* Main Content */}
      {(!reportFilter || reportFilter === "all") ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Select a report to view journey analysis</p>
            <p className="text-sm">
              {/* Assuming filteredReportsList is defined elsewhere or should be reportList.length */}
              {reportList.length} reports available
            </p>
          </div>
        </Card>
      ) : loadingAggregate ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading analysis...</span>
        </div>
      ) : selectedReportData ? (
        <>
          {/* Report Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">{selectedReportData.scenario_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Report ID: {selectedReportData.report_id.substring(0, 8)}... •
              Analysis based on {selectedReportData.run_count} filtered runs
            </p>
          </div>

          {/* Metrics Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Metrics Summary</h3>
            {selectedReportData.run_count === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No data matches the selected filters</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold text-foreground">{selectedReportData.metrics_summary.total_runs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{selectedReportData.metrics_summary.sucessfull_runs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goal Not Met</p>
                  <p className="text-2xl font-bold text-amber-600">{selectedReportData.metrics_summary.failed_runs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Error</p>
                  <p className="text-2xl font-bold text-red-600">{selectedReportData.metrics_summary.error_runs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(selectedReportData.metrics_summary.success_rate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Journey Sankey Diagram */}
          {selectedReportData.run_count > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Journey Flow</h3>
                <ToggleGroup type="single" value={sankeyMode} onValueChange={setSankeyMode}>
                  <ToggleGroupItem value="compact" aria-label="Compact mode">
                    Compact
                  </ToggleGroupItem>
                  <ToggleGroupItem value="full" aria-label="Full mode">
                    Full
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <JourneySankey data={selectedReportData.journey_sankey} />
            </Card>
          )}

          {/* Journey Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Journey Details</h3>
            {agentRuns.length > 0 ? (
              <JourneyTable
                runs={agentRuns}
                groupByPlatform={platformFilter === "all"}
                groupByPersona={personaFilter === "all"}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">No runs match criteria</div>
            )}
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

