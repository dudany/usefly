"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Timeline } from "./timeline"
import { EventLog } from "./event-log"
import { mockReplaySessions } from "./mock-replay-data"

export function ReplayPlayer() {
  const [selectedSession, setSelectedSession] = useState(mockReplaySessions[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && currentTime < selectedSession.duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.5 / speed
          return next >= selectedSession.duration ? selectedSession.duration : next
        })
      }, 500)
    } else if (currentTime >= selectedSession.duration) {
      setIsPlaying(false)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentTime, selectedSession.duration, speed])

  const handlePlayPause = () => setIsPlaying(!isPlaying)
  const handleReset = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }
  const handleTimeChange = (time: number) => setCurrentTime(time)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentEvents = selectedSession.events.filter((e) => e.timestamp <= currentTime)
  const nextEvent = selectedSession.events.find((e) => e.timestamp > currentTime)

  return (
    <div className="space-y-6">
      {/* Session Selector */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Select Session</label>
            <Select
              value={selectedSession.id}
              onValueChange={(id) => {
                const session = mockReplaySessions.find((s) => s.id === id)
                if (session) {
                  setSelectedSession(session)
                  setCurrentTime(0)
                  setIsPlaying(false)
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-64 mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockReplaySessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.persona} - {session.platform} ({formatTime(session.duration)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{selectedSession.platform}</Badge>
            <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
              {selectedSession.successRate}% Success
            </Badge>
          </div>
        </div>
      </Card>

      {/* Video/Screen Mockup */}
      <Card className="p-0 bg-card border-border overflow-hidden">
        <div className="bg-muted/50 aspect-video flex items-center justify-center relative">
          {/* Mockup Screen */}
          <div className="w-full h-full bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center relative overflow-hidden">
            {/* Browser Chrome Mockup */}
            <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
              {/* Browser Header */}
              <div className="bg-muted-foreground/10 border-b border-border px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                <div className="flex-1 px-3 text-xs text-muted-foreground">https://app.example.com</div>
              </div>

              {/* Screen Content */}
              <div className="flex-1 p-8 flex flex-col justify-center items-center text-center">
                <div className="max-w-md">
                  <div className="w-16 h-16 bg-primary/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-lg"></div>
                  </div>
                  <h2 className="text-xl font-bold mb-2">Agent Replay Simulation</h2>
                  <p className="text-muted-foreground text-sm mb-6">{selectedSession.persona}</p>

                  {/* Current Event Display */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    {nextEvent ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Next Event</p>
                        <p className="font-medium capitalize">
                          {nextEvent.type}: {nextEvent.element}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {(nextEvent.timestamp - currentTime).toFixed(1)}s away
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Playback Complete</p>
                        <p className="font-medium text-emerald-500">Session Finished</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cursor Position Indicator (if available) */}
            {nextEvent && nextEvent.x !== undefined && (
              <div className="absolute pointer-events-none">
                <div
                  className="w-6 h-6 border-2 border-primary rounded-full opacity-60"
                  style={{
                    left: `${(nextEvent.x / 1080) * 100}%`,
                    top: `${(nextEvent.y / 720) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="w-2 h-2 bg-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Playback Controls */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-4">
          {/* Time and Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(selectedSession.duration)}</span>
            </div>
            <Timeline
              duration={selectedSession.duration}
              currentTime={currentTime}
              onTimeChange={handleTimeChange}
              events={selectedSession.events}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-transparent"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button onClick={handlePlayPause} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Speed Control */}
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number.parseFloat(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>

              {/* Volume Control */}
              <Button onClick={() => setIsMuted(!isMuted)} variant="outline" size="sm" className="h-8 w-8 p-0">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              {/* Fullscreen */}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Event Log */}
      <EventLog events={currentEvents} session={selectedSession} currentTime={currentTime} />
    </div>
  )
}
