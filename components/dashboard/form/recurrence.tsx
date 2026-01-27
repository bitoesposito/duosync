"use client"

import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

interface RecurrenceSectionProps {
    isRepeating: boolean
    recurrenceType: "daily" | "weekly" | null
    repeatDays: number[]
    recurrenceUntil: string
    date: string
    onRepeatingChange: (isRepeating: boolean) => void
    onRecurrenceTypeChange: (type: "daily" | "weekly") => void
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
    const { t } = useI18n()
    
    return (
        <div className="flex flex-col gap-0 pt-2 border-t border-border">
            <button
                type="button"
                onClick={() => onRepeatingChange(!isRepeating)}
                disabled={disabled}
                className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70 transition-opacity"
            >
                <label className="cursor-pointer text-muted-foreground text-xs font-medium uppercase pointer-events-none">
                    {t("intervals.recurrence.title")}
                </label>
                {isRepeating ? (
                    <ChevronUpIcon className="w-4 h-4 text-muted-foreground cursor-pointer" />
                ) : (
                    <ChevronDownIcon className="w-4 h-4 text-muted-foreground cursor-pointer" />
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
                        {(["daily", "weekly"] as const).map((type) => (
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
                                {t(`intervals.recurrence.${type}`)}
                            </button>
                        ))}
                    </div>

                    {/* Weekly Days */}
                    {recurrenceType === "weekly" && (
                        <div className="flex flex-col gap-3">
                            {/* Quick Toggles */}
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const weekdays = [1, 2, 3, 4, 5]
                                        const allWeekdaysSelected = weekdays.every(d => repeatDays.includes(d))
                                        if (allWeekdaysSelected) {
                                            // Deselect all weekdays
                                            onRepeatDaysChange(repeatDays.filter(d => !weekdays.includes(d)))
                                        } else {
                                            // Select all weekdays, keep weekends if selected
                                            const newDays = [...new Set([...repeatDays.filter(d => !weekdays.includes(d)), ...weekdays])].sort((a, b) => a - b)
                                            onRepeatDaysChange(newDays)
                                        }
                                    }}
                                    disabled={disabled}
                                    className={cn(
                                        "flex-1 h-7 text-[10px] font-medium uppercase transition-all rounded-sm border",
                                        [1, 2, 3, 4, 5].every(d => repeatDays.includes(d))
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                                    )}
                                >
                                    {t("intervals.recurrence.weekdays")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const weekend = [6, 7]
                                        const allWeekendSelected = weekend.every(d => repeatDays.includes(d))
                                        if (allWeekendSelected) {
                                            // Deselect all weekend days
                                            onRepeatDaysChange(repeatDays.filter(d => !weekend.includes(d)))
                                        } else {
                                            // Select all weekend days, keep weekdays if selected
                                            const newDays = [...new Set([...repeatDays.filter(d => !weekend.includes(d)), ...weekend])].sort((a, b) => a - b)
                                            onRepeatDaysChange(newDays)
                                        }
                                    }}
                                    disabled={disabled}
                                    className={cn(
                                        "flex-1 h-7 text-[10px] font-medium uppercase transition-all rounded-sm border",
                                        [6, 7].every(d => repeatDays.includes(d))
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                                    )}
                                >
                                    {t("intervals.recurrence.weekend")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allDays = [1, 2, 3, 4, 5, 6, 7]
                                        const allSelected = allDays.every(d => repeatDays.includes(d))
                                        if (allSelected) {
                                            // Deselect all
                                            onRepeatDaysChange([])
                                        } else {
                                            // Select all
                                            onRepeatDaysChange(allDays)
                                        }
                                    }}
                                    disabled={disabled}
                                    className={cn(
                                        "px-3 h-7 text-[10px] font-medium uppercase transition-all rounded-sm border",
                                        [1, 2, 3, 4, 5, 6, 7].every(d => repeatDays.includes(d))
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                                    )}
                                >
                                    {t("intervals.recurrence.all")}
                                </button>
                            </div>

                            {/* Individual Day Buttons */}
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
                                            "flex-1 w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors border border-transparent",
                                            repeatDays.includes(day)
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        {DAY_LABELS[i]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Until Date */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label htmlFor="until" className="text-[10px] text-muted-foreground uppercase">
                                {t("recurrence.until")} ({t("common.optional")})
                            </label>
                            {recurrenceUntil && (
                                <button
                                    type="button"
                                    onClick={() => onRecurrenceUntilChange("")}
                                    disabled={disabled}
                                    className="text-[10px] text-muted-foreground hover:text-foreground p-1 -mr-1"
                                    title={t("recurrence.removeUntil")}
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <input
                            id="until"
                            type="date"
                            value={recurrenceUntil}
                            onChange={(e) => onRecurrenceUntilChange(e.target.value)}
                            min={date}
                            disabled={disabled}
                            className="bg-transparent border-b border-border text-sm h-8 focus:outline-none focus:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {!recurrenceUntil && (
                            <p className="text-[10px] text-muted-foreground/70 italic">
                                {t("recurrence.infinite")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
