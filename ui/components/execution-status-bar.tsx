"use client"

import { useState } from "react"
import { useExecutions } from "@/contexts/execution-context"
import { RunStatusResponse, TaskProgressStatus } from "@/types/api"
import { ChevronUp, ChevronDown, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function formatAction(action: string | undefined): string {
  if (!action) return ""
  return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function TaskProgressItem({ task }: { task: TaskProgressStatus }) {
  const statusIcons = {
    pending: <Clock className="w-3 h-3 text-muted-foreground" />,
    running: <Loader2 className="w-3 h-3 animate-spin text-blue-500" />,
    completed: <CheckCircle2 className="w-3 h-3 text-green-500" />,
    failed: <XCircle className="w-3 h-3 text-red-500" />
  }

  return (
    <div className="flex items-center gap-2 text-xs py-1">
      {statusIcons[task.status]}
      <span className="font-medium min-w-[100px]">{task.persona}</span>
      {task.status === "running" && (
        <span className="text-muted-foreground">
          Step {task.current_step}/{task.max_steps}
          {task.current_action && ` - ${formatAction(task.current_action)}`}
        </span>
      )}
      {task.status === "completed" && (
        <span className="text-green-600">Done</span>
      )}
      {task.status === "failed" && (
        <span className="text-red-600 truncate max-w-[200px]">
          {task.error || "Failed"}
        </span>
      )}
    </div>
  )
}

function ExecutionItem({ execution, isExpanded, onToggle }: { execution: RunStatusResponse, isExpanded: boolean, onToggle: () => void }) {

  const runningTasks = execution.task_progress.filter(t => t.status === "running")
  const completedTasks = execution.task_progress.filter(t => t.status === "completed")
  const progress = execution.total_tasks > 0
    ? Math.round(((execution.completed_tasks + execution.failed_tasks) / execution.total_tasks) * 100)
    : 0

  return (
    <div className="border-l-2 border-blue-500 pl-3 py-1">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-1 -ml-1"
        onClick={onToggle}
      >
        <Loader2 className="w-3 h-3 animate-spin text-blue-500 flex-shrink-0" />
        <span className="font-medium text-sm truncate max-w-[150px]">
          {execution.scenario_name || "Running"}
        </span>
        <span className="text-xs text-muted-foreground">
          {execution.completed_tasks + execution.failed_tasks}/{execution.total_tasks}
        </span>
        <div className="flex-1 h-1.5 bg-secondary rounded-full min-w-[60px] max-w-[100px]">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 pl-5 space-y-0.5 max-h-[200px] overflow-y-auto">
          {execution.task_progress.map((task) => (
            <TaskProgressItem key={task.task_index} task={task} />
          ))}
          {execution.logs.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground font-medium mb-1">Recent Activity</div>
              <div className="space-y-0.5 text-xs text-muted-foreground max-h-[80px] overflow-y-auto">
                {execution.logs.slice(-5).map((log, i) => (
                  <div key={i} className="truncate">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ExecutionStatusBar() {
  const { activeExecutions, isStatusBarExpanded, toggleStatusBar, expandedExecutionIds, toggleExecutionExpanded } = useExecutions()

  // Only show active (in_progress) executions
  const inProgressExecutions = activeExecutions.filter(e => e.status === "in_progress")

  if (inProgressExecutions.length === 0) {
    return null
  }

  // Calculate overall stats
  const totalTasks = inProgressExecutions.reduce((sum, e) => sum + e.total_tasks, 0)
  const completedTasks = inProgressExecutions.reduce((sum, e) => sum + e.completed_tasks + e.failed_tasks, 0)

  // Get all running tasks for summary
  const runningTasks = inProgressExecutions.flatMap(e =>
    e.task_progress.filter(t => t.status === "running")
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      {/* Collapsed bar */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-accent/50 transition-colors",
          isStatusBarExpanded && "border-b"
        )}
        onClick={toggleStatusBar}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="font-medium text-sm">
            {inProgressExecutions.length} Active
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Summary of running executions */}
        <div className="flex-1 flex items-center gap-4 overflow-x-auto text-sm">
          {inProgressExecutions.slice(0, 3).map(execution => (
            <div key={execution.run_id} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-muted-foreground">{execution.scenario_name}:</span>
              <span>{execution.completed_tasks + execution.failed_tasks}/{execution.total_tasks}</span>
            </div>
          ))}
          {inProgressExecutions.length > 3 && (
            <span className="text-muted-foreground">
              +{inProgressExecutions.length - 3} more
            </span>
          )}
        </div>

        {/* Current action preview */}
        {runningTasks.length > 0 && runningTasks[0].current_action && (
          <>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[200px]">
              {runningTasks[0].persona}: {formatAction(runningTasks[0].current_action)}
            </span>
          </>
        )}

        <div className="flex items-center gap-1 text-muted-foreground">
          {isStatusBarExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {isStatusBarExpanded && (
        <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
          {inProgressExecutions.map(execution => (
            <ExecutionItem
              key={execution.run_id}
              execution={execution}
              isExpanded={expandedExecutionIds.includes(execution.run_id)}
              onToggle={() => toggleExecutionExpanded(execution.run_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
