import { AppLayout } from "@/components/layout/app-layout"
import { ReportsDashboard } from "@/components/archived/reports/reports-dashboard"

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Archived Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare A/B test results and analyze feature impact on key metrics
          </p>
        </div>
        <ReportsDashboard />
      </div>
    </AppLayout>
  )
}
