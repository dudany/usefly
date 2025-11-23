"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Sparkles, X } from "lucide-react"

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  description: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type FormData = z.infer<typeof formSchema>

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

export function NewReportForm() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

  const onSubmit = async (data: FormData) => {
    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric to track")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success("Report request submitted successfully!", {
        description: "We'll send the analysis to your email once it's ready.",
      })

      // Reset form
      reset()
      setSelectedMetrics([])
    } catch (error) {
      toast.error("Failed to submit report request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-2 shadow-lg">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">Request New Report</CardTitle>
          </div>
          <CardDescription className="text-base">
            Submit your website or feature URL to get detailed analytics on user journeys and AI agent behavior.
            We'll analyze the data and send you comprehensive insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Request Analysis Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card className="bg-muted/30 border-muted">
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

        <Card className="bg-muted/30 border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Processing Time</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Reports are typically ready within:</p>
            <p>• Simple sites: 1-2 hours</p>
            <p>• Complex features: 2-4 hours</p>
            <p>• Enterprise apps: 4-8 hours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
