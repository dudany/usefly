"use client"

import { ResponsiveSankey } from "@nivo/sankey"
import { useSankeyData } from "./use-sankey-data"

export function JourneySankey() {
  const sankeyData = useSankeyData()

  return (
    <div className="h-[500px] w-full">
      <ResponsiveSankey
        data={sankeyData}
        margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
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
        labelOrientation="vertical"
        labelPadding={16}
        labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
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
