"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader, Plus, Trash2, Play } from "lucide-react"
import { toast } from "sonner"
import { scenarioApi, personaExecutionApi } from "@/lib/api-client"
import { Scenario, RunStatusResponse } from "@/types/api"
import { ScenarioTasksModal } from "@/components/scenarios/scenario-tasks-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ScenariosPage() {
  const router = useRouter()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [runningScenarios, setRunningScenarios] = useState<Set<string>>(new Set())
  const [runStatuses, setRunStatuses] = useState<Map<string, RunStatusResponse>>(new Map())

  // Fetch scenarios on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true)
        const data = await scenarioApi.list()
        setScenarios(data)

        // Auto-redirect to new scenario page if empty
        if (data.length === 0) {
          router.push("/scenarios/new")
          return
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch scenarios"
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchScenarios()
  }, [router])

  const handleViewDetails = async (scenario: Scenario) => {
    console.log("handleViewDetails called with scenario:", scenario)
    try {
      console.log("Fetching scenario with ID:", scenario.id)
      const fullScenario = await scenarioApi.get(scenario.id)
      console.log("Received full scenario:", fullScenario)
      setEditingScenario(fullScenario)
      setShowTasksModal(true)
      console.log("Modal should now be open")
    } catch (error) {
      console.error("Error in handleViewDetails:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load scenario"
      toast.error(errorMessage)
    }
  }

  const handleScenarioUpdate = async () => {
    try {
      const data = await scenarioApi.list()
      setScenarios(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh scenarios"
      toast.error(errorMessage)
    }
  }

  const handleScenarioDelete = (scenarioId: string) => {
    setScenarios(scenarios.filter((s) => s.id !== scenarioId))
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await scenarioApi.delete(id)
      setScenarios(scenarios.filter((s) => s.id !== id))
      toast.success("Scenario deleted successfully")
      setDeleteId(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete scenario"
      toast.error(errorMessage)
    } finally {
      setDeleting(null)
    }
  }

  const handleRunScenario = async (scenario: Scenario) => {
    try {
      setRunningScenarios(prev => new Set(prev).add(scenario.id))

      const response = await personaExecutionApi.run(scenario.id)

      toast.success("Scenario execution started", {
        description: `Running ${response.task_count} tasks in background`
      })

      pollRunStatus(response.run_id, scenario.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to run scenario"
      toast.error(errorMessage)
      setRunningScenarios(prev => {
        const next = new Set(prev)
        next.delete(scenario.id)
        return next
      })
    }
  }

  const pollRunStatus = async (runId: string, scenarioId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await personaExecutionApi.getStatus(runId)

        setRunStatuses(prev => new Map(prev).set(scenarioId, status))

        if (["completed", "partial_failure", "failed"].includes(status.status)) {
          clearInterval(pollInterval)
          setRunningScenarios(prev => {
            const next = new Set(prev)
            next.delete(scenarioId)
            return next
          })

          if (status.status === "completed") {
            toast.success("Scenario completed successfully", {
              description: `All ${status.total_tasks} tasks completed`
            })
          } else if (status.status === "partial_failure") {
            toast.warning("Scenario completed with errors", {
              description: `${status.completed_tasks}/${status.total_tasks} tasks succeeded`
            })
          } else {
            toast.error("Scenario execution failed", {
              description: `${status.failed_tasks} tasks failed`
            })
          }

          await personaExecutionApi.acknowledgeCompletion(runId)

          setRunStatuses(prev => {
            const next = new Map(prev)
            next.delete(scenarioId)
            return next
          })

          handleScenarioUpdate()
        }
      } catch (error) {
        console.error("Error polling run status:", error)
        clearInterval(pollInterval)
        setRunningScenarios(prev => {
          const next = new Set(prev)
          next.delete(scenarioId)
          return next
        })
      }
    }, 2000)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading scenarios...</span>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Test Scenarios</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your test scenarios and create new ones
              </p>
            </div>
            <Button onClick={() => router.push("/scenarios/new")} className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Scenario
            </Button>
          </div>
        </div>

        {runningScenarios.size > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    {runningScenarios.size} scenario{runningScenarios.size > 1 ? 's' : ''} running in background
                  </p>
                  <p className="text-sm text-blue-700">
                    Tasks are executing in parallel. You'll be notified when complete.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {scenarios.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No scenarios yet</p>
              <Button onClick={() => router.push("/scenarios/new")}>
                Create Your First Scenario
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground truncate">
                        {scenario.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {scenario.website_url}
                      </p>
                    </div>

                    {scenario.personas && scenario.personas.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Personas:</p>
                        <div className="flex flex-wrap gap-2">
                          {scenario.personas.map((persona, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                            >
                              {persona}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Created {new Date(scenario.created_at).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRunScenario(scenario)}
                        disabled={runningScenarios.has(scenario.id) || !scenario.selected_task_indices?.length}
                      >
                        {runningScenarios.has(scenario.id) ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDetails(scenario)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(scenario.id)}
                        disabled={deleting === scenario.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deleting === scenario.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {runStatuses.has(scenario.id) && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Progress: {runStatuses.get(scenario.id)!.completed_tasks + runStatuses.get(scenario.id)!.failed_tasks} / {runStatuses.get(scenario.id)!.total_tasks} tasks
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
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
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Scenario Modal */}
      <ScenarioTasksModal
        open={showTasksModal}
        onOpenChange={(open) => {
          setShowTasksModal(open)
          if (!open) {
            setEditingScenario(null)
          }
        }}
        mode="edit"
        scenario={editingScenario || undefined}
        onUpdate={handleScenarioUpdate}
        onDelete={handleScenarioDelete}
        onRun={handleRunScenario}
      />
    </AppLayout>
  )
}
