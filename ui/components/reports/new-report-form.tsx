"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Sparkles, X, Loader2 } from "lucide-react"
import { crawlerApi } from "@/lib/api-client"
import { CrawlerAnalysisResponse, SaveScenarioRequest } from "@/types/api"
import { cn } from "@/lib/utils"

const reportFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  description: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
})

const scenarioFormSchema = z.object({
  name: z.string().min(1, "Scenario name is required"),
  url: z.string().url({ message: "Please enter a valid URL" }),
  description: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type FormData = z.infer<typeof reportFormSchema> & { name?: string }

const METRIC_OPTIONS = [
  "Conversion Rate",
  "Completion Rate",
  "Drop-off Rate",
  "Time on Task",
  "Error Rate",
  "User Satisfaction",
  "Click-through Rate",
  "Bounce Rate",
  "Engagement Score",
  "Success Rate",
]

interface NewReportFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  mode?: "report" | "scenario"
}

export function NewReportForm({ open, onOpenChange, mode = "report" }: NewReportFormProps = {}) {
  const router = useRouter()
  const isModal = open !== undefined && onOpenChange !== undefined
  const isScenarioMode = mode === "scenario"

  // Form state
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Wizard flow state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<CrawlerAnalysisResponse | null>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  const formSchema = isScenarioMode ? scenarioFormSchema : reportFormSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  // Initialize selected tasks when analysis completes
  useEffect(() => {
    if (analysisResult?.tasks && showResultsModal) {
      setSelectedTasks(new Set(analysisResult.tasks.map(t => t.number)))
    }
  }, [analysisResult, showResultsModal])

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

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

  const onSubmit = async (data: FormData) => {
    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric to track")
      return
    }

    setIsSubmitting(true)

    try {
      if (isScenarioMode) {
        // Run crawler analysis for scenario
        setIsAnalyzing(true)
        try {
          const result = await crawlerApi.analyze({
            website_url: data.url,
            description: data.description || "",
            name: data.name || "",
            metrics: selectedMetrics,
            email: data.email || "",
          })

          if (result.status === "error") {
            toast.error("Crawler analysis failed", {
              description: result.error || "Unknown error occurred",
            })
            setIsAnalyzing(false)
            return
          }

          // Store result and show results modal
          setAnalysisResult(result)
          setShowResultsModal(true)
        } catch (analyzeError) {
          const errorMessage = analyzeError instanceof Error ? analyzeError.message : "Failed to analyze website"
          toast.error("Crawler analysis failed", {
            description: errorMessage,
          })
          setIsAnalyzing(false)
          return
        }

      } else {
        // Run crawler analysis for report
        try {
          const result = await crawlerApi.analyze({
            website_url: data.url,
            description: data.description || "",
          })

          if (result.status === "error") {
            toast.error("Crawler analysis failed", {
              description: result.error || "Unknown error occurred",
            })
            return
          }

          toast.success("Analysis completed!", {
            description: `Crawled ${result.steps || 0} steps in ${result.duration || 0}s. View results in the Runs page.`,
          })

          // Reset form and close modal if in modal mode
          reset()
          setSelectedMetrics([])
          if (onOpenChange) {
            onOpenChange(false)
          }
        } catch (analyzeError) {
          const errorMessage = analyzeError instanceof Error ? analyzeError.message : "Failed to analyze website"
          toast.error("Crawler analysis failed", {
            description: errorMessage,
          })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error("Error", { description: errorMessage })
    } finally {
      setIsSubmitting(false)
      setIsAnalyzing(false)
    }
  }

  const handleSaveScenario = async () => {
    if (!analysisResult || selectedTasks.size === 0) {
      toast.error("Please select at least one task")
      return
    }

    setIsSaving(true)
    try {
      const formData = getValues()

      const saveRequest: SaveScenarioRequest = {
        scenario_id: analysisResult.scenario_id,
        name: formData.name || "",
        website_url: formData.url,
        description: formData.description || "",
        metrics: selectedMetrics,
        email: formData.email || "",
        selected_task_numbers: Array.from(selectedTasks),
        all_tasks: analysisResult.tasks || [],
        tasks_metadata: analysisResult.tasks_metadata || { total_tasks: 0, persona_distribution: {} },
        crawler_final_result: analysisResult.crawler_summary || "",
        crawler_extracted_content: analysisResult.crawler_extracted_content || "",
        discovered_urls: [],
      }

      try {
        await crawlerApi.save(saveRequest)

        toast.success("Scenario saved successfully!", {
          description: `Created scenario "${formData.name}" with ${selectedTasks.size} tasks`
        })

        // Reset and navigate
        reset()
        setSelectedMetrics([])
        setAnalysisResult(null)
        setShowResultsModal(false)
        setSelectedTasks(new Set())

        router.push("/scenarios")
      } catch (saveError) {
        const errorMessage = saveError instanceof Error ? saveError.message : "Failed to save scenario"
        toast.error("Save failed", {
          description: errorMessage
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error("Error", { description: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  const formContent = (
    <div className={isModal ? "mt-4" : ""}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field - Only for scenario mode */}
        {isScenarioMode && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              Scenario Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Checkout Flow Test"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
        )}

        {/* URL Field */}
        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-semibold">
            Website or Feature URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com/feature"
            {...register("url")}
            className={errors.url ? "border-destructive" : ""}
          />
          {errors.url && (
            <p className="text-sm text-destructive">{errors.url.message}</p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">
            Description <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe what you'd like to analyze or any specific areas of interest..."
            rows={4}
            {...register("description")}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Help us understand your analysis goals for more targeted insights.
          </p>
        </div>

        {/* Metrics Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            Key Metrics to Focus On <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {METRIC_OPTIONS.map((metric) => {
              const isSelected = selectedMetrics.includes(metric)
              return (
                <Badge
                  key={metric}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => toggleMetric(metric)}
                >
                  {metric}
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </Badge>
              )
            })}
          </div>
          {selectedMetrics.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Selected {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            We'll send the completed report to this email address.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || isAnalyzing}
          >
            {isSubmitting || isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                {isScenarioMode ? "Creating Scenario..." : "Submitting Request..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {isScenarioMode ? "Create Scenario" : "Request Analysis Report"}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <Card className="bg-muted/30 border-muted mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">What You'll Get</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Detailed user journey analysis</p>
          <p>• AI agent behavior insights</p>
          <p>• Friction point identification</p>
          <p>• Actionable recommendations</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      {/* Loading Dialog */}
      <LoadingDialog open={isAnalyzing} />

      {/* Results Modal */}
      <ResultsModal
        open={showResultsModal}
        onOpenChange={setShowResultsModal}
        result={analysisResult}
        selectedTasks={selectedTasks}
        onToggleTask={toggleTask}
        onSave={handleSaveScenario}
        isSaving={isSaving}
      />

      {/* Main Form */}
      {isModal ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="text-2xl">
                  {isScenarioMode ? "Create New Scenario" : "Request New Report"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-base">
                {isScenarioMode
                  ? "Set up a new test scenario with your website URL and testing focus areas. Our AI agents will test your features and identify friction points."
                  : "Submit your website or feature URL to get detailed analytics on user journeys and AI agent behavior. We'll analyze the data and send you comprehensive insights."}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      ) : (
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 shadow-lg">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  {isScenarioMode ? "Create New Scenario" : "Request New Report"}
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                {isScenarioMode
                  ? "Set up a new test scenario with your website URL and testing focus areas. Our AI agents will test your features and identify friction points."
                  : "Submit your website or feature URL to get detailed analytics on user journeys and AI agent behavior. We'll analyze the data and send you comprehensive insights."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formContent}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// ==================== Loading Dialog Component ====================

function LoadingDialog({ open }: { open: boolean }) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Animated spinner with sparkles */}
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Learning site and generating scenario</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Our AI agent is exploring your website and generating user journey tasks.
              This typically takes 30-120 seconds.
            </p>
          </div>

          {/* Progress steps */}
          <div className="w-full max-w-sm space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-muted-foreground">Crawling website...</span>
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-muted-foreground">Analyzing structure...</span>
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-muted-foreground">Generating tasks...</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Results Modal Component ====================

interface ResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: CrawlerAnalysisResponse | null
  selectedTasks: Set<number>
  onToggleTask: (taskNumber: number) => void
  onSave: () => Promise<void>
  isSaving: boolean
}

function ResultsModal({
  open,
  onOpenChange,
  result,
  selectedTasks,
  onToggleTask,
  onSave,
  isSaving,
}: ResultsModalProps) {
  if (!result) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Scenario Analysis Complete</DialogTitle>
          <DialogDescription>
            Review the generated tasks and select which ones to include in your scenario
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-4">
          {/* Website Analysis Summary */}
          {result.crawler_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Website Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-48 text-muted-foreground">
                  {JSON.stringify(result.crawler_summary, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Task Generation Error Warning */}
          {result.tasks_metadata?.error && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-sm text-amber-900">Task Generation Warning</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-800">
                {result.tasks_metadata.error}
              </CardContent>
            </Card>
          )}

          {/* Generated Tasks */}
          {result.tasks && result.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Generated Tasks ({result.tasks.length})
                </CardTitle>
                <CardDescription>
                  Selected: {selectedTasks.size} of {result.tasks.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.tasks.map((task) => (
                  <div
                    key={task.number}
                    className={cn(
                      "border rounded-lg p-4 transition-colors cursor-pointer",
                      selectedTasks.has(task.number)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => onToggleTask(task.number)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTasks.has(task.number)}
                        onCheckedChange={() => onToggleTask(task.number)}
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
          {result.tasks_metadata?.persona_distribution && Object.keys(result.tasks_metadata.persona_distribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persona Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(result.tasks_metadata.persona_distribution).map(
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || selectedTasks.size === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Scenario ({selectedTasks.size} tasks)</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
