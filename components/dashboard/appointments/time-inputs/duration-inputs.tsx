/**
 * Duration inputs component - hours and minutes comboboxes.
 * Provides autocomplete selection for duration with filtered options.
 */

import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DurationOption = {
  value: string;
  label: string;
};

type DurationInputsProps = {
  hours: string;
  minutes: string;
  availableHours: DurationOption[];
  availableMinutes: DurationOption[];
  hoursComboboxOpen: boolean;
  minutesComboboxOpen: boolean;
  onHoursComboboxOpenChange: (open: boolean) => void;
  onMinutesComboboxOpenChange: (open: boolean) => void;
  onHoursSelect: (value: string) => void;
  onMinutesSelect: (value: string) => void;
  hoursDisabled: boolean;
  minutesDisabled: boolean;
  t: (key: string) => string;
};

/**
 * Duration inputs with hours and minutes comboboxes.
 * Shows filtered options based on available time slots.
 */
export function DurationInputs({
  hours,
  minutes,
  availableHours,
  availableMinutes,
  hoursComboboxOpen,
  minutesComboboxOpen,
  onHoursComboboxOpenChange,
  onMinutesComboboxOpenChange,
  onHoursSelect,
  onMinutesSelect,
  hoursDisabled,
  minutesDisabled,
  t,
}: DurationInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Hours Combobox */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="duration-hours"
          className="text-muted-foreground text-xs font-medium uppercase"
        >
          {t("form.durationHoursLabel")}
        </Label>
        <Popover open={hoursComboboxOpen} onOpenChange={onHoursComboboxOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={hoursComboboxOpen}
              className="w-full justify-between bg-transparent border-border rounded-none h-10 text-sm font-normal cursor-pointer"
              disabled={hoursDisabled}
            >
              {hours !== ""
                ? availableHours.find((hour) => hour.value === hours)?.label || hours + "h"
                : t("form.durationHoursLabel")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none border-border"
            align="start"
          >
            <Command>
              <CommandInput
                type="number"
                inputMode="numeric"
                placeholder={t("form.durationHoursLabel")}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  {t("form.noOptionsAvailable") || "No options available"}
                </CommandEmpty>
                <CommandGroup>
                  {availableHours.map((hour) => (
                    <CommandItem
                      key={hour.value}
                      value={hour.label}
                      onSelect={() => onHoursSelect(hour.value)}
                    >
                      {hour.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          hours === hour.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Minutes Combobox */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="duration-minutes"
          className="text-muted-foreground text-xs font-medium uppercase"
        >
          {t("form.durationMinutesLabel")}
        </Label>
        <Popover open={minutesComboboxOpen} onOpenChange={onMinutesComboboxOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={minutesComboboxOpen}
              className="w-full justify-between bg-transparent border-border rounded-none h-10 text-sm font-normal cursor-pointer"
              disabled={minutesDisabled}
            >
              {minutes !== ""
                ? availableMinutes.find((minute) => minute.value === minutes)?.label ||
                  minutes + "m"
                : t("form.durationMinutesLabel")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none border-border"
            align="start"
          >
            <Command>
              <CommandInput
                type="number"
                inputMode="numeric"
                placeholder={t("form.durationMinutesLabel")}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  {t("form.noOptionsAvailable") || "No options available"}
                </CommandEmpty>
                <CommandGroup>
                  {availableMinutes.map((minute) => (
                    <CommandItem
                      key={minute.value}
                      value={minute.label}
                      onSelect={() => onMinutesSelect(minute.value)}
                    >
                      {minute.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          minutes === minute.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

