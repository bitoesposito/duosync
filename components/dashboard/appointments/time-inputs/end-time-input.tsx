/**
 * End time input component with validation.
 * Handles end time input with error display and suggestions.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type EndTimeInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  min: string;
  hasError: boolean;
  errorMessage: string | null;
  startTime: string;
  disabled: boolean;
  t: (key: string, values?: Record<string, string>) => string;
};

/**
 * End time input with validation feedback.
 * Shows error popover when invalid, suggests minimum end time.
 */
export function EndTimeInput({
  id,
  value,
  onChange,
  onFocus,
  min,
  hasError,
  errorMessage,
  startTime,
  disabled,
  t,
}: EndTimeInputProps) {
  const inputProps = {
    id,
    type: "time" as const,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
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
            {startTime && (
              <p className="text-xs text-muted-foreground">
                {t("form.validation.endTimeHint", { time: min })}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return <Input {...inputProps} onFocus={onFocus} />;
}

