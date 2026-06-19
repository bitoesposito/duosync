import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { DayId } from "@shared";
import { cn } from "@/lib/utils";

type RecurrenceSectionProps = {
  isRepeating: boolean;
  repeatDays: DayId[];
  onRepeatingChange: (value: boolean) => void;
  onRepeatDaysChange: (days: DayId[]) => void;
  disabled?: boolean;
  t: (key: string) => string;
};

const DAY_IDS: DayId[] = [1, 2, 3, 4, 5, 6, 7];
const WEEKEND: DayId[] = [6, 7];
const ALL_WEEK: DayId[] = [1, 2, 3, 4, 5, 6, 7];

/** Repeat toggle + weekday selection for the appointment form. */
export function RecurrenceSection({
  isRepeating,
  repeatDays,
  onRepeatingChange,
  onRepeatDaysChange,
  disabled,
  t,
}: RecurrenceSectionProps) {
  const areAllDaysSelected = (preset: DayId[]) => preset.every((day) => repeatDays.includes(day));

  const handlePresetClick = (preset: DayId[]) => {
    if (areAllDaysSelected(preset)) {
      onRepeatDaysChange(repeatDays.filter((day) => !preset.includes(day)));
    } else {
      onRepeatDaysChange([...new Set([...repeatDays, ...preset])]);
    }
  };

  return (
    <div className="flex flex-col gap-0 pt-1">
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

      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isRepeating ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="flex flex-col gap-2 pt-1 pb-2">
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

          <ToggleGroup
            type="multiple"
            value={repeatDays.map(String)}
            onValueChange={(vals) => onRepeatDaysChange(vals.map(Number) as DayId[])}
            className="overflow-x-auto w-full justify-between gap-px bg-border border border-border"
            disabled={disabled}
          >
            {DAY_IDS.map((day) => (
              <ToggleGroupItem
                key={day}
                className="text-xs text-muted-foreground flex-1 h-8 rounded-none bg-background data-[state=on]:bg-foreground data-[state=on]:text-background hover:bg-muted transition-colors cursor-pointer"
                value={String(day)}
              >
                {t(`common.days.${day}`).charAt(0).toUpperCase()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
