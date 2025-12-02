"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { scenarioApi, crawlerApi } from "@/lib/api-client"
import { Scenario, CrawlerAnalysisResponse, SaveScenarioRequest } from "@/types/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ScenarioTasksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  scenario?: Scenario
  analysisResult?: CrawlerAnalysisResponse
  createFormData?: {
    name: string
    website_url: string
    description?: string
    metrics: string[]
    email: string
  }
  onSave?: (scenarioId: string) => void
  onUpdate?: (scenarioId: string) => void
  onDelete?: (scenarioId: string) => void
}

export function ScenarioTasksModal({
  open,
  onOpenChange,
  mode,
  scenario,
  analysisResult,
  createFormData,
  onSave,
  onUpdate,
  onDelete,
}: ScenarioTasksModalProps) {
  const router = useRouter()

  // State
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Initialize selected tasks
  useEffect(() => {
    if (!open) return

    if (mode === 'create' && analysisResult?.tasks) {
      // Create mode: select all tasks by default
      setSelectedTasks(new Set(analysisResult.tasks.map(t => t.number)))
    } else if (mode === 'edit' && scenario) {
      // Edit mode: select based on selected_task_numbers
      const selectedNumbers = scenario.tasks_metadata?.selected_task_numbers || []
      setSelectedTasks(new Set(selectedNumbers))
    }
  }, [open, mode, analysisResult, scenario])

  // Derived data
  const tasks = mode === 'create'
    ? analysisResult?.tasks || []
    : scenario?.tasks || []

  const tasksMetadata = mode === 'create'
    ? analysisResult?.tasks_metadata
    : scenario?.tasks_metadata

  const crawlerSummary = mode === 'create'
    ? analysisResult?.crawler_summary
    : scenario?.crawler_final_result

  const toggleTask = (taskNumber: number) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskNumber)) {
        next.delete(taskNumber)
      } else {
        next.add(taskNumber)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (selectedTasks.size === 0) {
      toast.error("Please select at least one task")
      return
    }

    setIsSaving(true)
    try {
      if (mode === 'create') {
        // Create new scenario
        if (!analysisResult || !createFormData) {
          toast.error("Missing required data for scenario creation")
          return
        }

        const saveRequest: SaveScenarioRequest = {
          scenario_id: analysisResult.scenario_id,
          name: createFormData.name,
          website_url: createFormData.website_url,
          description: createFormData.description || "",
          metrics: createFormData.metrics,
          email: createFormData.email,
          selected_task_numbers: Array.from(selectedTasks),
          all_tasks: analysisResult.tasks || [],
          tasks_metadata: analysisResult.tasks_metadata || { total_tasks: 0, persona_distribution: {} },
          crawler_final_result: analysisResult.crawler_summary || "",
          crawler_extracted_content: analysisResult.crawler_extracted_content || "",
          discovered_urls: [],
        }

        const response = await crawlerApi.save(saveRequest)

        toast.success("Scenario saved successfully!", {
          description: `Created scenario with ${selectedTasks.size} tasks`
        })

        onSave?.(response.scenario_id)
        onOpenChange(false)
      } else {
        // Update existing scenario
        if (!scenario) {
          toast.error("Scenario not found")
          return
        }

        await scenarioApi.updateTasks(scenario.id, Array.from(selectedTasks))

        toast.success("Scenario updated successfully!", {
          description: `Updated with ${selectedTasks.size} selected tasks`
        })

        onUpdate?.(scenario.id)
        onOpenChange(false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Operation failed"
      toast.error(mode === 'create' ? "Save failed" : "Update failed", {
        description: errorMessage
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!scenario) return

    setIsDeleting(true)
    try {
      await scenarioApi.delete(scenario.id)

      toast.success("Scenario deleted successfully")

      onDelete?.(scenario.id)
      setShowDeleteDialog(false)
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Delete failed"
      toast.error("Delete failed", {
        description: errorMessage
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {mode === 'create' ? 'Scenario Analysis Complete' : 'Edit Scenario Tasks'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Review the generated tasks and select which ones to include in your scenario'
                : 'Update task selection for this scenario'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-4">
            {!tasks.length && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-sm text-amber-900">No Tasks Available</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-800">
                  This scenario doesn't have any tasks yet.
                </CardContent>
              </Card>
            )}
            {/* Website Analysis Summary */}
            {crawlerSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Website Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-48 text-muted-foreground">
                    {JSON.stringify(crawlerSummary, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Task Generation Error Warning */}
            {tasksMetadata?.error && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-sm text-amber-900">Task Generation Warning</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-800">
                  {tasksMetadata.error}
                </CardContent>
              </Card>
            )}

            {/* Generated Tasks */}
            {tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {mode === 'create' ? 'Generated Tasks' : 'Scenario Tasks'} ({tasks.length})
                  </CardTitle>
                  <CardDescription>
                    Selected: {selectedTasks.size} of {tasks.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.map((task: any) => (
                  <div
                    key={task.number}
                    className={cn(
                      "border rounded-lg p-4 transition-colors cursor-pointer",
                      selectedTasks.has(task.number)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => toggleTask(task.number)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTasks.has(task.number)}
                        onCheckedChange={() => toggleTask(task.number)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Task {task.number}</span>
                          <Badge variant="outline" className="text-xs">
                            {task.persona}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Starting URL:</span>{" "}
                            <span className="break-all">{task.starting_url}</span>
                          </p>
                          <p>
                            <span className="font-medium">Goal:</span> {task.goal}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Steps:</span> {task.steps}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Persona Distribution */}
            {tasksMetadata?.persona_distribution && Object.keys(tasksMetadata.persona_distribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Persona Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(tasksMetadata.persona_distribution).map(
                      ([persona, count]) => (
                        <div key={persona} className="flex items-center justify-between p-3 bg-muted rounded">
                          <span className="text-sm font-medium">{persona}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="mt-4 border-t pt-4">
            <div className="flex justify-between w-full">
              <div>
                {mode === 'edit' && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting || isSaving}
                  >
                    Delete Scenario
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {mode === 'create' ? 'Cancel' : 'Close'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || selectedTasks.size === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {mode === 'create' ? 'Saving...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      {mode === 'create' ? `Save Scenario (${selectedTasks.size} tasks)` : `Save Changes (${selectedTasks.size} tasks)`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
