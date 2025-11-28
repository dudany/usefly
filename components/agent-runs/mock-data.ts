export interface FrictionPoint {
  step: string
  type: string
  duration: number
}

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
  location: string
  journeyPath: string[]
  goalsAchieved: string[]
  frictionPoints: FrictionPoint[]
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

// Journey node constants
export const JOURNEY_NODES = [
  "Homepage",
  "Product Search",
  "Product Page",
  "Add to Cart",
  "Cart",
  "Checkout",
  "Payment",
  "Confirmation",
] as const

// Static mock data - no generation, pure JSON-like structure
// 2 features, 2 report dates each, with repeated personas to show aggregation
export const MOCK_AGENT_RUNS: AgentRun[] = [
  // Feature 1: One-Click Checkout - Report rep-1-1 - Baseline runs
  {
    id: "run-1",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "success",
    timestamp: "2025-01-10T10:30:00Z",
    duration: 145,
    platform: "web",
    stepsCompleted: 12,
    totalSteps: 12,
    reportId: "rep-1-1",
    variant: "baseline",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [
      { step: "Checkout", type: "Form validation error", duration: 12 }
    ],
    metrics: { timeToValue: { minutes: 2.8, steps: 6 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
  {
    id: "run-2",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-10T10:35:00Z",
    duration: 42,
    platform: "mobile",
    stepsCompleted: 2,
    totalSteps: 12,
    errorType: "Product not found",
    reportId: "rep-1-1",
    variant: "baseline",
    website: "www.test.com",
    location: "UK",
    journeyPath: ["Homepage", "Product Search"],
    goalsAchieved: [],
    frictionPoints: [
      { step: "Product Search", type: "Multiple attempts", duration: 35 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-3",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-10T11:15:00Z",
    duration: 98,
    platform: "web",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-1-1",
    variant: "baseline",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 1.8, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },

  // Feature 1: One-Click Checkout - Report rep-1-1 - Test runs
  {
    id: "run-4",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "success",
    timestamp: "2025-01-10T10:45:00Z",
    duration: 132,
    platform: "web",
    stepsCompleted: 12,
    totalSteps: 12,
    reportId: "rep-1-1",
    variant: "test",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 2.2, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
  {
    id: "run-5",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-10T10:50:00Z",
    duration: 58,
    platform: "mobile",
    stepsCompleted: 3,
    totalSteps: 12,
    errorType: "User abandoned",
    reportId: "rep-1-1",
    variant: "test",
    website: "www.test.com",
    location: "UK",
    journeyPath: ["Homepage", "Product Search", "Product Page"],
    goalsAchieved: ["Viewed Product"],
    frictionPoints: [
      { step: "Product Page", type: "Long hesitation", duration: 45 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-6",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-10T10:55:00Z",
    duration: 78,
    platform: "web",
    stepsCompleted: 5,
    totalSteps: 12,
    errorType: "Cart abandoned",
    reportId: "rep-1-1",
    variant: "test",
    website: "www.test.com",
    location: "CA",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart"],
    goalsAchieved: ["Viewed Product", "Added to Cart"],
    frictionPoints: [
      { step: "Cart", type: "Unexpected shipping cost", duration: 25 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-7",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-10T11:30:00Z",
    duration: 89,
    platform: "web",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-1-1",
    variant: "test",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 1.5, steps: 3 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
  {
    id: "run-8",
    personaType: "returning-user",
    persona: "returning-user",
    status: "error",
    timestamp: "2025-01-10T11:35:00Z",
    duration: 45,
    platform: "mobile",
    stepsCompleted: 4,
    totalSteps: 10,
    errorType: "Network timeout",
    reportId: "rep-1-1",
    variant: "test",
    website: "www.test.com",
    location: "UK",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart"],
    goalsAchieved: ["Viewed Product", "Added to Cart"],
    frictionPoints: [
      { step: "Cart", type: "Network timeout", duration: 30 }
    ],
    metrics: { timeToValue: { minutes: 8.5, steps: 10 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },

  // Feature 1: One-Click Checkout - Report rep-1-2 - Baseline runs
  {
    id: "run-9",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-12T09:00:00Z",
    duration: 112,
    platform: "web",
    stepsCompleted: 6,
    totalSteps: 12,
    errorType: "Checkout abandoned",
    reportId: "rep-1-2",
    variant: "baseline",
    website: "www.test.com",
    location: "DE",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart", "Checkout"],
    goalsAchieved: ["Viewed Product", "Added to Cart"],
    frictionPoints: [
      { step: "Checkout", type: "Form validation error", duration: 35 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-10",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-12T10:00:00Z",
    duration: 102,
    platform: "mobile",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-1-2",
    variant: "baseline",
    website: "www.test.com",
    location: "FR",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 1.9, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-11",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-12T10:05:00Z",
    duration: 108,
    platform: "web",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-1-2",
    variant: "baseline",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase", "Subscribed to Newsletter"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 2.0, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },

  // Feature 1: One-Click Checkout - Report rep-1-2 - Test runs
  {
    id: "run-12",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "success",
    timestamp: "2025-01-12T09:30:00Z",
    duration: 125,
    platform: "web",
    stepsCompleted: 12,
    totalSteps: 12,
    reportId: "rep-1-2",
    variant: "test",
    website: "www.test.com",
    location: "DE",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 2.3, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
  {
    id: "run-13",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-12T10:30:00Z",
    duration: 94,
    platform: "mobile",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-1-2",
    variant: "test",
    website: "www.test.com",
    location: "FR",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 1.6, steps: 3 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },

  // Feature 2: AI Product Recommendations - Report rep-2-1 - Baseline runs
  {
    id: "run-14",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-09T10:00:00Z",
    duration: 142,
    platform: "web",
    stepsCompleted: 7,
    totalSteps: 12,
    errorType: "Payment abandoned",
    reportId: "rep-2-1",
    variant: "baseline",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment"],
    goalsAchieved: ["Viewed Product", "Added to Cart"],
    frictionPoints: [
      { step: "Product Search", type: "Multiple attempts", duration: 22 },
      { step: "Payment", type: "Credit card error", duration: 48 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-15",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-09T10:05:00Z",
    duration: 35,
    platform: "mobile",
    stepsCompleted: 2,
    totalSteps: 12,
    errorType: "No results found",
    reportId: "rep-2-1",
    variant: "baseline",
    website: "www.test.com",
    location: "UK",
    journeyPath: ["Homepage", "Product Search"],
    goalsAchieved: [],
    frictionPoints: [
      { step: "Product Search", type: "No results found", duration: 28 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-16",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-09T11:00:00Z",
    duration: 105,
    platform: "web",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-2-1",
    variant: "baseline",
    website: "www.test.com",
    location: "CA",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 2.1, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },

  // Feature 2: AI Product Recommendations - Report rep-2-1 - Test runs
  {
    id: "run-17",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "success",
    timestamp: "2025-01-09T10:30:00Z",
    duration: 142,
    platform: "web",
    stepsCompleted: 12,
    totalSteps: 12,
    reportId: "rep-2-1",
    variant: "test",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [
      { step: "Payment", type: "Hesitation on step", duration: 10 }
    ],
    metrics: { timeToValue: { minutes: 2.5, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
  {
    id: "run-18",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-09T10:35:00Z",
    duration: 52,
    platform: "mobile",
    stepsCompleted: 3,
    totalSteps: 12,
    errorType: "Not interested",
    reportId: "rep-2-1",
    variant: "test",
    website: "www.test.com",
    location: "UK",
    journeyPath: ["Homepage", "Product Search", "Product Page"],
    goalsAchieved: ["Viewed Product"],
    frictionPoints: [
      { step: "Product Page", type: "Price too high", duration: 18 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-19",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-09T11:30:00Z",
    duration: 96,
    platform: "web",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-2-1",
    variant: "test",
    website: "www.test.com",
    location: "CA",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 1.7, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
  {
    id: "run-20",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-09T11:35:00Z",
    duration: 92,
    platform: "mobile",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-2-1",
    variant: "test",
    website: "www.test.com",
    location: "US",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 1.6, steps: 3 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },

  // Feature 2: AI Product Recommendations - Report rep-2-2 - Baseline runs
  {
    id: "run-21",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-10T15:00:00Z",
    duration: 88,
    platform: "web",
    stepsCompleted: 5,
    totalSteps: 12,
    errorType: "Cart abandoned",
    reportId: "rep-2-2",
    variant: "baseline",
    website: "www.test.com",
    location: "DE",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart"],
    goalsAchieved: ["Viewed Product", "Added to Cart"],
    frictionPoints: [
      { step: "Product Search", type: "Multiple attempts", duration: 25 },
      { step: "Cart", type: "Shipping cost too high", duration: 32 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-22",
    personaType: "returning-user",
    persona: "returning-user",
    status: "anomaly",
    timestamp: "2025-01-10T16:00:00Z",
    duration: 188,
    platform: "mobile",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-2-2",
    variant: "baseline",
    website: "www.test.com",
    location: "FR",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [
      { step: "Checkout", type: "Hesitation on step", duration: 45 },
      { step: "Payment", type: "Multiple attempts", duration: 38 }
    ],
    metrics: { timeToValue: { minutes: 4.2, steps: 8 }, onboarding: { completed: true }, featureAdoption: { adopted: false } }
  },

  // Feature 2: AI Product Recommendations - Report rep-2-2 - Test runs
  {
    id: "run-23",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "success",
    timestamp: "2025-01-10T15:30:00Z",
    duration: 145,
    platform: "web",
    stepsCompleted: 12,
    totalSteps: 12,
    reportId: "rep-2-2",
    variant: "test",
    website: "www.test.com",
    location: "DE",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 2.6, steps: 5 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
  {
    id: "run-24",
    personaType: "new-shopper",
    persona: "new-shopper",
    status: "error",
    timestamp: "2025-01-10T15:35:00Z",
    duration: 48,
    platform: "mobile",
    stepsCompleted: 5,
    totalSteps: 12,
    errorType: "Cart abandoned",
    reportId: "rep-2-2",
    variant: "test",
    website: "www.test.com",
    location: "UK",
    journeyPath: ["Homepage", "Product Search", "Product Page", "Add to Cart", "Cart"],
    goalsAchieved: ["Viewed Product", "Added to Cart"],
    frictionPoints: [
      { step: "Cart", type: "Changed mind", duration: 22 }
    ],
    metrics: { timeToValue: { minutes: 0, steps: 0 }, onboarding: { completed: false }, featureAdoption: { adopted: false } }
  },
  {
    id: "run-25",
    personaType: "returning-user",
    persona: "returning-user",
    status: "success",
    timestamp: "2025-01-10T16:30:00Z",
    duration: 98,
    platform: "web",
    stepsCompleted: 10,
    totalSteps: 10,
    reportId: "rep-2-2",
    variant: "test",
    website: "www.test.com",
    location: "CA",
    journeyPath: ["Homepage", "Product Page", "Add to Cart", "Cart", "Checkout", "Payment", "Confirmation"],
    goalsAchieved: ["Viewed Product", "Added to Cart", "Completed Purchase"],
    frictionPoints: [],
    metrics: { timeToValue: { minutes: 1.7, steps: 4 }, onboarding: { completed: true }, featureAdoption: { adopted: true } }
  },
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
