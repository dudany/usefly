"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Clock, Zap, ChevronDown, AlertTriangle } from "lucide-react"
import type { PersonaRun } from "@/types/api"
import {
  DerivedMetrics,
  formatDuration,
  formatDate,
  getStatusConfig,
  EVENT_COLOR_MAP,
  EVENT_ICON_MAP,
} from "./run-utils"

interface RunOverviewTabProps {
  run: PersonaRun
  metrics: DerivedMetrics
}

export function RunOverviewTab({ run, metrics }: RunOverviewTabProps) {
  const statusConfig = getStatusConfig(run)
  const Icon = run.error_type ? AlertCircle : CheckCircle2
  const [expandedJudgement, setExpandedJudgement] = useState(false)

  // Check if there are any warning conditions
  const hasWarnings =
    run.judgement_data?.failure_reason ||
    run.judgement_data?.impossible_task ||
    run.judgement_data?.reached_captcha

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status Card */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="flex items-center gap-2 mt-3">
            <Icon className="w-4 h-4" />
            <Badge
              variant="outline"
              className={`mt-0.5 ${statusConfig.className}`}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </Card>

        {/* Duration Card */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Duration</p>
          <div className="flex items-center gap-2 mt-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-lg font-semibold">
              {formatDuration(run.duration_seconds)}
            </p>
          </div>
        </Card>

        {/* Total Actions Card */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Actions</p>
          <div className="flex items-center gap-2 mt-3">
            <Zap className="w-4 h-4 text-blue-600" />
            <p className="text-lg font-semibold">{metrics.totalActions}</p>
          </div>
        </Card>

        {/* Success Rate Card */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Success Rate</p>
          <p className="text-lg font-semibold mt-3">
            <span
              className={
                metrics.successRate === 100
                  ? "text-emerald-600"
                  : "text-red-600"
              }
            >
              {metrics.successRate}%
            </span>
          </p>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Completion Progress</p>
          <p className="text-xs text-muted-foreground">
            {run.steps_completed}/{run.total_steps} steps
          </p>
        </div>
        <Progress value={metrics.completionRate} className="h-2" />
      </Card>

      {/* Error Card */}
      {run.error_type && (
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-600">Error</p>
              <p className="text-sm text-red-600/80 mt-1">{run.error_type}</p>
              {run.judgement_data?.failure_reason && (
                <p className="text-xs text-red-600/60 mt-2">
                  {run.judgement_data.failure_reason}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Task Description */}
      {run.task_description && (
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Task Description</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {run.task_description}
          </p>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-4 bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Persona Type</p>
            <p className="text-sm font-medium mt-1">{run.persona_type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="text-sm font-medium mt-1 capitalize">
              {run.platform || "web"}
            </p>
          </div>
          {run.location && (
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium mt-1">{run.location}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Pages Visited</p>
            <p className="text-sm font-medium mt-1">
              {metrics.pagesVisited}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Started</p>
            <p className="text-sm font-medium mt-1">
              {formatDate(run.timestamp)}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Type Breakdown */}
      {Object.keys(metrics.actionTypeBreakdown).length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium mb-4">Action Breakdown</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(metrics.actionTypeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const colorClass = EVENT_COLOR_MAP[type] || EVENT_COLOR_MAP.click
                const IconComponent = EVENT_ICON_MAP[type]
                return (
                  <div
                    key={type}
                    className={`flex items-center justify-between p-3 rounded-md border ${colorClass}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {IconComponent && (
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-xs capitalize truncate">
                        {type}
                      </span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      {/* Judgement Data */}
      {run.judgement_data && (
        <>
          {run.judgement_data.reasoning && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Agent Reasoning</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {run.judgement_data.reasoning}
              </p>
            </Card>
          )}

          {/* Verdict and Judgement Details Card */}
          <Card
            className={`p-4 cursor-pointer transition-colors ${
              hasWarnings
                ? "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15"
                : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15"
            }`}
            onClick={() => setExpandedJudgement(!expandedJudgement)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {hasWarnings && (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      hasWarnings ? "text-amber-600" : "text-blue-600"
                    }`}
                  >
                    Verdict & Details
                  </p>
                </div>
                {run.judgement_data.verdict !== undefined && (
                  <p
                    className={`text-sm mt-2 ${
                      run.judgement_data.verdict
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {run.judgement_data.verdict ? "✓ Passed" : "✗ Failed"}
                  </p>
                )}
              </div>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform ${
                  expandedJudgement ? "rotate-180" : ""
                } ${
                  hasWarnings ? "text-amber-600" : "text-blue-600"
                }`}
              />
            </div>

            {/* Expanded Details */}
            {expandedJudgement && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {/* Failure Reason */}
                <div className={`p-3 rounded-md border ${
                  run.judgement_data.failure_reason
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-gray-500/5 border-gray-500/20"
                }`}>
                  <p className={`text-xs font-medium mb-1 ${
                    run.judgement_data.failure_reason
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}>
                    Failure Reason
                  </p>
                  <p className={`text-sm ${
                    run.judgement_data.failure_reason
                      ? "text-red-600/80"
                      : "text-gray-500"
                  }`}>
                    {run.judgement_data.failure_reason || "(none)"}
                  </p>
                </div>

                {/* Impossible Task */}
                <div className={`flex items-center gap-2 p-3 rounded-md border ${
                  run.judgement_data.impossible_task
                    ? "bg-orange-500/10 border-orange-500/20"
                    : "bg-gray-500/5 border-gray-500/20"
                }`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                    run.judgement_data.impossible_task
                      ? "text-orange-600"
                      : "text-gray-500"
                  }`} />
                  <span className={`text-sm font-medium ${
                    run.judgement_data.impossible_task
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}>
                    Task deemed impossible: {run.judgement_data.impossible_task ? "Yes" : "No"}
                  </span>
                </div>

                {/* Reached CAPTCHA */}
                <div className={`flex items-center gap-2 p-3 rounded-md border ${
                  run.judgement_data.reached_captcha
                    ? "bg-purple-500/10 border-purple-500/20"
                    : "bg-gray-500/5 border-gray-500/20"
                }`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                    run.judgement_data.reached_captcha
                      ? "text-purple-600"
                      : "text-gray-500"
                  }`} />
                  <span className={`text-sm font-medium ${
                    run.judgement_data.reached_captcha
                      ? "text-purple-600"
                      : "text-gray-600"
                  }`}>
                    CAPTCHA encountered: {run.judgement_data.reached_captcha ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Final Result */}
      {run.final_result && (
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <p className="text-sm font-medium text-emerald-600 mb-2">
            Final Result
          </p>
          <p className="text-sm text-emerald-600/80 leading-relaxed">
            {run.final_result}
          </p>
        </Card>
      )}
    </div>
  )
}
