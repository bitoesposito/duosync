"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { TimelineSegmentCategory } from "@/types"

interface TimelineSegmentProps {
    start: string // HH:mm
    end: string // HH:mm
    category: TimelineSegmentCategory
    className?: string
}

const colorMap: Record<TimelineSegmentCategory, string> = {
    match: "bg-[#10b981]", // Emerald 500
    available: "bg-[#10b981]", // Emerald 500
    sleep: "bg-[#8b5cf6]", // Violet 500
    busy: "bg-zinc-700", // Zinc 700 (Occupied)
    other: "bg-zinc-700", // Fallback
}

export function TimelineSegment({ start, end, category, className }: TimelineSegmentProps) {
    const style = useMemo(() => {
        const [startH, startM] = start.split(":").map(Number)
        const [endH, endM] = end.split(":").map(Number)

        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM
        const totalMinutes = 24 * 60

        const left = (startMinutes / totalMinutes) * 100
        const width = ((endMinutes - startMinutes) / totalMinutes) * 100

        return {
            left: `${left}%`,
            width: `${width}%`,
        }
    }, [start, end])

    return (
        <div
            className={cn(
                "absolute h-full transition-all duration-200",
                colorMap[category],
                className
            )}
            style={style}
            title={`${category} ${start}-${end}`}
        />
    )
}
