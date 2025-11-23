"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MOCK_METRICS, METRIC_CATEGORIES, type Metric } from "./mock-metrics"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

interface MetricsTableProps {
  onMetricSelect: (metric: Metric | null) => void
  selectedMetricId: string | null
}

export function MetricsTable({ onMetricSelect, selectedMetricId }: MetricsTableProps) {
  const handleRowClick = (metric: Metric) => {
    if (selectedMetricId === metric.id) {
      onMetricSelect(null)
    } else {
      onMetricSelect(metric)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="min-w-[200px]">Metric Name</TableHead>
              <TableHead className="min-w-[300px]">Description</TableHead>
              <TableHead className="min-w-[150px]">Category</TableHead>
              <TableHead className="w-[100px] text-center">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_METRICS.map((metric) => {
              const isSelected = selectedMetricId === metric.id
              const categoryInfo = METRIC_CATEGORIES[metric.category]

              return (
                <TableRow
                  key={metric.id}
                  onClick={() => handleRowClick(metric)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-accent/50"
                  )}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{metric.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {metric.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoryInfo.color}>
                      {categoryInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {metric.priority}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
