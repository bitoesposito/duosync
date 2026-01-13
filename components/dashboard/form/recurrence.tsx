"use client"

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecurrenceSectionProps {
    isRepeating: boolean
    recurrenceType: "daily" | "weekly" | "monthly" | null
    repeatDays: number[]
    recurrenceUntil: string
    date: string
    onRepeatingChange: (isRepeating: boolean) => void
    onRecurrenceTypeChange: (type: "daily" | "weekly" | "monthly") => void
    onRepeatDaysChange: (days: number[]) => void
    onRecurrenceUntilChange: (date: string) => void
    disabled?: boolean
}

const DAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"]
const DAY_IDS = [1, 2, 3, 4, 5, 6, 7]

export function RecurrenceSection({
    isRepeating,
    recurrenceType,
    repeatDays,
    recurrenceUntil,
    date,
    onRepeatingChange,
    onRecurrenceTypeChange,
    onRepeatDaysChange,
    onRecurrenceUntilChange,
    disabled,
}: RecurrenceSectionProps) {
    return (
        <div className="flex flex-col gap-0 pt-2 border-t border-border">
            <button
                type="button"
                onClick={() => onRepeatingChange(!isRepeating)}
                disabled={disabled}
                className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70 transition-opacity"
            >
                <label className="cursor-pointer text-muted-foreground text-xs font-medium uppercase pointer-events-none">
                    Recurrence
                </label>
                {isRepeating ? (
                    <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            <div
                className={cn(
                    "overflow-hidden transition-all duration-200 ease-in-out",
                    isRepeating ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="flex flex-col gap-4 pt-1 pb-2">
                    {/* Type Selector */}
                    <div className="bg-muted/30 p-0.5 flex">
                        {(["daily", "weekly", "monthly"] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onRecurrenceTypeChange(type)}
                                disabled={disabled}
                                className={cn(
                                    "flex-1 h-8 text-xs font-medium uppercase transition-all",
                                    recurrenceType === type
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Weekly Days */}
                    {recurrenceType === "weekly" && (
                        <div className="flex justify-between gap-1">
                            {DAY_IDS.map((day, i) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                        const newDays = repeatDays.includes(day)
                                            ? repeatDays.filter((d) => d !== day)
                                            : [...repeatDays, day]
                                                // sort
                                                .sort((a, b) => a - b)
                                        onRepeatDaysChange(newDays)
                                    }}
                                    disabled={disabled}
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors border border-transparent",
                                        repeatDays.includes(day)
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {DAY_LABELS[i]}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Monthly Info */}
                    {recurrenceType === "monthly" && (
                        <div className="text-xs text-muted-foreground p-3 bg-muted/30 border border-dashed border-border text-center">
                            On day {new Date(date).getDate()} of every month
                        </div>
                    )}

                    {/* Until Date */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="until" className="text-[10px] text-muted-foreground uppercase">Ends on (Optional)</label>
                        <input
                            id="until"
                            type="date"
                            value={recurrenceUntil}
                            onChange={(e) => onRecurrenceUntilChange(e.target.value)}
                            min={date}
                            className="bg-transparent border-b border-border text-sm h-8 focus:outline-none focus:border-foreground"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
