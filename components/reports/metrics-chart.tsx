"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { MetricComparison } from "./mock-data"

interface MetricsChartProps {
  metrics: MetricComparison[]
}

export function MetricsChart({ metrics }: MetricsChartProps) {
  const chartData = metrics.map((metric) => ({
    name: metric.subMetricName.length > 25 ? metric.subMetricName.substring(0, 25) + "..." : metric.subMetricName,
    fullName: metric.subMetricName,
    baseline: metric.baselineValue,
    test: metric.testValue,
    impact: metric.impact,
  }))

  const chartConfig = {
    baseline: {
      label: "Baseline",
      color: "hsl(var(--muted-foreground))",
    },
    test: {
      label: "Test",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Top Metric Changes</h3>
        <p className="text-sm text-muted-foreground">Comparison of baseline vs test values for most impactful metrics</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} label={{ value: "Value (%)", angle: -90, position: "insideLeft" }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="baseline" fill="hsl(var(--muted-foreground))" name="Baseline" radius={[4, 4, 0, 0]} />
            <Bar dataKey="test" fill="hsl(var(--primary))" name="Test" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  )
}
