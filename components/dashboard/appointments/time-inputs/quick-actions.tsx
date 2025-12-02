/**
 * Quick actions component - preset duration buttons.
 * Provides quick selection for common durations (1h, 2h, end of day).
 */

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type QuickActionsProps = {
  onQuickAction: (minutes: number | "endOfDay") => void;
  isQuickActionValid: (minutes: number | "endOfDay") => boolean;
  baseDisabled: boolean;
  t: (key: string) => string;
};

/**
 * Quick action buttons for preset durations.
 * Buttons are disabled when the action would be invalid.
 */
export function QuickActions({
  onQuickAction,
  isQuickActionValid,
  baseDisabled,
  t,
}: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground text-xs font-medium uppercase">
        {t("form.quickPresetsLabel")}
      </Label>
      <div className="flex gap-2 whitespace-nowrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickAction(60)}
          disabled={baseDisabled || !isQuickActionValid(60)}
          className="h-9 px-4 text-sm border border-border rounded-sm bg-transparent hover:bg-muted flex-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          1h
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickAction(120)}
          disabled={baseDisabled || !isQuickActionValid(120)}
          className="h-9 px-4 text-sm border border-border rounded-sm bg-transparent hover:bg-muted flex-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          2h
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickAction("endOfDay")}
          disabled={baseDisabled || !isQuickActionValid("endOfDay")}
          className="h-9 px-4 text-sm border border-border rounded-sm bg-transparent hover:bg-muted whitespace-nowrap flex-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {t("form.endOfDay")}
        </Button>
      </div>
    </div>
  );
}

