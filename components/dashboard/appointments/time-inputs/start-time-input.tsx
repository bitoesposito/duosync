/**
 * Start time input component with validation and auto-correction.
 * Handles start time input with error display and auto-correction to next available slot.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type StartTimeInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  min: string;
  hasError: boolean;
  errorMessage: string | null;
  nextAvailableSlot: string | null;
  disabled: boolean;
  t: (key: string, values?: Record<string, string>) => string;
};

/**
 * Start time input with validation feedback.
 * Shows error popover when invalid, suggests next available slot.
 */
export function StartTimeInput({
  id,
  value,
  onChange,
  onFocus,
  min,
  hasError,
  errorMessage,
  nextAvailableSlot,
  disabled,
  t,
}: StartTimeInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Disable arrow keys to prevent increment/decrement
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };

  const inputProps = {
    id,
    type: "time" as const,
    value: value || "00:00",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    onKeyDown: handleKeyDown,
    className: cn(
      "w-full bg-transparent border-border rounded-none h-10 text-sm",
      hasError && "border-destructive focus-visible:border-destructive"
    ),
    "aria-invalid": hasError,
    lang: "it-IT" as const,
    min,
    max: "23:59" as const,
    step: "60" as const,
    disabled,
  };

  if (hasError && errorMessage) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="w-full">
            <Input {...inputProps} />
          </div>
        </PopoverTrigger>
        <PopoverContent className="rounded-none border-border w-auto p-3">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{errorMessage}</p>
            {nextAvailableSlot && (
              <p className="text-xs text-muted-foreground">
                {t("form.validation.startTimeHint", {
                  time: nextAvailableSlot,
                })}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return <Input {...inputProps} onFocus={onFocus} />;
}

