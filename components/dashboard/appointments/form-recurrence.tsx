import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { DayId } from "@/types";
import { cn } from "@/lib/utils";

type RecurrenceSectionProps = {
  isRepeating: boolean;
  repeatDays: DayId[];
  onRepeatingChange: (value: boolean) => void;
  onRepeatDaysChange: (days: DayId[]) => void;
  disabled?: boolean;
  t: (key: string) => string;
};

const DAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];
const DAY_IDS: DayId[] = ["1", "2", "3", "4", "5", "6", "7"];

// Quick selection presets
const WEEKDAYS: DayId[] = ["1", "2", "3", "4", "5"]; // Monday to Friday
const WEEKEND: DayId[] = ["6", "7"]; // Saturday and Sunday
const ALL_WEEK: DayId[] = ["1", "2", "3", "4", "5", "6", "7"]; // All days

/**
 * Recurrence configuration section for appointment form.
 * Handles repeat toggle and day selection.
 */
export function RecurrenceSection({
  isRepeating,
  repeatDays,
  onRepeatingChange,
  onRepeatDaysChange,
  disabled,
  t,
}: RecurrenceSectionProps) {
  // Check if all days in a preset are already selected
  const areAllDaysSelected = (preset: DayId[]): boolean => {
    return preset.every((day) => repeatDays.includes(day));
  };

  // Toggle preset: if all days are selected, deselect them; otherwise, select them
  const handlePresetClick = (preset: DayId[]) => {
    if (areAllDaysSelected(preset)) {
      // Deselect all days in the preset
      onRepeatDaysChange(repeatDays.filter((day) => !preset.includes(day)));
    } else {
      // Select all days in the preset (merge with existing selection)
      const newSelection = [...new Set([...repeatDays, ...preset])];
      onRepeatDaysChange(newSelection);
    }
  };

  return (
    <div className="flex flex-col gap-0 pt-1">
      {/* Accordion header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => onRepeatingChange(!isRepeating)}
        disabled={disabled}
        className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Label className="cursor-pointer text-muted-foreground text-xs font-medium uppercase pointer-events-none">
          {t("form.repeatLabel")}
        </Label>
        {isRepeating ? (
          <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Accordion content - animated expand/collapse */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isRepeating ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-2 pt-1 pb-2">
          {/* Quick selection buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(ALL_WEEK)}
              disabled={disabled}
              className="flex-1 h-7 text-xs rounded-none cursor-pointer"
            >
              {t("form.quickSelect.allWeek")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(WEEKEND)}
              disabled={disabled}
              className="flex-1 h-7 text-xs rounded-none cursor-pointer"
            >
              {t("form.quickSelect.weekend")}
            </Button>
          </div>

          {/* Day selection toggle group */}
          <ToggleGroup
            type="multiple"
            value={repeatDays}
            onValueChange={onRepeatDaysChange as (value: string[]) => void}
            className="overflow-x-auto w-full justify-between gap-px bg-border border border-border"
            disabled={disabled}
          >
            {DAY_IDS.map((day, i) => (
              <ToggleGroupItem
                key={day}
                className="text-xs text-muted-foreground flex-1 h-8 rounded-none bg-background data-[state=on]:bg-foreground data-[state=on]:text-background hover:bg-muted transition-colors cursor-pointer"
                value={day}
              >
                {DAY_LABELS[i]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}

