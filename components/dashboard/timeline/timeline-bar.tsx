"use client"

import { cn } from "@/lib/utils"

interface TimelineBarProps {
    children: React.ReactNode
    className?: string
}

export function TimelineBar({ children, className }: TimelineBarProps) {
    return (
        <div
            className={cn(
                "relative w-full h-12 bg-zinc-900 overflow-hidden rounded-sm border border-zinc-800",
                className
            )}
        >
            {children}
            {/* Optional grid lines for visual reference (every 6 hours) */}
            <div className="absolute inset-0 pointer-events-none flex">
                <div className="flex-1 border-r border-white/5" />
                <div className="flex-1 border-r border-white/5" />
                <div className="flex-1 border-r border-white/5" />
                <div className="flex-1" />
            </div>
        </div>
    )
}
