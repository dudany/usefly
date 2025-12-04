"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { PersonaRun } from "@/types/api"
import { getPersonaLabel } from "./mock-data"

const mockSteps = [
  { action: "visited", description: "Visited landing page", icon: "eye", status: "completed" },
  { action: "clicked", description: "Clicked signup button", icon: "click", status: "completed" },
  { action: "typed", description: "Entered email address", icon: "keyboard", status: "completed" },
  { action: "form-error", description: "Form validation error occurred", icon: "alert", status: "error" },
  { action: "retry", description: "Corrected and resubmitted form", icon: "retry", status: "completed" },
  { action: "navigated", description: "Navigated to dashboard", icon: "navigate", status: "completed" },
  { action: "clicked", description: "Clicked on product filters", icon: "click", status: "completed" },
  { action: "scrolled", description: "Scrolled product list", icon: "scroll", status: "completed" },
]

interface RunDetailsModalProps {
  run: PersonaRun
  onClose: () => void
}

export function RunDetailsModal({ run, onClose }: RunDetailsModalProps) {
  const getStatusColor = (isDone: boolean, errorType?: string) => {
    if (errorType && errorType !== "") return "text-red-500"
    if (isDone) return "text-emerald-500"
    return "text-blue-500"
  }

  const getStatusLabel = (isDone: boolean, errorType?: string) => {
    if (errorType && errorType !== "") return "Error"
    if (isDone) return "Success"
    return "In Progress"
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agent Run Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-4 bg-muted/30 border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Persona</p>
                <p className="font-medium">{getPersonaLabel(run.persona_type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {run.error_type && run.error_type !== "" ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : run.is_done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                  )}
                  <Badge
                    variant={
                      run.error_type && run.error_type !== ""
                        ? "destructive"
                        : run.is_done
                          ? "default"
                          : "secondary"
                    }
                  >
                    {getStatusLabel(run.is_done, run.error_type)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="font-medium">{run.duration_seconds ? Math.round(run.duration_seconds * 10) / 10 : 0}s</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Platform</p>
                <Badge variant="outline" className="capitalize">
                  {run.platform}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Error Info */}
          {run.error_type && run.error_type !== "" && (
            <Card className="p-4 bg-red-500/10 border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-500">Error Encountered</p>
                  <p className="text-sm text-foreground/80 mt-1">{run.error_type}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Task Description */}
          {run.task_description && (
            <Card className="p-4 bg-card border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Task Description</p>
                <p className="text-sm">{run.task_description}</p>
              </div>
            </Card>
          )}

          {/* Final Result */}
          {run.final_result && (
            <Card className="p-4 bg-card border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Final Result</p>
                <p className="text-sm">{run.final_result}</p>
              </div>
            </Card>
          )}

          {/* Journey Path */}
          {run.journey_path && run.journey_path.length > 0 && (
            <Card className="p-4 bg-card border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Journey Path</p>
                <div className="flex flex-wrap gap-2">
                  {run.journey_path.map((url, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {url}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Steps Progress */}
          <Card className="p-4 bg-card border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${run.total_steps > 0 ? (run.steps_completed / run.total_steps) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {run.steps_completed}/{run.total_steps}
                </span>
              </div>
            </div>
          </Card>

          {/* Steps Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Step-by-Step Interaction</h3>
            <div className="space-y-3">
              {mockSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        step.status === "error"
                          ? "border-red-500 bg-red-500/10"
                          : "border-emerald-500 bg-emerald-500/10"
                      }`}
                    >
                      {step.status === "error" ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    {idx < mockSteps.length - 1 && <div className="w-0.5 h-8 bg-border my-1"></div>}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium">{step.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
