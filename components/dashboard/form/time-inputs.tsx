"use client"

import { useEffect, useState, useMemo } from "react"
import { ClockIcon, ArrowRightIcon, CalendarIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import type { Interval } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { isStartTimeWithinInterval } from "@/lib/services/slot-finder.service"
import { cn } from "@/lib/utils"

interface TimeInputsProps {
    startTime: string
    endTime: string
    date: string
    onStartTimeChange: (value: string) => void
    onEndTimeChange: (value: string) => void
    onDateChange: (value: string) => void
    disabled?: boolean
    existingIntervals?: Interval[]
    onValidationChange?: (isValid: boolean) => void
}

export function TimeInputs({
    startTime,
    endTime,
    date,
    onStartTimeChange,
    onEndTimeChange,
    onDateChange,
    disabled,
    existingIntervals,
    onValidationChange,
}: TimeInputsProps) {
    const { user } = useAuth()
    const [mode, setMode] = useState<"duration" | "time">("duration")

    // Derived duration state
    const durationState = useMemo(() => {
        if (!startTime || !endTime) return { hours: 0, minutes: 0 }

        const [startH, startM] = startTime.split(":").map(Number)
        const [endH, endM] = endTime.split(":").map(Number)

        let startTotal = startH * 60 + startM
        let endTotal = endH * 60 + endM

        if (endTotal < startTotal) endTotal += 24 * 60 // Handle next day

        const diff = endTotal - startTotal
        return {
            hours: Math.floor(diff / 60),
            minutes: diff % 60
        }
    }, [startTime, endTime])

    // Simple validation
    const isValidTimeFormat = (time: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)

    // Check overlap
    const hasOverlap = user && existingIntervals && isStartTimeWithinInterval(startTime, existingIntervals, date, user.timezone || "UTC")

    useEffect(() => {
        const isValid =
            isValidTimeFormat(startTime) &&
            isValidTimeFormat(endTime) &&
            !hasOverlap

        onValidationChange?.(!!isValid)
    }, [startTime, endTime, hasOverlap, onValidationChange])

    const applyDuration = (addMinutes: number) => {
        if (!startTime) return
        const [h, m] = startTime.split(":").map(Number)
        const startTotal = h * 60 + m
        const endTotal = startTotal + addMinutes

        const endH = Math.floor(endTotal / 60) % 24
        const endM = endTotal % 60

        const newEndTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
        onEndTimeChange(newEndTime)
    }

    const setEndOfDay = () => {
        onEndTimeChange("23:59")
    }

    const handleDurationChange = (type: "hours" | "minutes", value: number) => {
        const currentMinutes = durationState.minutes
        const currentHours = durationState.hours

        let totalMinutes = 0
        if (type === "hours") {
            totalMinutes = value * 60 + currentMinutes
        } else {
            totalMinutes = currentHours * 60 + value
        }

        applyDuration(totalMinutes)
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Date Input */}
            <div className="flex flex-col gap-1">
                <label htmlFor="date" className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    Data
                </label>
                <div className="relative group">
                    <CalendarIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                        disabled={disabled}
                        className="w-full bg-background/50 border border-input rounded-md h-8 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        required
                    />
                </div>
            </div>

            <div className="flex items-start gap-3">
                {/* Start Time */}
                <div className="flex-1 flex flex-col gap-1">
                    <label htmlFor="startTime" className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        Inizio
                    </label>
                    <div className="relative group">
                        <ClockIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                        <input
                            id="startTime"
                            type="time"
                            value={startTime}
                            onChange={(e) => onStartTimeChange(e.target.value)}
                            disabled={disabled}
                            className={cn(
                                "w-full bg-background/50 border border-input rounded-md h-8 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all",
                                hasOverlap && "border-destructive text-destructive focus:ring-destructive"
                            )}
                            required
                        />
                    </div>
                    {hasOverlap && (
                        <p className="text-[10px] text-destructive pt-1 font-medium">Overlap detected</p>
                    )}
                </div>
            </div>

            {/* Duration Section */}
            <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                    <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" /> Durata
                    </label>
                </div>

                {/* Toggle */}
                <div className="flex p-0.5 bg-muted/30 rounded-md border border-border/50">
                    <button
                        type="button"
                        onClick={() => setMode("duration")}
                        className={cn(
                            "flex-1 text-[10px] uppercase tracking-wider py-1 font-semibold rounded-sm transition-all",
                            mode === "duration"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        Durata
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("time")}
                        className={cn(
                            "flex-1 text-[10px] uppercase tracking-wider py-1 font-semibold rounded-sm transition-all",
                            mode === "time"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        Fine
                    </button>
                </div>

                {mode === "time" ? (
                    <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                        <ClockIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            id="endTime"
                            type="time"
                            value={endTime}
                            onChange={(e) => onEndTimeChange(e.target.value)}
                            disabled={disabled}
                            className="w-full bg-background/50 border border-input rounded-md h-8 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                            required
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Hours / Minutes Inputs */}
                        <div className="flex gap-2">
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wider">Ore</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={durationState.hours}
                                        onChange={(e) => handleDurationChange("hours", parseInt(e.target.value) || 0)}
                                        className="w-full bg-background/50 border border-input rounded-md h-8 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                    />
                                    <div className="absolute right-1 top-1 flex flex-col scale-90">
                                        <button type="button" onClick={() => handleDurationChange("hours", durationState.hours + 1)} className="p-0.5 hover:text-primary text-muted-foreground"><ChevronUpIcon className="w-2 h-2" /></button>
                                        <button type="button" onClick={() => handleDurationChange("hours", Math.max(0, durationState.hours - 1))} className="p-0.5 hover:text-primary text-muted-foreground"><ChevronDownIcon className="w-2 h-2" /></button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wider">Minuti</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        step="5"
                                        value={durationState.minutes}
                                        onChange={(e) => handleDurationChange("minutes", parseInt(e.target.value) || 0)}
                                        className="w-full bg-background/50 border border-input rounded-md h-8 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                    />
                                    <div className="absolute right-1 top-1 flex flex-col scale-90">
                                        <button type="button" onClick={() => handleDurationChange("minutes", durationState.minutes + 5)} className="p-0.5 hover:text-primary text-muted-foreground"><ChevronUpIcon className="w-2 h-2" /></button>
                                        <button type="button" onClick={() => handleDurationChange("minutes", Math.max(0, durationState.minutes - 5))} className="p-0.5 hover:text-primary text-muted-foreground"><ChevronDownIcon className="w-2 h-2" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wider mb-1">Preset Rapidi</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => applyDuration(60)}
                                    className="py-1 text-[10px] font-medium uppercase tracking-wide bg-muted/40 hover:bg-muted border border-border/50 hover:border-border rounded-sm transition-all"
                                >
                                    1h
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyDuration(120)}
                                    className="py-1 text-[10px] font-medium uppercase tracking-wide bg-muted/40 hover:bg-muted border border-border/50 hover:border-border rounded-sm transition-all"
                                >
                                    2h
                                </button>
                                <button
                                    type="button"
                                    onClick={setEndOfDay}
                                    className="col-span-2 py-1 text-[10px] font-medium uppercase tracking-wide bg-muted/40 hover:bg-muted border border-border/50 hover:border-border rounded-sm transition-all"
                                >
                                    Fine giornata
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
