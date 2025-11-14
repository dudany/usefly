export interface AgentRun {
  id: string
  persona: string
  personaType: "new-shopper" | "returning-user" | "admin-user" | "premium-user" | "guest"
  status: "success" | "error" | "anomaly" | "in-progress"
  timestamp: string
  duration: number
  platform: "web" | "mobile"
  stepsCompleted: number
  totalSteps: number
  errorType?: string
  reportId?: string
  variant?: "baseline" | "test"
  website: string
  // Nested metrics object
  metrics: {
    timeToValue: {
      minutes: number
      steps: number
    }
    onboarding: {
      completed: boolean
    }
    featureAdoption: {
      adopted: boolean
    }
  }
}

const personaLabels: Record<string, string> = {
  "new-shopper": "New Shopper",
  "returning-user": "Returning User",
  "admin-user": "Admin User",
  "premium-user": "Premium User",
  guest: "Guest User",
}

// Static mock data - no generation, pure JSON-like structure
// 2 features, 2 report dates each, with repeated personas to show aggregation
export const MOCK_AGENT_RUNS: AgentRun[] = [
  // Feature 1: One-Click Checkout - Report rep-1-1 - Baseline runs
  { id: "run-1", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T10:30:00Z", duration: 145, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-1-1", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 2.8, steps: 6 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-2", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T10:35:00Z", duration: 152, platform: "mobile", stepsCompleted: 12, totalSteps: 12, reportId: "rep-1-1", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 3.1, steps: 6 }, onboarding: { completed: true }, featureAdoption: { adopted: false } } },
  { id: "run-3", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-10T11:15:00Z", duration: 98, platform: "web", stepsCompleted: 10, totalSteps: 10, reportId: "rep-1-1", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 1.8, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },

  // Feature 1: One-Click Checkout - Report rep-1-1 - Test runs
  { id: "run-4", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T10:45:00Z", duration: 132, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-1-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.2, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-5", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T10:50:00Z", duration: 128, platform: "mobile", stepsCompleted: 12, totalSteps: 12, reportId: "rep-1-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.1, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-6", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T10:55:00Z", duration: 135, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-1-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.4, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-7", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-10T11:30:00Z", duration: 89, platform: "web", stepsCompleted: 10, totalSteps: 10, reportId: "rep-1-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 1.5, steps: 3 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-8", personaType: "returning-user", persona: "returning-user", status: "error", timestamp: "2025-01-10T11:35:00Z", duration: 45, platform: "mobile", stepsCompleted: 4, totalSteps: 10, errorType: "Network timeout", reportId: "rep-1-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 8.5, steps: 10 }, onboarding: { completed: false }, featureAdoption: { adopted: false } } },

  // Feature 1: One-Click Checkout - Report rep-1-2 - Baseline runs
  { id: "run-9", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-12T09:00:00Z", duration: 138, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-1-2", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 2.9, steps: 6 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-10", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-12T10:00:00Z", duration: 102, platform: "mobile", stepsCompleted: 10, totalSteps: 10, reportId: "rep-1-2", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 1.9, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: false } } },
  { id: "run-11", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-12T10:05:00Z", duration: 108, platform: "web", stepsCompleted: 10, totalSteps: 10, reportId: "rep-1-2", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 2.0, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },

  // Feature 1: One-Click Checkout - Report rep-1-2 - Test runs
  { id: "run-12", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-12T09:30:00Z", duration: 125, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-1-2", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.3, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-13", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-12T10:30:00Z", duration: 94, platform: "mobile", stepsCompleted: 10, totalSteps: 10, reportId: "rep-1-2", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 1.6, steps: 3 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },

  // Feature 2: AI Product Recommendations - Report rep-2-1 - Baseline runs
  { id: "run-14", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-09T10:00:00Z", duration: 152, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-2-1", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 3.2, steps: 7 }, onboarding: { completed: true }, featureAdoption: { adopted: false } } },
  { id: "run-15", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-09T10:05:00Z", duration: 148, platform: "mobile", stepsCompleted: 12, totalSteps: 12, reportId: "rep-2-1", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 3.0, steps: 6 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-16", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-09T11:00:00Z", duration: 105, platform: "web", stepsCompleted: 10, totalSteps: 10, reportId: "rep-2-1", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 2.1, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },

  // Feature 2: AI Product Recommendations - Report rep-2-1 - Test runs
  { id: "run-17", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-09T10:30:00Z", duration: 142, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-2-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.5, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-18", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-09T10:35:00Z", duration: 138, platform: "mobile", stepsCompleted: 12, totalSteps: 12, reportId: "rep-2-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.4, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-19", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-09T11:30:00Z", duration: 96, platform: "web", stepsCompleted: 10, totalSteps: 10, reportId: "rep-2-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 1.7, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-20", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-09T11:35:00Z", duration: 92, platform: "mobile", stepsCompleted: 10, totalSteps: 10, reportId: "rep-2-1", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 1.6, steps: 3 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },

  // Feature 2: AI Product Recommendations - Report rep-2-2 - Baseline runs
  { id: "run-21", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T15:00:00Z", duration: 155, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-2-2", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 3.3, steps: 7 }, onboarding: { completed: true }, featureAdoption: { adopted: false } } },
  { id: "run-22", personaType: "returning-user", persona: "returning-user", status: "anomaly", timestamp: "2025-01-10T16:00:00Z", duration: 188, platform: "mobile", stepsCompleted: 10, totalSteps: 10, reportId: "rep-2-2", variant: "baseline", website: "www.test.com", metrics: { timeToValue: { minutes: 4.2, steps: 8 }, onboarding: { completed: true }, featureAdoption: { adopted: false } } },

  // Feature 2: AI Product Recommendations - Report rep-2-2 - Test runs
  { id: "run-23", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T15:30:00Z", duration: 145, platform: "web", stepsCompleted: 12, totalSteps: 12, reportId: "rep-2-2", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.6, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-24", personaType: "new-shopper", persona: "new-shopper", status: "success", timestamp: "2025-01-10T15:35:00Z", duration: 142, platform: "mobile", stepsCompleted: 12, totalSteps: 12, reportId: "rep-2-2", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 2.5, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
  { id: "run-25", personaType: "returning-user", persona: "returning-user", status: "success", timestamp: "2025-01-10T16:30:00Z", duration: 98, platform: "web", stepsCompleted: 10, totalSteps: 10, reportId: "rep-2-2", variant: "test", website: "www.test.com", metrics: { timeToValue: { minutes: 1.7, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } } },
]

export function getPersonaLabel(personaType: string): string {
  return personaLabels[personaType] || personaType
}

export function getRunsByReportAndVariant(reportId: string, variant: "baseline" | "test"): AgentRun[] {
  return MOCK_AGENT_RUNS.filter((run) => run.reportId === reportId && run.variant === variant)
}

export interface PersonaAggregation {
  personaType: string
  personaLabel: string
  totalRuns: number
  successCount: number
  errorCount: number
  avgProgress: number
  avgDuration: number
  successRate: number
}
