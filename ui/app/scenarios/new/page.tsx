import Link from "next/link"
import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { NewScenarioForm } from "@/components/scenarios/new-scenario-form"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Target, LineChart, ChevronLeft } from "lucide-react"

export default function NewScenarioPage() {
  return (
    <AppLayout>
      <div className="p-6">
        {/* Back Button */}
        <Link href="/scenarios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Scenarios
        </Link>

        {/* Hero Section */}
        <div className="mb-12">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Create Your Test Scenario
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Set up a new test scenario with your website URL, testing focus areas, and personas to analyze.
              Our AI agents will test your features and identify friction points.
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Fast QA Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    AI agents test your feature's core functionality in hours, not days
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Identify Friction Points</h3>
                  <p className="text-sm text-muted-foreground">
                    Catch UX issues and errors before they impact real users
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <LineChart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Know What to Measure</h3>
                  <p className="text-sm text-muted-foreground">
                    Get recommended metrics to track when your feature goes live
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form */}
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          <NewScenarioForm />
        </Suspense>
      </div>
    </AppLayout>
  )
}
