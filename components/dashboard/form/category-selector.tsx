"use client"

import { MoonIcon, CalendarIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

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
    const { t } = useI18n()
    
    return (
        <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                {t("intervals.create.category")}
            </label>
            <div className="flex gap-1.5 p-0.5 bg-muted/30">
            <button
                type="button"
                onClick={() => onCategoryChange("busy")}
                disabled={disabled}
                className={cn(
                    "px-3 gap-1.5 rounded-sm border border-transparent h-8 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center transition-all",
                    selectedCategory === "busy"
                        ? "border-primary/20 text-primary bg-background shadow-sm flex-1"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <ClockIcon className="w-3.5 h-3.5" />
                {selectedCategory === "busy" && t("intervals.categories.busy")}
            </button>
            <button
                type="button"
                onClick={() => onCategoryChange("sleep")}
                disabled={disabled}
                className={cn(
                    "px-3 gap-1.5 rounded-sm border border-transparent h-8 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center transition-all",
                    selectedCategory === "sleep"
                        ? "border-primary/20 text-primary bg-background shadow-sm flex-1"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <MoonIcon className="w-3.5 h-3.5" />
                {selectedCategory === "sleep" && t("intervals.categories.sleep")}
            </button>
            <button
                type="button"
                onClick={() => onCategoryChange("other")}
                disabled={disabled}
                className={cn(
                    "px-3 gap-1.5 rounded-sm border border-transparent h-8 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center transition-all",
                    selectedCategory === "other"
                        ? "border-primary/20 text-primary bg-background shadow-sm flex-1"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <CalendarIcon className="w-3.5 h-3.5" />
                {selectedCategory === "other" && t("intervals.categories.other")}
            </button>
            </div>
        </div>
    )
}
