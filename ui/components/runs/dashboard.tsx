"use client"

import { useState, useEffect } from "react"
import { RunFilters } from "./run-filters"
import { Loader } from "lucide-react"
import { RunTable } from "./run-table"
import { personaRecordsApi, reportApi, scenarioApi } from "@/lib/api-client"
import { Scenario, PersonaRun, ReportListItem } from "@/types/api"
import { useFilterContext } from "@/contexts/filter-context"

export function RunsDashboard() {
  const {
    scenarioFilter,
    reportFilter,
    statusFilter,
    personaFilter,
    platformFilter
  } = useFilterContext()

  // State for data fetching
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [agentRuns, setAgentRuns] = useState<PersonaRun[]>([])
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [availablePersonas, setAvailablePersonas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data (scenarios, reports, personas) on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [scenariosData, reportsData, personasData] = await Promise.all([
          scenarioApi.list(),
          reportApi.list(),
          scenarioApi.getPersonas(),
        ])
        setScenarios(scenariosData)
        setReports(reportsData)
        setAvailablePersonas(personasData.personas.sort())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch runs whenever filters change (backend filtering)
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const filters: any = { limit: 1000 }

        if (scenarioFilter !== "all") filters.configId = scenarioFilter
        if (reportFilter !== "all") filters.reportId = reportFilter
        if (statusFilter !== "all") filters.status = statusFilter
        if (personaFilter !== "all") filters.personaType = personaFilter
        if (platformFilter !== "all") filters.platform = platformFilter

        console.log('[RunsDashboard] Fetching runs with filters:', filters)
        const runsData = await personaRecordsApi.list(filters)
        console.log('[RunsDashboard] Received', runsData.length, 'runs')
        setAgentRuns(runsData)
      } catch (err) {
        console.error('[RunsDashboard] Error fetching runs:', err)
        setError(err instanceof Error ? err.message : "Failed to fetch runs")
      }
    }

    fetchRuns()
  }, [scenarioFilter, reportFilter, statusFilter, personaFilter, platformFilter])

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
      <RunFilters
        scenarios={scenarios}
        reports={reports}
        availablePersonas={availablePersonas}
        showPlatformFilter={true}
        showDateFilter={false}
      />

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {agentRuns.length} runs
      </div>

      {/* Table */}
      {agentRuns.length > 0 ? (
        <RunTable runs={agentRuns} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No agent runs found. Try adjusting your filters.
        </div>
      )}
    </div>
  )
}
