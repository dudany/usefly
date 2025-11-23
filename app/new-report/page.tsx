import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { NewReportForm } from "@/components/reports/new-report-form"

export default function NewReportPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">New Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Request a new analysis for your website or feature</p>
        </div>
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          <NewReportForm />
        </Suspense>
      </div>
    </AppLayout>
  )
}
