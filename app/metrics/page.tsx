"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { MetricsTable } from "@/components/metrics/metrics-table"
import { ChartRecommendations } from "@/components/metrics/chart-recommendations"
import { type Metric } from "@/components/metrics/mock-metrics"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb } from "lucide-react"

export default function MetricsPage() {
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null)

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Metrics Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore key metrics to track user behavior and configure analytics for your product
          </p>
        </div>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert className="border-primary/30 bg-primary/5">
            <Lightbulb className="h-4 w-4 text-primary" />
            <AlertDescription>
              <span className="font-semibold">How to use: </span>
              Select any metric from the table below to see recommended charts and understand why they matter for your product analytics.
              Charts are populated with actual agent run data to demonstrate real-world insights.
            </AlertDescription>
          </Alert>

          {/* Metrics Table */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Available Metrics
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (sorted by business priority)
              </span>
            </h2>
            <MetricsTable
              onMetricSelect={setSelectedMetric}
              selectedMetricId={selectedMetric?.id || null}
            />
          </div>

          {/* Chart Recommendations */}
          {selectedMetric ? (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Recommended Charts & Visualizations
              </h2>
              <ChartRecommendations metric={selectedMetric} />
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No metric selected</p>
                <p className="text-sm">
                  Click on any metric in the table above to view recommended charts and analytics insights
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
