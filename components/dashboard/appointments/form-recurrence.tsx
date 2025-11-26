import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DayId } from "@/types";

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
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="repeat-appointment"
          className="cursor-pointer text-muted-foreground text-xs font-medium uppercase"
        >
          {t("form.repeatLabel")}
        </Label>
        <Switch
          className="cursor-pointer rounded-full data-[state=checked]:bg-foreground scale-90 origin-right"
          id="repeat-appointment"
          checked={isRepeating}
          onCheckedChange={onRepeatingChange}
          disabled={disabled}
        />
      </div>

      {isRepeating && (
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
      )}
    </div>
  );
}

