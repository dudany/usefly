"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Play, Plus, Pencil, Trash2, Sparkles, X } from "lucide-react"
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

interface Task {
  number: number
  persona: string
  starting_url: string
  goal: string
  steps: string
}

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
  onRun?: (scenario: Scenario) => Promise<void>
}

// Default personas available
const DEFAULT_PERSONAS = [
  "Explorer",
  "Focused Shopper",
  "Hesitant User",
  "Power User",
  "First-Time Visitor",
  "Returning Customer"
]

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
  onRun,
}: ScenarioTasksModalProps) {
  const router = useRouter()

  // State
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Task editing state
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showTaskEditor, setShowTaskEditor] = useState(false)
  const [availablePersonas, setAvailablePersonas] = useState<string[]>(DEFAULT_PERSONAS)

  // Fetch available personas
  useEffect(() => {
    async function fetchPersonas() {
      try {
        const data = await scenarioApi.getPersonas()
        if (data.personas && data.personas.length > 0) {
          setAvailablePersonas(data.personas)
        }
      } catch (err) {
        // Fall back to defaults
        console.error("Failed to fetch personas:", err)
      }
    }
    if (open) {
      fetchPersonas()
    }
  }, [open])

  // Initialize tasks and selection
  useEffect(() => {
    if (!open) return

    if (mode === 'create' && analysisResult?.tasks) {
      setLocalTasks(analysisResult.tasks as Task[])
      setSelectedTasks(new Set(analysisResult.tasks.map((t: any) => t.number)))
    } else if (mode === 'edit' && scenario) {
      setLocalTasks((scenario.tasks || []) as Task[])
      const selectedNumbers = scenario.tasks_metadata?.selected_task_numbers || []
      setSelectedTasks(new Set(selectedNumbers))
    }
  }, [open, mode, analysisResult, scenario])

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

  // Add new task
  const handleAddTask = () => {
    const newTaskNumber = localTasks.length > 0
      ? Math.max(...localTasks.map(t => t.number)) + 1
      : 1

    setEditingTask({
      number: newTaskNumber,
      persona: availablePersonas[0] || "Explorer",
      starting_url: scenario?.website_url || createFormData?.website_url || "",
      goal: "",
      steps: ""
    })
    setShowTaskEditor(true)
  }

  // Edit existing task
  const handleEditTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask({ ...task })
    setShowTaskEditor(true)
  }

  // Delete task
  const handleDeleteTask = (taskNumber: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalTasks(prev => prev.filter(t => t.number !== taskNumber))
    setSelectedTasks(prev => {
      const next = new Set(prev)
      next.delete(taskNumber)
      return next
    })
    toast.success("Task deleted")
  }

  // Save edited task
  const handleSaveTask = () => {
    if (!editingTask) return

    if (!editingTask.goal.trim()) {
      toast.error("Goal is required")
      return
    }

    const isNew = !localTasks.find(t => t.number === editingTask.number)

    if (isNew) {
      setLocalTasks(prev => [...prev, editingTask])
      setSelectedTasks(prev => new Set([...prev, editingTask.number]))
    } else {
      setLocalTasks(prev => prev.map(t =>
        t.number === editingTask.number ? editingTask : t
      ))
    }

    setShowTaskEditor(false)
    setEditingTask(null)
    toast.success(isNew ? "Task added" : "Task updated")
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
          all_tasks: localTasks,
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

  const handlePlay = async () => {
    if (!scenario || !onRun) return

    setIsRunning(true)
    try {
      const currentSelected = scenario.tasks_metadata?.selected_task_numbers || []
      const newSelected = Array.from(selectedTasks)

      const hasChanged = currentSelected.length !== newSelected.length ||
        !currentSelected.every(n => newSelected.includes(n))

      if (hasChanged) {
        toast.info("Saving changes before running...")
        await scenarioApi.updateTasks(scenario.id, newSelected)
      }

      await onRun(scenario)
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to run scenario"
      toast.error(errorMessage)
    } finally {
      setIsRunning(false)
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
                : 'Update task selection or add new tasks for this scenario'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-4">
            {!localTasks.length && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-sm text-amber-900">No Tasks Available</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-800">
                  This scenario doesn't have any tasks yet. Click "Add Task" to create one.
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
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {typeof crawlerSummary === 'string'
                      ? crawlerSummary
                      : JSON.stringify(crawlerSummary, null, 2)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Persona Distribution - moved here, beneath Website Analysis */}
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
                          <Badge variant="secondary">{String(count)}</Badge>
                        </div>
                      )
                    )}
                  </div>
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

            {/* Tasks Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {mode === 'create' ? 'Generated Tasks' : 'Scenario Tasks'} ({localTasks.length})
                    </CardTitle>
                    <CardDescription>
                      Selected: {selectedTasks.size} of {localTasks.length}
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddTask} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {localTasks.map((task: Task) => (
                  <div
                    key={task.number}
                    className={cn(
                      "border rounded-lg p-4 transition-colors cursor-pointer group",
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Task {task.number}</span>
                            <Badge variant="outline" className="text-xs">
                              {task.persona}
                            </Badge>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => handleEditTask(task, e)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteTask(task.number, e)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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
          </div>

          <DialogFooter className="mt-4 border-t pt-4">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                {mode === 'edit' && (
                  <>
                    <Button
                      variant="default"
                      onClick={handlePlay}
                      disabled={isRunning || isSaving || selectedTasks.size === 0}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play Selected Tasks
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting || isSaving || isRunning}
                    >
                      Delete Scenario
                    </Button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {mode === 'create' ? 'Cancel' : 'Close'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || selectedTasks.size === 0 || isRunning}
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

      {/* Task Editor Dialog */}
      <Dialog open={showTaskEditor} onOpenChange={setShowTaskEditor}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask && localTasks.find(t => t.number === editingTask.number)
                ? 'Edit Task'
                : 'Add New Task'}
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Persona</label>
                <Select
                  value={editingTask.persona}
                  onValueChange={(v) => setEditingTask({ ...editingTask, persona: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePersonas.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Starting URL</label>
                <Input
                  value={editingTask.starting_url}
                  onChange={(e) => setEditingTask({ ...editingTask, starting_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Goal *</label>
                <Input
                  value={editingTask.goal}
                  onChange={(e) => setEditingTask({ ...editingTask, goal: e.target.value })}
                  placeholder="What should the persona accomplish?"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Steps</label>
                <Textarea
                  value={editingTask.steps}
                  onChange={(e) => setEditingTask({ ...editingTask, steps: e.target.value })}
                  placeholder="Describe the steps to complete the goal..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowTaskEditor(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTask}>
                  {localTasks.find(t => t.number === editingTask.number) ? 'Update Task' : 'Add Task'}
                </Button>
              </div>
            </div>
          )}
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
