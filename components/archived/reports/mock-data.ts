import type { AgentRun } from "@/components/agent-runs/mock-data"

export interface Feature {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface Report {
  id: string
  featureId: string
  createdAt: string
  baselineRunIds: string[]
  testRunIds: string[]
}

export interface SubMetricDefinition {
  name: string
  key: string
  higherIsBetter: boolean
}

export interface MetricDefinition {
  category: string
  parentMetric: string
  subMetrics: SubMetricDefinition[]
}

export interface MetricComparison {
  category: string
  parentMetric: string
  subMetricName: string
  baselineValue: number
  testValue: number
  delta: number
  deltaPercent: number
  trend: "up" | "down" | "neutral"
  impact: "positive" | "negative" | "neutral"
}

// Metric categories - updated to support sub-metrics
export const METRIC_CATEGORIES = [
  "Time to Value",
  "Onboarding",
  "Feature Adoption",
] as const

export const METRICS_DEFINITIONS: MetricDefinition[] = [
  {
    category: "Time to Value",
    parentMetric: "Time to Value",
    subMetrics: [
      { name: "Time to Value (minutes)", key: "minutes", higherIsBetter: false },
      { name: "Time to Value (steps)", key: "steps", higherIsBetter: false },
    ],
  },
  {
    category: "Onboarding",
    parentMetric: "Onboarding Completion",
    subMetrics: [
      { name: "Onboarding Completion Rate", key: "completed", higherIsBetter: true },
    ],
  },
  {
    category: "Feature Adoption",
    parentMetric: "Feature Adoption",
    subMetrics: [
      { name: "Feature Adoption Rate", key: "adopted", higherIsBetter: true },
    ],
  },
]

// Calculate metrics from agent runs - SERVER-SIDE ONLY
export function calculateMetricsFromRuns(baselineRuns: AgentRun[], testRuns: AgentRun[]): MetricComparison[] {
  const metrics: MetricComparison[] = []

  // Only use successful runs for Time to Value calculations
  const baselineSuccessRuns = baselineRuns.filter((r) => r.status === "success")
  const testSuccessRuns = testRuns.filter((r) => r.status === "success")

  // === TIME TO VALUE METRICS ===

  // Time to Value (minutes)
  const baselineTimeToValueMinutes =
    baselineSuccessRuns.length > 0
      ? baselineSuccessRuns.reduce((sum, r) => sum + r.metrics.timeToValue.minutes, 0) / baselineSuccessRuns.length
      : 0

  const testTimeToValueMinutes =
    testSuccessRuns.length > 0
      ? testSuccessRuns.reduce((sum, r) => sum + r.metrics.timeToValue.minutes, 0) / testSuccessRuns.length
      : 0

  const timeToValueMinutesDelta = testTimeToValueMinutes - baselineTimeToValueMinutes
  const timeToValueMinutesDeltaPercent = baselineTimeToValueMinutes > 0 ? (timeToValueMinutesDelta / baselineTimeToValueMinutes) * 100 : 0

  metrics.push({
    category: "Time to Value",
    parentMetric: "Time to Value",
    subMetricName: "Time to Value (minutes)",
    baselineValue: Number(baselineTimeToValueMinutes.toFixed(2)),
    testValue: Number(testTimeToValueMinutes.toFixed(2)),
    delta: Number(timeToValueMinutesDelta.toFixed(2)),
    deltaPercent: Number(timeToValueMinutesDeltaPercent.toFixed(2)),
    trend: Math.abs(timeToValueMinutesDeltaPercent) > 2 ? (timeToValueMinutesDeltaPercent > 0 ? "up" : "down") : "neutral",
    impact:
      Math.abs(timeToValueMinutesDeltaPercent) > 2
        ? timeToValueMinutesDeltaPercent < 0
          ? "positive"
          : "negative"
        : "neutral", // Lower is better
  })

  // Time to Value (steps)
  const baselineTimeToValueSteps =
    baselineSuccessRuns.length > 0
      ? baselineSuccessRuns.reduce((sum, r) => sum + r.metrics.timeToValue.steps, 0) / baselineSuccessRuns.length
      : 0

  const testTimeToValueSteps =
    testSuccessRuns.length > 0
      ? testSuccessRuns.reduce((sum, r) => sum + r.metrics.timeToValue.steps, 0) / testSuccessRuns.length
      : 0

  const timeToValueStepsDelta = testTimeToValueSteps - baselineTimeToValueSteps
  const timeToValueStepsDeltaPercent = baselineTimeToValueSteps > 0 ? (timeToValueStepsDelta / baselineTimeToValueSteps) * 100 : 0

  metrics.push({
    category: "Time to Value",
    parentMetric: "Time to Value",
    subMetricName: "Time to Value (steps)",
    baselineValue: Number(baselineTimeToValueSteps.toFixed(2)),
    testValue: Number(testTimeToValueSteps.toFixed(2)),
    delta: Number(timeToValueStepsDelta.toFixed(2)),
    deltaPercent: Number(timeToValueStepsDeltaPercent.toFixed(2)),
    trend: Math.abs(timeToValueStepsDeltaPercent) > 2 ? (timeToValueStepsDeltaPercent > 0 ? "up" : "down") : "neutral",
    impact:
      Math.abs(timeToValueStepsDeltaPercent) > 2
        ? timeToValueStepsDeltaPercent < 0
          ? "positive"
          : "negative"
        : "neutral", // Lower is better
  })

  // === ONBOARDING METRICS ===

  // Onboarding Completion Rate
  const baselineOnboardingRate =
    baselineRuns.length > 0
      ? (baselineRuns.filter((r) => r.metrics.onboarding.completed).length / baselineRuns.length) * 100
      : 0

  const testOnboardingRate =
    testRuns.length > 0
      ? (testRuns.filter((r) => r.metrics.onboarding.completed).length / testRuns.length) * 100
      : 0

  const onboardingDelta = testOnboardingRate - baselineOnboardingRate
  const onboardingDeltaPercent = baselineOnboardingRate > 0 ? (onboardingDelta / baselineOnboardingRate) * 100 : 0

  metrics.push({
    category: "Onboarding",
    parentMetric: "Onboarding Completion",
    subMetricName: "Onboarding Completion Rate",
    baselineValue: Number(baselineOnboardingRate.toFixed(2)),
    testValue: Number(testOnboardingRate.toFixed(2)),
    delta: Number(onboardingDelta.toFixed(2)),
    deltaPercent: Number(onboardingDeltaPercent.toFixed(2)),
    trend: Math.abs(onboardingDeltaPercent) > 2 ? (onboardingDeltaPercent > 0 ? "up" : "down") : "neutral",
    impact:
      Math.abs(onboardingDeltaPercent) > 2
        ? onboardingDeltaPercent > 0
          ? "positive"
          : "negative"
        : "neutral", // Higher is better
  })

  // === FEATURE ADOPTION METRICS ===

  // Feature Adoption Rate
  const baselineAdoptionRate =
    baselineRuns.length > 0
      ? (baselineRuns.filter((r) => r.metrics.featureAdoption.adopted).length / baselineRuns.length) * 100
      : 0

  const testAdoptionRate =
    testRuns.length > 0
      ? (testRuns.filter((r) => r.metrics.featureAdoption.adopted).length / testRuns.length) * 100
      : 0

  const adoptionDelta = testAdoptionRate - baselineAdoptionRate
  const adoptionDeltaPercent = baselineAdoptionRate > 0 ? (adoptionDelta / baselineAdoptionRate) * 100 : 0

  metrics.push({
    category: "Feature Adoption",
    parentMetric: "Feature Adoption",
    subMetricName: "Feature Adoption Rate",
    baselineValue: Number(baselineAdoptionRate.toFixed(2)),
    testValue: Number(testAdoptionRate.toFixed(2)),
    delta: Number(adoptionDelta.toFixed(2)),
    deltaPercent: Number(adoptionDeltaPercent.toFixed(2)),
    trend: Math.abs(adoptionDeltaPercent) > 2 ? (adoptionDeltaPercent > 0 ? "up" : "down") : "neutral",
    impact:
      Math.abs(adoptionDeltaPercent) > 2
        ? adoptionDeltaPercent > 0
          ? "positive"
          : "negative"
        : "neutral", // Higher is better
  })

  return metrics
}

// Mock Features - simplified to 2 features
export const MOCK_FEATURES: Feature[] = [
  {
    id: "feat-1",
    name: "One-Click Checkout",
    description: "Streamlined checkout process with saved payment methods",
    createdAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "feat-2",
    name: "AI Product Recommendations",
    description: "Personalized product suggestions based on browsing history",
    createdAt: "2025-01-08T14:30:00Z",
  },
]

// Mock Reports - simplified to 2 features with 2 reports each
// Metrics are now calculated on-demand from agent runs
export const MOCK_REPORTS: Report[] = [
  // Feature 1 - One-Click Checkout
  {
    id: "rep-1-1",
    featureId: "feat-1",
    createdAt: "2025-01-11T09:00:00Z",
    baselineRunIds: ["run-1", "run-2", "run-3"],
    testRunIds: ["run-4", "run-5", "run-6", "run-7", "run-8"],
  },
  {
    id: "rep-1-2",
    featureId: "feat-1",
    createdAt: "2025-01-12T14:30:00Z",
    baselineRunIds: ["run-9", "run-10", "run-11"],
    testRunIds: ["run-12", "run-13"],
  },
  // Feature 2 - AI Product Recommendations
  {
    id: "rep-2-1",
    featureId: "feat-2",
    createdAt: "2025-01-09T11:00:00Z",
    baselineRunIds: ["run-14", "run-15", "run-16"],
    testRunIds: ["run-17", "run-18", "run-19", "run-20"],
  },
  {
    id: "rep-2-2",
    featureId: "feat-2",
    createdAt: "2025-01-10T16:00:00Z",
    baselineRunIds: ["run-21", "run-22"],
    testRunIds: ["run-23", "run-24", "run-25"],
  },
]

// Helper functions
export function getFeatureById(featureId: string): Feature | undefined {
  return MOCK_FEATURES.find((f) => f.id === featureId)
}

export function getReportsByFeature(featureId: string): Report[] {
  return MOCK_REPORTS.filter((r) => r.featureId === featureId)
}

export function getReportById(reportId: string): Report | undefined {
  return MOCK_REPORTS.find((r) => r.id === reportId)
}

export function getMetricsByCategory(metrics: MetricComparison[], category: string): MetricComparison[] {
  return metrics.filter((m) => m.category === category)
}

export function formatReportDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
