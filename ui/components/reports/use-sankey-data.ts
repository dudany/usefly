import sankeyDataJson from "./sankey-data.json"

export interface SankeyNode {
  id: string
  totalVisits?: number
  errorCount?: number
  frictionCount?: number
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export function useSankeyData(): SankeyData {
  return sankeyDataJson
}
