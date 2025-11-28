"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { MOCK_AGENT_RUNS } from "@/components/agent-runs/mock-data"
import { useSegments, type SegmentOption } from "@/components/providers/segments-provider"

export function SegmentsFilter() {
  const {
    selectedSegments,
    toggleSegment,
    isSegmentSelected,
    removeSegment,
    clearAllSegments
  } = useSegments()

  const [segmentPopoverOpen, setSegmentPopoverOpen] = useState(false)

  // Get all available segment options
  const availableSegmentOptions = useMemo(() => {
    const options: SegmentOption[] = []

    // Location options
    const locations = new Set(MOCK_AGENT_RUNS.map((run) => run.location))
    Array.from(locations).sort().forEach((loc) => {
      options.push({
        type: "location",
        value: loc,
        label: loc.charAt(0).toUpperCase() + loc.slice(1)
      })
    })

    // Platform options
    const platforms = new Set(MOCK_AGENT_RUNS.map((run) => run.platform))
    Array.from(platforms).sort().forEach((plat) => {
      options.push({
        type: "platform",
        value: plat,
        label: plat.charAt(0).toUpperCase() + plat.slice(1)
      })
    })

    // Status options
    const statuses = new Set(MOCK_AGENT_RUNS.map((run) => run.status))
    Array.from(statuses).sort().forEach((stat) => {
      options.push({
        type: "status",
        value: stat,
        label: stat.charAt(0).toUpperCase() + stat.slice(1)
      })
    })

    return options
  }, [])

  // Group options by type for display
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SegmentOption[]> = {
      location: [],
      platform: [],
      status: []
    }

    availableSegmentOptions.forEach((option) => {
      groups[option.type].push(option)
    })

    return groups
  }, [availableSegmentOptions])

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">Segments</label>
      <Popover open={segmentPopoverOpen} onOpenChange={setSegmentPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={segmentPopoverOpen}
            className="w-full justify-between h-9 font-normal"
          >
            {selectedSegments.length === 0 ? (
              <span className="text-muted-foreground">All Segments</span>
            ) : (
              <span className="text-sm">
                {selectedSegments.length} selected
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search segments..." />
            <CommandList>
              <CommandEmpty>No segments found.</CommandEmpty>

              {/* Location Group */}
              <CommandGroup heading="Location">
                {groupedOptions.location.map((option) => {
                  const isSelected = isSegmentSelected(option)
                  return (
                    <CommandItem
                      key={`${option.type}-${option.value}`}
                      onSelect={() => toggleSegment(option)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        className="mr-2"
                      />
                      <span>{option.label}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {/* Platform Group */}
              <CommandGroup heading="Platform">
                {groupedOptions.platform.map((option) => {
                  const isSelected = isSegmentSelected(option)
                  return (
                    <CommandItem
                      key={`${option.type}-${option.value}`}
                      onSelect={() => toggleSegment(option)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        className="mr-2"
                      />
                      <span>{option.label}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {/* Status Group */}
              <CommandGroup heading="Status">
                {groupedOptions.status.map((option) => {
                  const isSelected = isSegmentSelected(option)
                  return (
                    <CommandItem
                      key={`${option.type}-${option.value}`}
                      onSelect={() => toggleSegment(option)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        className="mr-2"
                      />
                      <span>{option.label}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          {selectedSegments.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllSegments}
                className="w-full"
              >
                Clear all
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected Segments Display */}
      {selectedSegments.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedSegments.map((segment) => (
            <Badge
              key={`${segment.type}-${segment.value}`}
              variant="secondary"
              className="text-xs gap-1"
            >
              <span className="text-muted-foreground capitalize">{segment.type}:</span>
              {segment.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeSegment(segment)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
