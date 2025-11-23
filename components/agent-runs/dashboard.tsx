"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RunTable } from "./run-table"
import { MOCK_AGENT_RUNS, getPersonaLabel } from "./mock-data"
import { MOCK_FEATURES, MOCK_REPORTS, METRIC_CATEGORIES, getReportsByFeature, formatReportDate } from "@/components/archived/reports/mock-data"
import { useWebsite } from "@/components/providers/website-provider"

export function AgentRunsDashboard() {
  const searchParams = useSearchParams()
  const { selectedWebsite } = useWebsite()

  // Initialize filters from URL query parameters or defaults
  const [featureFilter, setFeatureFilter] = useState<string>("all")
  const [reportFilter, setReportFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [variantFilter, setVariantFilter] = useState<string>("all")
  const [personaFilter, setPersonaFilter] = useState<string>("all")

  // Apply URL query parameters on mount
  useEffect(() => {
    const reportId = searchParams.get("reportId")
    const variant = searchParams.get("variant")
    const persona = searchParams.get("persona")
    const category = searchParams.get("category")

    if (reportId) {
      const report = MOCK_REPORTS.find((r) => r.id === reportId)
      if (report) {
        setFeatureFilter(report.featureId)
        setReportFilter(reportId)
      }
    }
    if (variant) {
      setVariantFilter(variant)
    }
    if (persona) {
      setPersonaFilter(persona)
    }
    if (category) {
      setCategoryFilter(category)
    }
  }, [searchParams])

  // Get available reports for selected feature
  const availableReports = useMemo(() => {
    if (featureFilter === "all") return MOCK_REPORTS
    return getReportsByFeature(featureFilter)
  }, [featureFilter])

  // Update report filter when feature changes
  const handleFeatureChange = (featureId: string) => {
    setFeatureFilter(featureId)
    if (featureId !== "all") {
      const reports = getReportsByFeature(featureId)
      if (reports.length > 0) {
        setReportFilter(reports[0].id)
      }
    } else {
      setReportFilter("all")
    }
  }

  // Filter runs based on all criteria
  const filteredRuns = useMemo(() => {
    return MOCK_AGENT_RUNS.filter((run) => {
      // Website filter
      if (run.website !== selectedWebsite) return false

      // Feature filter (via reportId)
      if (featureFilter !== "all") {
        const report = MOCK_REPORTS.find((r) => r.id === run.reportId)
        if (!report || report.featureId !== featureFilter) return false
      }

      // Report filter
      if (reportFilter !== "all" && run.reportId !== reportFilter) return false

      // Variant filter
      if (variantFilter !== "all" && run.variant !== variantFilter) return false

      // Persona filter
      if (personaFilter !== "all" && run.personaType !== personaFilter) return false

      return true
    })
  }, [selectedWebsite, featureFilter, reportFilter, variantFilter, personaFilter])

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
                <SelectItem value="all">All Features</SelectItem>
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
                <SelectItem value="all">All Reports</SelectItem>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Variant</label>
            <Select value={variantFilter} onValueChange={setVariantFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Variants</SelectItem>
                <SelectItem value="baseline">Baseline</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Persona</label>
            <Select value={personaFilter} onValueChange={setPersonaFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Personas</SelectItem>
                <SelectItem value="new-shopper">{getPersonaLabel("new-shopper")}</SelectItem>
                <SelectItem value="returning-user">{getPersonaLabel("returning-user")}</SelectItem>
                <SelectItem value="admin-user">{getPersonaLabel("admin-user")}</SelectItem>
                <SelectItem value="premium-user">{getPersonaLabel("premium-user")}</SelectItem>
                <SelectItem value="guest">{getPersonaLabel("guest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRuns.length} of {MOCK_AGENT_RUNS.length} runs
      </div>

      {/* Table */}
      <RunTable runs={filteredRuns} />
    </div>
  )
}
