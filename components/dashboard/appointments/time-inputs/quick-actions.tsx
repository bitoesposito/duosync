/**
 * Quick actions component - preset duration buttons.
 * Provides quick selection for common durations (1h, 2h, end of day).
 * Implemented as an accordion that can be expanded/collapsed.
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickActionsProps = {
  onQuickAction: (minutes: number | "endOfDay") => void;
  isQuickActionValid: (minutes: number | "endOfDay") => boolean;
  baseDisabled: boolean;
  t: (key: string) => string;
};

/**
 * Quick action buttons for preset durations.
 * Buttons are disabled when the action would be invalid.
 * Implemented as an accordion that can be expanded/collapsed.
 */
export function QuickActions({
  onQuickAction,
  isQuickActionValid,
  baseDisabled,
  t,
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-0">
      {/* Accordion header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={baseDisabled}
        className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Label className="cursor-pointer text-muted-foreground text-xs font-medium uppercase pointer-events-none">
          {t("form.quickPresetsLabel")}
        </Label>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Accordion content - animated expand/collapse */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex gap-2 whitespace-nowrap pt-1 pb-2">
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
    </div>
  );
}

