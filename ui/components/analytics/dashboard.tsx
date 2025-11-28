"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown } from "lucide-react"
import { dropOffData, conversionData, errorTypesData, personaSuccessData, metricsOverview } from "./mock-data"

const COLORS = ["#b64aff", "#4da6ff", "#ff8c42", "#00c9a7", "#ffd700"]

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsOverview.map((metric, idx) => (
          <Card key={idx} className="p-6 bg-card border-border">
            <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
            <div className="flex items-end justify-between gap-4">
              <p className="text-2xl font-bold">{metric.value}</p>
              {metric.change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === "up" ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {metric.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate Trend */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Conversion Trend</h3>
              <p className="text-xs text-muted-foreground mt-1">Success vs Failure over time</p>
            </div>
          </div>
          <ChartContainer
            config={{
              success: { label: "Success", color: "hsl(var(--chart-1))" },
              failure: { label: "Failure", color: "hsl(var(--chart-2))" },
            }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-chart-1)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="failure"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-chart-2)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Drop-off Rate */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Drop-off Analysis</h3>
              <p className="text-xs text-muted-foreground mt-1">Agents completing each step</p>
            </div>
          </div>
          <ChartContainer
            config={{
              rate: { label: "Drop-off %", color: "hsl(var(--chart-3))" },
            }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropOffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="step" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="rate" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </div>

      {/* Error Types & Persona Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Types Distribution */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Error Distribution</h3>
              <p className="text-xs text-muted-foreground mt-1">Most common failure types</p>
            </div>
          </div>
          <div className="space-y-3">
            {errorTypesData.map((error, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{error.name}</span>
                  <span className="font-medium">{error.count}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-chart-1 to-chart-2 rounded-full"
                    style={{ width: `${error.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground">{error.percentage}%</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Persona Success Rates */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Persona Performance</h3>
              <p className="text-xs text-muted-foreground mt-1">Success rate by agent type</p>
            </div>
          </div>
          <div className="space-y-4">
            {personaSuccessData.map((persona, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{persona.persona}</span>
                  <span className="font-bold text-primary">{persona.successRate}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 rounded-full"
                    style={{ width: `${persona.successRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Agents by Platform */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Platform Distribution</h3>
            <p className="text-xs text-muted-foreground mt-1">Agent runs by platform</p>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ChartContainer
          config={{
            web: { label: "Web", color: "hsl(var(--chart-1))" },
            mobile: { label: "Mobile", color: "hsl(var(--chart-2))" },
          }}
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Web", value: 68 },
                  { name: "Mobile", value: 32 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {[
                  { name: "Web", value: 68 },
                  { name: "Mobile", value: 32 },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Web Agents</p>
            <p className="text-2xl font-bold">1,935</p>
            <p className="text-xs text-emerald-500 mt-1">↑ 8% from last week</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mobile Agents</p>
            <p className="text-2xl font-bold">912</p>
            <p className="text-xs text-emerald-500 mt-1">↑ 12% from last week</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
