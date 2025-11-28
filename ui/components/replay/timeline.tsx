"use client"

import type React from "react"

import { useRef, useState } from "react"
import type { ReplayEvent } from "./mock-replay-data"

interface TimelineProps {
  duration: number
  currentTime: number
  onTimeChange: (time: number) => void
  events: ReplayEvent[]
}

export function Timeline({ duration, currentTime, onTimeChange, events }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    updateTime(e)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) updateTime(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const updateTime = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    onTimeChange(percentage * duration)
  }

  const progressPercentage = (currentTime / duration) * 100

  return (
    <div
      ref={containerRef}
      className="relative h-8 bg-muted rounded-lg overflow-hidden cursor-pointer group"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Event Markers */}
      {events.map((event, idx) => {
        const position = (event.timestamp / duration) * 100
        const colors: Record<string, string> = {
          click: "bg-blue-500",
          scroll: "bg-teal-500",
          input: "bg-purple-500",
          navigate: "bg-amber-500",
          error: "bg-red-500",
          load: "bg-emerald-500",
        }
        return (
          <div
            key={idx}
            className={`absolute top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 rounded-full ${colors[event.type] || "bg-gray-500"} opacity-60 hover:opacity-100`}
            style={{ left: `${position}%` }}
            title={`${event.type}: ${event.element}`}
          ></div>
        )
      })}

      {/* Progress Bar */}
      <div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent transition-all"
        style={{ width: `${progressPercentage}%` }}
      ></div>

      {/* Scrubber Head */}
      <div
        className="absolute top-1/2 w-4 h-6 bg-background border-2 border-primary rounded-md transform -translate-y-1/2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `calc(${progressPercentage}% - 8px)` }}
      ></div>
    </div>
  )
}
