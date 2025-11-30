"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader } from "lucide-react"
import { RunTable } from "./run-table"
import { agentRunApi, reportApi, scenarioApi } from "@/lib/api-client"
import { Scenario, AgentRun, Report } from "@/types/api"
import { getPersonaLabel } from "./mock-data"

const METRIC_CATEGORIES = ["Conversion", "Friction", "Activation", "Engagement"]
const PERSONAS = ["new-shopper", "returning-user", "admin-user", "premium-user", "guest"]

export function AgentRunsDashboard() {
  const searchParams = useSearchParams()

  // State for data fetching
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize filters from URL query parameters or defaults
  const [scenarioFilter, setScenarioFilter] = useState<string>("all")
  const [reportFilter, setReportFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [personaFilter, setPersonaFilter] = useState<string>("all")

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [scenariosData, runsData, reportsData] = await Promise.all([
          scenarioApi.list(),
          agentRunApi.list({ limit: 100 }),
          reportApi.list({ limit: 100 }),
        ])
        setScenarios(scenariosData)
        setAgentRuns(runsData)
        setReports(reportsData)
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
    const category = searchParams.get("category")

    if (reportId) {
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        setScenarioFilter(report.config_id)
        setReportFilter(reportId)
      }
    }
    if (persona) {
      setPersonaFilter(persona)
    }
    if (category) {
      setCategoryFilter(category)
    }
  }, [searchParams, reports])

  // Get available reports for selected scenario
  const availableReports = useMemo(() => {
    if (scenarioFilter === "all") return reports
    return reports.filter((r) => r.config_id === scenarioFilter)
  }, [scenarioFilter, reports])

  // Update report filter when scenario changes
  const handleScenarioChange = (scenarioId: string) => {
    setScenarioFilter(scenarioId)
    if (scenarioId !== "all") {
      const scenarioReports = reports.filter((r) => r.config_id === scenarioId)
      if (scenarioReports.length > 0) {
        setReportFilter(scenarioReports[0].id)
      }
    } else {
      setReportFilter("all")
    }
  }

  // Filter runs based on all criteria
  const filteredRuns = useMemo(() => {
    return agentRuns.filter((run) => {
      // Scenario filter
      if (scenarioFilter !== "all" && run.config_id !== scenarioFilter) return false

      // Persona filter
      if (personaFilter !== "all" && run.persona_type !== personaFilter) return false

      return true
    })
  }, [scenarioFilter, personaFilter, agentRuns])

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
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Test Scenario</label>
            <Select value={scenarioFilter} onValueChange={handleScenarioChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select scenario" />
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

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Report</label>
            <Select value={reportFilter} onValueChange={setReportFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                {availableReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.name} ({new Date(report.created_at).toLocaleDateString()})
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
                <SelectItem value="all">All Categories</SelectItem>
                {METRIC_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Persona</label>
          <Select value={personaFilter} onValueChange={setPersonaFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              {PERSONAS.map((persona) => (
                <SelectItem key={persona} value={persona}>
                  {getPersonaLabel(persona)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
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
