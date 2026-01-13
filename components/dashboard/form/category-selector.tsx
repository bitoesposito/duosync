"use client"

import { MoonIcon, CalendarIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type Category = "sleep" | "busy" | "other"

interface CategorySelectorProps {
    selectedCategory: Category
    onCategoryChange: (category: Category) => void
    disabled?: boolean
}

export function CategorySelector({
    selectedCategory,
    onCategoryChange,
    disabled,
}: CategorySelectorProps) {
    return (
        <div className="flex gap-1.5 p-0.5 bg-muted/30">
            <button
                type="button"
                onClick={() => onCategoryChange("other")}
                disabled={disabled}
                className={cn(
                    "flex-1 gap-1.5 rounded-sm border border-transparent h-8 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center transition-all",
                    selectedCategory === "other"
                        ? "border-primary/20 text-primary bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <CalendarIcon className="w-3.5 h-3.5" />
                Other
            </button>
            <button
                type="button"
                onClick={() => onCategoryChange("busy")}
                disabled={disabled}
                className={cn(
                    "flex-1 gap-1.5 rounded-sm border border-transparent h-8 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center transition-all",
                    selectedCategory === "busy"
                        ? "border-primary/20 text-primary bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <ClockIcon className="w-3.5 h-3.5" />
                Busy
            </button>
            <button
                type="button"
                onClick={() => onCategoryChange("sleep")}
                disabled={disabled}
                className={cn(
                    "flex-1 gap-1.5 rounded-sm border border-transparent h-8 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center transition-all",
                    selectedCategory === "sleep"
                        ? "border-primary/20 text-primary bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <MoonIcon className="w-3.5 h-3.5" />
                Sleep
            </button>
        </div>
    )
}
