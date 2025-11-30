"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Settings as SettingsIcon, Loader, Save, ChevronLeft } from "lucide-react"
import { systemConfigApi } from "@/lib/api-client"
import { SystemConfig } from "@/types/api"

const formSchema = z.object({
  model_name: z.string().min(1, "Model name is required"),
  api_key: z.string().min(1, "API key is required"),
  use_thinking: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SystemConfig | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_name: "gpt-4o",
      api_key: "",
      use_thinking: true,
    },
  })

  const useThinking = watch("use_thinking")

  // Fetch existing config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true)
        const data = await systemConfigApi.get()
        setConfig(data)
        setValue("model_name", data.model_name)
        setValue("api_key", data.api_key)
        setValue("use_thinking", data.use_thinking)
      } catch (error) {
        // Config doesn't exist yet, use defaults
        console.log("No existing config found, using defaults")
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [setValue])

  const onSubmit = async (data: FormData) => {
    setSaving(true)

    try {
      const updated = await systemConfigApi.update(data)
      setConfig(updated)
      toast.success("Settings saved successfully!", {
        description: "System configuration has been updated.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save settings"
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/scenarios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-6 h-6" />
          <h1 className="text-3xl font-bold">System Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure the AI model and API settings for the crawler agent.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Model Configuration</CardTitle>
          <CardDescription>
            Set the OpenAI model and API key for running website crawls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Model Name */}
            <div className="space-y-2">
              <Label htmlFor="model_name" className="text-sm font-semibold">
                Model Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model_name"
                type="text"
                placeholder="gpt-4o"
                {...register("model_name")}
                className={errors.model_name ? "border-destructive" : ""}
              />
              {errors.model_name && (
                <p className="text-sm text-destructive">{errors.model_name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The OpenAI model to use for the crawler agent (e.g., gpt-4o, gpt-4o-mini)
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api_key" className="text-sm font-semibold">
                OpenAI API Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="api_key"
                type="password"
                placeholder="sk-..."
                {...register("api_key")}
                className={errors.api_key ? "border-destructive" : ""}
              />
              {errors.api_key && (
                <p className="text-sm text-destructive">{errors.api_key.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your OpenAI API key. Get one at{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </p>
            </div>

            {/* Use Thinking */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="use_thinking" className="text-sm font-semibold cursor-pointer">
                  Enable Thinking Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow the AI to use extended thinking for complex decisions
                </p>
              </div>
              <Switch
                id="use_thinking"
                checked={useThinking}
                onCheckedChange={(checked) => setValue("use_thinking", checked)}
              />
            </div>

            {/* Save Button */}
            <div className="pt-4 flex justify-end gap-3">
              {config && (
                <div className="flex-1 text-xs text-muted-foreground flex items-center">
                  Last updated: {new Date(config.updated_at).toLocaleString()}
                </div>
              )}
              <Button
                type="submit"
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• The API key is stored securely and used only for crawler operations</p>
          <p>• Changes take effect immediately for new crawler runs</p>
          <p>• Thinking mode may increase API costs but improve analysis quality</p>
          <p>• Make sure your API key has sufficient credits for crawler operations</p>
        </CardContent>
      </Card>
    </div>
  )
}
