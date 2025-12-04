"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, Globe, Zap } from "lucide-react"
import { DerivedMetrics, formatUrl, getFullDecodedUrl } from "./run-utils"

interface RunJourneyTabProps {
  journeyPath: string[]
  events: any[]
  metrics: DerivedMetrics
}

export function RunJourneyTab({
  journeyPath,
  events,
  metrics,
}: RunJourneyTabProps) {
  // Get unique pages in order
  const uniquePages = Array.from(new Set(journeyPath || []))

  if (!journeyPath || journeyPath.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <p>No journey data available for this run</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Journey Path Flow */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4" />
          <p className="text-sm font-medium">Page Journey</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {uniquePages.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs max-w-xs truncate"
                title={getFullDecodedUrl(url)}
              >
                {formatUrl(url)}
              </Badge>
              {idx < uniquePages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Journey Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pages Visited</p>
          <p className="text-3xl font-bold mt-2">{metrics.pagesVisited}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Avg Actions/Page</p>
          <p className="text-3xl font-bold mt-2">
            {metrics.averageActionsPerPage.toFixed(1)}
          </p>
        </Card>
      </div>

      {/* Actions Per Page */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" />
          <p className="text-sm font-medium">Actions Per Page</p>
        </div>
        <div className="space-y-2">
          {Object.entries(metrics.actionsPerPage)
            .sort(([, a], [, b]) => b - a)
            .map(([url, count]) => (
              <div
                key={url}
                className="flex items-center justify-between p-3 bg-muted rounded-md border"
              >
                <span className="text-sm truncate flex-1 mr-2" title={getFullDecodedUrl(url)}>
                  {formatUrl(url)}
                </span>
                <Badge variant="secondary" className="flex-shrink-0">
                  {count} action{count !== 1 ? "s" : ""}
                </Badge>
              </div>
            ))}
        </div>
      </Card>

      {/* Time Spent Per Page (if available) */}
      {Object.keys(metrics.timePerPage).length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium mb-4">Steps Per Page</p>
          <div className="space-y-2">
            {Object.entries(metrics.timePerPage)
              .sort(([, a], [, b]) => b - a)
              .map(([url, steps]) => (
                <div
                  key={url}
                  className="flex items-center justify-between p-3 bg-muted rounded-md border"
                >
                  <span className="text-sm truncate flex-1 mr-2" title={getFullDecodedUrl(url)}>
                    {formatUrl(url)}
                  </span>
                  <Badge variant="outline" className="flex-shrink-0">
                    {Math.round(steps)} step{Math.round(steps) !== 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
