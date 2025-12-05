"use client"

import { ResponsiveSankey } from "@nivo/sankey"
import { useSankeyData } from "./use-sankey-data"
import { formatUrl, getFullDecodedUrl } from "@/components/runs/run-utils"
import type { SankeyData } from "@/types/api"

interface JourneySankeyProps {
  data?: SankeyData
}

export function JourneySankey({ data }: JourneySankeyProps) {
  // Use provided data or fall back to mock data
  const sankeyData = data || useSankeyData()

  if (!sankeyData || !sankeyData.nodes || sankeyData.nodes.length === 0) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center text-muted-foreground">
        <p>No journey data available</p>
      </div>
    )
  }

  // Transform backend data to match Nivo format
  // Backend: nodes with 'name', links with numeric source/target
  // Nivo expects: nodes with 'id', links with string source/target matching node IDs
  // Note: Filter out self-loops (circular links) as Nivo Sankey doesn't support them

  // Calculate self-loop counts (interactions on same page)
  const selfLoopCounts = new Map<number, number>()
  sankeyData.links.forEach(link => {
    if (link.source === link.target) {
      selfLoopCounts.set(link.source, (selfLoopCounts.get(link.source) || 0) + link.value)
    }
  })

  const transformedData = {
    nodes: sankeyData.nodes.map((node, index) => {
      const selfLoops = selfLoopCounts.get(index) || 0
      const nodeId = node.name || `node-${index}`

      // Use formatUrl to decode URLs properly (handles UTF-8 characters like Hebrew)
      const displayName = formatUrl(nodeId)

      return {
        id: nodeId,
        displayName, // For tooltip display
        decodedId: getFullDecodedUrl(nodeId), // Full decoded URL
        nodeLabel: selfLoops > 0
          ? `${displayName}\n(${selfLoops} interactions)`
          : displayName,
        ...node,
        selfLoops
      }
    }),
    links: sankeyData.links
      .filter(link => link.source !== link.target) // Remove self-loops
      .map(link => ({
        ...link,
        source: sankeyData.nodes[link.source]?.name || `node-${link.source}`,
        target: sankeyData.nodes[link.target]?.name || `node-${link.target}`
      }))
  }

  return (
    <div className="h-[500px] w-full">
      <ResponsiveSankey
        data={transformedData}
        margin={{ top: 40, right: 200, bottom: 40, left: 50 }}
        align="justify"
        colors={{ scheme: "category10" }}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
        nodeBorderRadius={3}
        linkOpacity={0.5}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={16}
        labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
        label={(node: any) => node.nodeLabel || node.id}
        nodeTooltip={({ node }: any) => (
          <div
            style={{
              background: "white",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              maxWidth: "300px",
            }}
          >
            <strong style={{ fontSize: "13px", wordBreak: "break-word" }}>
              {node.displayName || node.id}
            </strong>
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#666", wordBreak: "break-all" }}>
              {node.decodedId}
            </div>
            <div style={{ marginTop: "8px", fontSize: "12px" }}>
              <div>Total events: {node.event_count || node.visits}</div>
              <div>Visits: {node.visits}</div>
            </div>
          </div>
        )}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            translateX: 130,
            itemWidth: 100,
            itemHeight: 14,
            itemDirection: "right-to-left",
            itemsSpacing: 2,
            itemTextColor: "#999",
            symbolSize: 14,
          },
        ]}
      />
    </div>
  )
}
