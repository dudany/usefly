"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"
import { type Metric, type ChartConfig } from "./mock-metrics"
import { MOCK_AGENT_RUNS } from "@/components/agent-runs/mock-data"
import { Info, TrendingUp } from "lucide-react"
import { useMemo } from "react"

interface ChartRecommendationsProps {
  metric: Metric
}

const COLORS = {
  primary: "oklch(0.55 0.2 280)",
  success: "oklch(0.7 0.15 145)",
  warning: "oklch(0.75 0.15 85)",
  error: "oklch(0.65 0.2 25)",
  neutral: "oklch(0.6 0.05 260)",
  accent: "oklch(0.65 0.18 310)",
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.accent,
  COLORS.neutral,
  COLORS.error,
]

export function ChartRecommendations({ metric }: ChartRecommendationsProps) {
  // Process data based on metric type
  const chartData = useMemo(() => {
    return processDataForMetric(metric.id)
  }, [metric.id])

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Selected Metric: {metric.name}
          </h3>
          <p className="text-sm text-muted-foreground">{metric.description}</p>
        </div>
      </div>

      {metric.charts.map((chartConfig, index) => (
        <ChartCard
          key={index}
          chartConfig={chartConfig}
          data={chartData[index] || []}
          metricId={metric.id}
        />
      ))}
    </div>
  )
}

interface ChartCardProps {
  chartConfig: ChartConfig
  data: any[]
  metricId: string
}

function ChartCard({ chartConfig, data, metricId }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{chartConfig.title}</CardTitle>
            <CardDescription>{chartConfig.description}</CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {chartConfig.type} Chart
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Visualization */}
        <div className="w-full h-[350px]">
          {renderChart(chartConfig.type, data, metricId)}
        </div>

        {/* Why It Matters */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong className="font-semibold">Why This Matters: </strong>
            {chartConfig.whyItMatters}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

function renderChart(type: string, data: any[], metricId: string) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No data available for visualization
      </div>
    )
  }

  switch (type) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" opacity={0.1} />
            <XAxis
              dataKey="name"
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <YAxis
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.98 0 0)",
                border: "1px solid oklch(0.85 0.01 260)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS.primary}
              strokeWidth={2}
              dot={{ fill: COLORS.primary, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {data[0]?.value2 !== undefined && (
              <Line
                type="monotone"
                dataKey="value2"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={{ fill: COLORS.success, r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )

    case "bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" opacity={0.1} />
            <XAxis
              dataKey="name"
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <YAxis
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.98 0 0)",
                border: "1px solid oklch(0.85 0.01 260)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            {data[0]?.value2 !== undefined && (
              <Bar dataKey="value2" fill={COLORS.success} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      )

    case "pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill={COLORS.primary}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.98 0 0)",
                border: "1px solid oklch(0.85 0.01 260)",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )

    case "funnel":
      // Funnel represented as horizontal bar chart with decreasing values
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" opacity={0.1} />
            <XAxis type="number" stroke="oklch(0.5 0.05 260)" tick={{ fill: "oklch(0.5 0.05 260)" }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.98 0 0)",
                border: "1px solid oklch(0.85 0.01 260)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )

    case "area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" opacity={0.1} />
            <XAxis
              dataKey="name"
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <YAxis
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.98 0 0)",
                border: "1px solid oklch(0.85 0.01 260)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      )

    case "histogram":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" opacity={0.1} />
            <XAxis
              dataKey="name"
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <YAxis
              stroke="oklch(0.5 0.05 260)"
              tick={{ fill: "oklch(0.5 0.05 260)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.98 0 0)",
                border: "1px solid oklch(0.85 0.01 260)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )

    default:
      return <div className="text-center text-muted-foreground">Chart type not supported</div>
  }
}

// Process data for different metrics
function processDataForMetric(metricId: string): any[][] {
  const successRuns = MOCK_AGENT_RUNS.filter((run) => run.status === "success")
  const allRuns = MOCK_AGENT_RUNS

  switch (metricId) {
    case "purchase-completed":
      return [
        // Funnel data
        [
          { name: "Product Viewed", value: 100 },
          { name: "Add to Cart", value: 78 },
          { name: "Checkout Started", value: 65 },
          { name: "Payment Info", value: 58 },
          { name: "Purchase Complete", value: 52 },
        ],
        // Line chart - trend over time
        [
          { name: "Jan 1", value: 45 },
          { name: "Jan 2", value: 52 },
          { name: "Jan 3", value: 48 },
          { name: "Jan 4", value: 61 },
          { name: "Jan 5", value: 55 },
          { name: "Jan 6", value: 67 },
          { name: "Jan 7", value: 59 },
        ],
        // Bar chart - by segment
        [
          { name: "New Shopper", value: 42 },
          { name: "Returning User", value: 68 },
          { name: "Premium User", value: 85 },
          { name: "Guest", value: 28 },
        ],
      ]

    case "subscription-purchased":
      return [
        // Line - growth over time
        [
          { name: "Week 1", value: 23 },
          { name: "Week 2", value: 31 },
          { name: "Week 3", value: 28 },
          { name: "Week 4", value: 42 },
          { name: "Week 5", value: 38 },
          { name: "Week 6", value: 51 },
        ],
        // Bar - by plan type
        [
          { name: "Basic", value: 145 },
          { name: "Pro", value: 89 },
          { name: "Enterprise", value: 34 },
        ],
      ]

    case "add-to-cart":
      return [
        // Funnel
        [
          { name: "Product Page View", value: 100 },
          { name: "Add to Cart", value: 68 },
          { name: "View Cart", value: 54 },
          { name: "Checkout", value: 45 },
          { name: "Purchase", value: 38 },
        ],
        // Line
        [
          { name: "Mon", value: 234 },
          { name: "Tue", value: 198 },
          { name: "Wed", value: 267 },
          { name: "Thu", value: 289 },
          { name: "Fri", value: 312 },
          { name: "Sat", value: 389 },
          { name: "Sun", value: 356 },
        ],
      ]

    case "checkout-started":
      return [
        // Funnel
        [
          { name: "Cart View", value: 100 },
          { name: "Checkout Started", value: 73 },
          { name: "Shipping Info", value: 65 },
          { name: "Payment", value: 58 },
          { name: "Complete", value: 51 },
        ],
        // Bar - drop-off by step
        [
          { name: "Shipping Info", value: 11 },
          { name: "Payment", value: 10 },
          { name: "Review Order", value: 12 },
          { name: "Submit", value: 14 },
        ],
      ]

    case "form-submitted":
      return [
        // Line
        [
          { name: "Jan 1", value: 89 },
          { name: "Jan 2", value: 95 },
          { name: "Jan 3", value: 87 },
          { name: "Jan 4", value: 102 },
          { name: "Jan 5", value: 98 },
        ],
        // Bar
        [
          { name: "Contact Form", value: 245 },
          { name: "Lead Gen", value: 189 },
          { name: "Survey", value: 134 },
          { name: "Feedback", value: 98 },
        ],
      ]

    case "trial-started":
      return [
        // Line
        [
          { name: "Week 1", value: 67 },
          { name: "Week 2", value: 72 },
          { name: "Week 3", value: 69 },
          { name: "Week 4", value: 84 },
        ],
        // Funnel
        [
          { name: "Trial Started", value: 100 },
          { name: "Activated", value: 68 },
          { name: "Engaged", value: 45 },
          { name: "Converted to Paid", value: 31 },
        ],
      ]

    case "account-created":
      return [
        // Line
        [
          { name: "Mon", value: 145 },
          { name: "Tue", value: 132 },
          { name: "Wed", value: 167 },
          { name: "Thu", value: 159 },
          { name: "Fri", value: 178 },
        ],
        // Bar - by source
        [
          { name: "Organic", value: 289 },
          { name: "Paid Ads", value: 234 },
          { name: "Referral", value: 156 },
          { name: "Social", value: 123 },
        ],
      ]

    case "page-viewed":
      return [
        // Line
        [
          { name: "00:00", value: 2340 },
          { name: "04:00", value: 1890 },
          { name: "08:00", value: 4560 },
          { name: "12:00", value: 5890 },
          { name: "16:00", value: 6230 },
          { name: "20:00", value: 4120 },
        ],
        // Bar
        [
          { name: "Homepage", value: 8934 },
          { name: "Product Page", value: 6721 },
          { name: "Blog", value: 4532 },
          { name: "About", value: 2134 },
          { name: "Contact", value: 1876 },
        ],
      ]

    case "scrolled-to-bottom":
      return [
        // Bar
        [
          { name: "Homepage", value: 78 },
          { name: "Blog Posts", value: 92 },
          { name: "Product Pages", value: 65 },
          { name: "Pricing", value: 88 },
          { name: "About", value: 71 },
        ],
        // Histogram
        [
          { name: "0-20%", value: 145 },
          { name: "20-40%", value: 234 },
          { name: "40-60%", value: 312 },
          { name: "60-80%", value: 267 },
          { name: "80-100%", value: 456 },
        ],
      ]

    case "video-played":
      return [
        // Line
        [
          { name: "Day 1", value: 234 },
          { name: "Day 2", value: 267 },
          { name: "Day 3", value: 289 },
          { name: "Day 4", value: 312 },
          { name: "Day 5", value: 298 },
        ],
        // Bar
        [
          { name: "Product Demo", value: 892 },
          { name: "Tutorial", value: 734 },
          { name: "Testimonial", value: 456 },
          { name: "Feature Tour", value: 623 },
        ],
      ]

    case "content-shared":
      return [
        // Bar
        [
          { name: "Blog Posts", value: 456 },
          { name: "Product Pages", value: 234 },
          { name: "Case Studies", value: 189 },
          { name: "Videos", value: 312 },
        ],
        // Line
        [
          { name: "Mon", value: 89 },
          { name: "Tue", value: 95 },
          { name: "Wed", value: 108 },
          { name: "Thu", value: 98 },
          { name: "Fri", value: 134 },
        ],
      ]

    case "cta-clicked":
      return [
        // Bar
        [
          { name: "Start Free Trial", value: 892 },
          { name: "Get Demo", value: 634 },
          { name: "Contact Sales", value: 456 },
          { name: "Learn More", value: 789 },
        ],
        // Line
        [
          { name: "Week 1", value: 1234 },
          { name: "Week 2", value: 1456 },
          { name: "Week 3", value: 1389 },
          { name: "Week 4", value: 1623 },
        ],
      ]

    case "feature-used":
      return [
        // Bar
        [
          { name: "Search", value: 2345 },
          { name: "Filters", value: 1892 },
          { name: "Export", value: 1234 },
          { name: "Share", value: 987 },
          { name: "Favorites", value: 1456 },
        ],
        // Line
        [
          { name: "Jan", value: 4567 },
          { name: "Feb", value: 5234 },
          { name: "Mar", value: 6123 },
          { name: "Apr", value: 6789 },
        ],
      ]

    case "session-duration":
      return [
        // Line
        [
          { name: "Mon", value: 4.2 },
          { name: "Tue", value: 3.8 },
          { name: "Wed", value: 4.5 },
          { name: "Thu", value: 4.1 },
          { name: "Fri", value: 3.9 },
        ],
        // Histogram
        [
          { name: "0-1 min", value: 234 },
          { name: "1-3 min", value: 456 },
          { name: "3-5 min", value: 623 },
          { name: "5-10 min", value: 789 },
          { name: "10+ min", value: 512 },
        ],
      ]

    case "agent-task-completed":
      // Using actual agent run data
      const completionByDay = MOCK_AGENT_RUNS.reduce((acc: any, run) => {
        const date = new Date(run.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!acc[date]) acc[date] = { total: 0, success: 0 }
        acc[date].total++
        if (run.status === "success") acc[date].success++
        return acc
      }, {})

      const successByPersona = MOCK_AGENT_RUNS.reduce((acc: any, run) => {
        if (!acc[run.personaType]) acc[run.personaType] = { total: 0, success: 0 }
        acc[run.personaType].total++
        if (run.status === "success") acc[run.personaType].success++
        return acc
      }, {})

      return [
        // Line - success rate over time
        Object.keys(completionByDay).slice(0, 7).map(date => ({
          name: date,
          value: Math.round((completionByDay[date].success / completionByDay[date].total) * 100),
        })),
        // Bar - by task type (using persona as proxy)
        Object.keys(successByPersona).map(persona => ({
          name: persona.replace('-', ' '),
          value: Math.round((successByPersona[persona].success / successByPersona[persona].total) * 100),
        })),
        // Histogram - duration distribution
        [
          { name: "0-60s", value: MOCK_AGENT_RUNS.filter(r => r.duration < 60).length },
          { name: "60-120s", value: MOCK_AGENT_RUNS.filter(r => r.duration >= 60 && r.duration < 120).length },
          { name: "120-180s", value: MOCK_AGENT_RUNS.filter(r => r.duration >= 120 && r.duration < 180).length },
          { name: "180-240s", value: MOCK_AGENT_RUNS.filter(r => r.duration >= 180 && r.duration < 240).length },
          { name: "240s+", value: MOCK_AGENT_RUNS.filter(r => r.duration >= 240).length },
        ],
      ]

    case "agent-error-encountered":
      const errorTypes = MOCK_AGENT_RUNS
        .filter(r => r.status === "error")
        .reduce((acc: any, run) => {
          const errorType = run.errorType || "Unknown"
          acc[errorType] = (acc[errorType] || 0) + 1
          return acc
        }, {})

      return [
        // Bar - by error type
        Object.keys(errorTypes).map(type => ({
          name: type,
          value: errorTypes[type],
        })),
        // Line - error rate trend
        Object.keys(completionByDay).slice(0, 7).map(date => ({
          name: date,
          value: completionByDay[date].total - completionByDay[date].success,
        })),
      ]

    case "agent-navigation-path":
      const pathLengths = MOCK_AGENT_RUNS.reduce((acc: any, run) => {
        const length = run.journeyPath.length
        const bucket = length <= 3 ? "1-3" : length <= 5 ? "4-5" : length <= 7 ? "6-7" : "8+"
        acc[bucket] = (acc[bucket] || 0) + 1
        return acc
      }, {})

      return [
        // Funnel - common paths (using journey path data)
        [
          { name: "Homepage", value: MOCK_AGENT_RUNS.filter(r => r.journeyPath.includes("Homepage")).length },
          { name: "Product Search", value: MOCK_AGENT_RUNS.filter(r => r.journeyPath.includes("Product Search")).length },
          { name: "Product Page", value: MOCK_AGENT_RUNS.filter(r => r.journeyPath.includes("Product Page")).length },
          { name: "Add to Cart", value: MOCK_AGENT_RUNS.filter(r => r.journeyPath.includes("Add to Cart")).length },
          { name: "Checkout", value: MOCK_AGENT_RUNS.filter(r => r.journeyPath.includes("Checkout")).length },
        ],
        // Bar - path length
        Object.keys(pathLengths).map(bucket => ({
          name: `${bucket} steps`,
          value: pathLengths[bucket],
        })),
      ]

    case "agent-form-fill-success":
      return [
        // Bar
        [
          { name: "Contact Form", value: 87 },
          { name: "Checkout Form", value: 76 },
          { name: "Registration", value: 92 },
          { name: "Survey", value: 81 },
        ],
        // Line
        [
          { name: "Week 1", value: 78 },
          { name: "Week 2", value: 82 },
          { name: "Week 3", value: 85 },
          { name: "Week 4", value: 89 },
        ],
      ]

    case "agent-button-click":
      return [
        // Bar
        [
          { name: "Primary CTA", value: 95 },
          { name: "Secondary CTA", value: 88 },
          { name: "Navigation", value: 97 },
          { name: "Form Submit", value: 82 },
          { name: "Close/Cancel", value: 91 },
        ],
      ]

    case "agent-timeout":
      return [
        // Bar
        [
          { name: "Checkout Flow", value: 12 },
          { name: "Search", value: 5 },
          { name: "Form Fill", value: 8 },
          { name: "Navigation", value: 3 },
        ],
        // Line
        [
          { name: "Week 1", value: 18 },
          { name: "Week 2", value: 15 },
          { name: "Week 3", value: 21 },
          { name: "Week 4", value: 16 },
        ],
      ]

    case "agent-abandoned-task":
      return [
        // Bar
        [
          { name: "Checkout", value: 18 },
          { name: "Registration", value: 12 },
          { name: "Form Fill", value: 15 },
          { name: "Search", value: 7 },
        ],
        // Funnel
        [
          { name: "Started", value: 100 },
          { name: "Step 1", value: 85 },
          { name: "Step 2", value: 72 },
          { name: "Step 3 (Abandon)", value: 56 },
          { name: "Completed", value: 44 },
        ],
      ]

    case "first-action-completed":
      return [
        // Line
        [
          { name: "Mon", value: 76 },
          { name: "Tue", value: 81 },
          { name: "Wed", value: 78 },
          { name: "Thu", value: 84 },
          { name: "Fri", value: 79 },
        ],
        // Histogram
        [
          { name: "0-30s", value: 234 },
          { name: "30-60s", value: 456 },
          { name: "1-2 min", value: 312 },
          { name: "2-5 min", value: 198 },
          { name: "5+ min", value: 89 },
        ],
      ]

    case "onboarding-completed":
      return [
        // Funnel
        [
          { name: "Welcome Screen", value: 100 },
          { name: "Profile Setup", value: 82 },
          { name: "Preferences", value: 71 },
          { name: "Tutorial", value: 64 },
          { name: "First Action", value: 58 },
        ],
        // Line
        [
          { name: "Week 1", value: 54 },
          { name: "Week 2", value: 58 },
          { name: "Week 3", value: 62 },
          { name: "Week 4", value: 67 },
        ],
      ]

    case "return-visit":
      return [
        // Line
        [
          { name: "Day 1", value: 45 },
          { name: "Day 3", value: 38 },
          { name: "Day 7", value: 31 },
          { name: "Day 14", value: 27 },
          { name: "Day 30", value: 24 },
        ],
        // Bar
        [
          { name: "New Shopper", value: 34 },
          { name: "Returning User", value: 68 },
          { name: "Premium User", value: 82 },
          { name: "Guest", value: 21 },
        ],
      ]

    case "error-occurred":
      return [
        // Bar
        [
          { name: "404 Not Found", value: 234 },
          { name: "500 Server Error", value: 89 },
          { name: "Network Timeout", value: 156 },
          { name: "Validation Error", value: 312 },
          { name: "Auth Error", value: 78 },
        ],
        // Line
        [
          { name: "Mon", value: 145 },
          { name: "Tue", value: 132 },
          { name: "Wed", value: 178 },
          { name: "Thu", value: 156 },
          { name: "Fri", value: 123 },
        ],
      ]

    case "failed-payment":
      return [
        // Line
        [
          { name: "Week 1", value: 3.2 },
          { name: "Week 2", value: 2.8 },
          { name: "Week 3", value: 3.5 },
          { name: "Week 4", value: 2.9 },
        ],
        // Bar
        [
          { name: "Card Declined", value: 45 },
          { name: "Insufficient Funds", value: 32 },
          { name: "Technical Error", value: 18 },
          { name: "Expired Card", value: 23 },
        ],
      ]

    case "validation-error":
      return [
        // Bar
        [
          { name: "Email Format", value: 456 },
          { name: "Password Requirements", value: 389 },
          { name: "Phone Number", value: 234 },
          { name: "Credit Card", value: 198 },
          { name: "Zip Code", value: 167 },
        ],
        // Line
        [
          { name: "Mon", value: 234 },
          { name: "Tue", value: 198 },
          { name: "Wed", value: 256 },
          { name: "Thu", value: 212 },
          { name: "Fri", value: 189 },
        ],
      ]

    default:
      return [
        [
          { name: "Data 1", value: 100 },
          { name: "Data 2", value: 75 },
          { name: "Data 3", value: 50 },
        ],
      ]
  }
}
