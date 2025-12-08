"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { scenarioApi } from "@/lib/api-client"
import { GenerateMoreTasksRequest } from "@/types/api"

interface GenerateTasksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenarioId: string
  onSuccess: () => void
}

export function GenerateTasksDialog({
  open,
  onOpenChange,
  scenarioId,
  onSuccess
}: GenerateTasksDialogProps) {
  const [numTasks, setNumTasks] = useState(15)
  const [promptType, setPromptType] = useState<"original" | "friction">("friction")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    // Validation
    if (numTasks < 5 || numTasks > 50) {
      toast.error("Number of tasks must be between 5 and 50")
      return
    }

    setIsGenerating(true)
    try {
      const request: GenerateMoreTasksRequest = {
        num_tasks: numTasks,
        prompt_type: promptType,
        custom_prompt: customPrompt || undefined
      }

      const response = await scenarioApi.generateMoreTasks(scenarioId, request)

      toast.success("Tasks generated successfully!", {
        description: `Generated ${response.new_tasks.length} new tasks`
      })

      onSuccess()
      onOpenChange(false)

      // Reset form
      setNumTasks(15)
      setPromptType("friction")
      setCustomPrompt("")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Task generation failed"
      toast.error("Generation failed", {
        description: errorMessage
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate More Tasks
          </DialogTitle>
          <DialogDescription>
            Generate additional tasks for this scenario using AI. New tasks will be automatically selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Number of Tasks */}
          <div className="space-y-2">
            <Label htmlFor="num-tasks">
              Number of Tasks (5-50)
            </Label>
            <Input
              id="num-tasks"
              type="number"
              min={5}
              max={50}
              value={numTasks}
              onChange={(e) => setNumTasks(parseInt(e.target.value) || 15)}
            />
            <p className="text-sm text-muted-foreground">
              Recommended: 10-15 tasks for focused testing
            </p>
          </div>

          {/* Prompt Type Selection */}
          <div className="space-y-3">
            <Label>Task Generation Strategy</Label>
            <RadioGroup value={promptType} onValueChange={(v) => setPromptType(v as "original" | "friction")}>
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <RadioGroupItem value="original" id="original" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="original" className="font-medium cursor-pointer">
                    Original Strategy
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Generate standard user journey tasks focusing on conversions, research, and typical user flows
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 border-primary bg-primary/5">
                <RadioGroupItem value="friction" id="friction" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="friction" className="font-medium cursor-pointer">
                    Friction-Focused Strategy (Recommended)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Generate tasks targeting edge cases, error handling, accessibility issues, and performance problems
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">
              Custom Instructions (Optional)
            </Label>
            <Textarea
              id="custom-prompt"
              placeholder="Add specific instructions to customize task generation, e.g., 'Focus on mobile checkout flow' or 'Test international shipping scenarios'"
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              These instructions will be included in the prompt to tailor task generation
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {numTasks} Tasks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
