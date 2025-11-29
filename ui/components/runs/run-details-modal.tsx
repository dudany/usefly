"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { AgentRun } from "@/types/api"
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
  run: AgentRun
  onClose: () => void
}

export function RunDetailsModal({ run, onClose }: RunDetailsModalProps) {
  const statusColor = {
    success: "text-emerald-500",
    error: "text-red-500",
    anomaly: "text-amber-500",
    "in-progress": "text-blue-500",
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
                  {run.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Badge variant={run.status === "success" ? "default" : "destructive"} className="capitalize">
                    {run.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="font-medium">{run.duration}s</p>
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
          {run.status === "error" && (
            <Card className="p-4 bg-red-500/10 border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-500">Error Encountered</p>
                  <p className="text-sm text-foreground/80 mt-1">The agent encountered an error during execution</p>
                </div>
              </div>
            </Card>
          )}

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
