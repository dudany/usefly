import type { AgentRun } from "@/components/agent-runs/mock-data"

export interface JourneyAggregation {
  segment: string
  location?: string
  persona?: string
  totalRuns: number
  goalsAchievedPercent: number
  errorsPercent: number
  frictionPercent: number
}

/**
 * Aggregate runs by segment (location and/or persona) for journey table
 */
export function aggregateBySegment(
  runs: AgentRun[],
  groupByLocation: boolean,
  groupByPersona: boolean
): JourneyAggregation[] {
  if (runs.length === 0) {
    return []
  }

  // Create grouping key based on what we're grouping by
  const groupMap = new Map<string, AgentRun[]>()

  runs.forEach((run) => {
    let key = ""
    let location: string | undefined
    let persona: string | undefined

    if (groupByLocation && groupByPersona) {
      key = `${run.location}-${run.personaType}`
      location = run.location
      persona = run.personaType
    } else if (groupByLocation) {
      key = run.location
      location = run.location
    } else if (groupByPersona) {
      key = run.personaType
      persona = run.personaType
    } else {
      // No grouping, treat all as one segment
      key = "all"
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, [])
    }
    groupMap.get(key)!.push(run)
  })

  // Calculate aggregations for each segment
  const aggregations: JourneyAggregation[] = Array.from(groupMap.entries()).map(([key, segmentRuns]) => {
    const totalRuns = segmentRuns.length

    // Calculate goals achieved percentage
    // A run achieves goals if it has at least one goal achieved
    const runsWithGoals = segmentRuns.filter((r) => r.goalsAchieved.length > 0).length
    const goalsAchievedPercent = (runsWithGoals / totalRuns) * 100

    // Calculate errors percentage
    const runsWithErrors = segmentRuns.filter((r) => r.status === "error").length
    const errorsPercent = (runsWithErrors / totalRuns) * 100

    // Calculate friction percentage
    const runsWithFriction = segmentRuns.filter((r) => r.frictionPoints.length > 0).length
    const frictionPercent = (runsWithFriction / totalRuns) * 100

    // Build segment label
    let segment = ""
    const location = groupByLocation ? segmentRuns[0].location : undefined
    const persona = groupByPersona ? segmentRuns[0].personaType : undefined

    if (location && persona) {
      segment = `${location} - ${formatPersona(persona)}`
    } else if (location) {
      segment = location
    } else if (persona) {
      segment = formatPersona(persona)
    } else {
      segment = "All Runs"
    }

    return {
      segment,
      location,
      persona,
      totalRuns,
      goalsAchievedPercent: Number(goalsAchievedPercent.toFixed(1)),
      errorsPercent: Number(errorsPercent.toFixed(1)),
      frictionPercent: Number(frictionPercent.toFixed(1)),
    }
  })

  // Sort by segment name
  return aggregations.sort((a, b) => a.segment.localeCompare(b.segment))
}

/**
 * Format persona type for display
 */
function formatPersona(persona: string): string {
  return persona
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Get color class based on percentage value
 * For goals: green (>80%), yellow (40-80%), red (<40%)
 * For errors/friction: green (<20%), yellow (20-40%), red (>40%)
 */
export function getPercentageColor(value: number, higherIsBetter: boolean): string {
  if (higherIsBetter) {
    if (value >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (value >= 40) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  } else {
    if (value < 20) return "text-emerald-600 dark:text-emerald-400"
    if (value < 40) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }
}
