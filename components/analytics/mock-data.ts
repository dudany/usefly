export interface AnalyticsMetric {
  label: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
}

export const dropOffData = [
  { step: "Landing", rate: 5, agents: 1000 },
  { step: "Signup", rate: 12, agents: 950 },
  { step: "Email Verify", rate: 8, agents: 835 },
  { step: "Profile Setup", rate: 15, agents: 767 },
  { step: "Payment", rate: 22, agents: 651 },
  { step: "Dashboard", rate: 3, agents: 507 },
]

export const conversionData = [
  { period: "Week 1", success: 65, failure: 35 },
  { period: "Week 2", success: 72, failure: 28 },
  { period: "Week 3", success: 68, failure: 32 },
  { period: "Week 4", success: 78, failure: 22 },
  { period: "Week 5", success: 82, failure: 18 },
  { period: "Week 6", success: 85, failure: 15 },
]

export const errorTypesData = [
  { name: "Form Validation Error", count: 234, percentage: 28 },
  { name: "Empty Filter Results", count: 189, percentage: 23 },
  { name: "Navigation Timeout", count: 156, percentage: 19 },
  { name: "Payment Processing Failed", count: 134, percentage: 16 },
  { name: "Data Loading Error", count: 98, percentage: 12 },
  { name: "Other", count: 34, percentage: 2 },
]

export const personaSuccessData = [
  { persona: "New Shopper", successRate: 65 },
  { persona: "Returning User", successRate: 82 },
  { persona: "Admin User", successRate: 91 },
  { persona: "Premium User", successRate: 88 },
  { persona: "Guest User", successRate: 52 },
]

export const metricsOverview: AnalyticsMetric[] = [
  {
    label: "Total Agent Runs",
    value: "2,847",
    change: 12,
    trend: "up",
  },
  {
    label: "Overall Success Rate",
    value: "76.4%",
    change: 3.2,
    trend: "up",
  },
  {
    label: "Avg. Session Duration",
    value: "2m 34s",
    change: -5,
    trend: "down",
  },
  {
    label: "Critical Errors",
    value: "48",
    change: -8,
    trend: "down",
  },
]
