"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { crawlerApi } from "@/lib/api-client"
import { CrawlerAnalysisResponse } from "@/types/api"
import { ScenarioTasksModal } from "@/components/scenarios/scenario-tasks-modal"
import { Sparkles, X, Loader2 } from "lucide-react"

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

export function NewScenarioForm() {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<CrawlerAnalysisResponse | null>(null)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    website_url: "",
    description: "",
    email: "",
  })

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.website_url) {
      toast.error("Please fill in all required fields")
      return
    }

    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric to track")
      return
    }

    setIsAnalyzing(true)

    try {
      const result = await crawlerApi.analyze({
        website_url: formData.website_url,
        description: formData.description || "",
        name: formData.name || "",
        metrics: selectedMetrics,
        email: formData.email || "",
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
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      {/* Loading Dialog */}
      <LoadingDialog open={isAnalyzing} />

      {/* Results Modal */}
      <ScenarioTasksModal
        open={showResultsModal}
        onOpenChange={setShowResultsModal}
        mode="create"
        analysisResult={analysisResult || undefined}
        createFormData={{
          name: formData.name,
          website_url: formData.website_url,
          description: formData.description,
          metrics: selectedMetrics,
          email: formData.email,
        }}
        onSave={(scenarioId) => {
          // Reset and navigate
          setFormData({ name: "", website_url: "", description: "", email: "" })
          setSelectedMetrics([])
          setAnalysisResult(null)
          setShowResultsModal(false)
          router.push("/scenarios")
        }}
      />

      {/* Main Form */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Create New Scenario</CardTitle>
            </div>
            <CardDescription>
              Set up a new test scenario with your website URL and testing focus areas. Our AI agents will test your features and identify friction points.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Scenario Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Homepage User Flow"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">
                  Website URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The URL of the website you want to test
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you want to test on this website..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Metrics to Track <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {METRIC_OPTIONS.map((metric) => {
                    const isSelected = selectedMetrics.includes(metric)
                    return (
                      <Badge
                        key={metric}
                        variant="outline"
                        className={`cursor-pointer px-3 py-2 transition-colors ${
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

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We'll send the completed report to this email address.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/scenarios")}
                  disabled={isAnalyzing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Scenario...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Scenario
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
          </CardContent>
        </Card>
      </div>
    </>
  )
}

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
