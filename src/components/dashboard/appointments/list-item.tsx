import { Button } from "@/components/ui/button";
import { TrashIcon, RepeatIcon, PencilIcon } from "lucide-react";
import type { DayAppointment, DayId } from "@shared";
import { sortRepeatDays } from "@shared";
import { useI18n } from "@/i18n/useI18n";

type AppointmentsListItemProps = {
  appointment: DayAppointment;
  onRemove?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
};

/** A single appointment row with category badge, repeat info and hover actions. */
export default function AppointmentsListItem({
  appointment,
  onRemove,
  onEdit,
  disabled = false,
}: AppointmentsListItemProps) {
  const { startTime, endTime, category, description, isRepeating, repeatDays } = appointment;
  const { t } = useI18n();

  const categoryLabel = t(`common.categories.${category}`);
  const sortedRepeatDays = isRepeating && repeatDays.length > 0 ? sortRepeatDays(repeatDays) : [];
  const repeatLabel =
    sortedRepeatDays.length > 0
      ? sortedRepeatDays.map((d: DayId) => t(`common.days.${d}`).slice(0, 3)).join(", ")
      : null;
  const isSleep = category === "sleep";

  return (
    <article
      className="flex items-center justify-between gap-4 py-3 px-4 bg-background hover:bg-muted/30 transition-colors group border-l-2 border-transparent hover:border-border data-[sleep=true]:border-indigo-500/50"
      data-sleep={isSleep}
    >
      <div className="flex items-baseline gap-4 min-w-0">
        <p
          className={`text-sm font-medium font-mono shrink-0 ${isSleep ? "text-indigo-600 dark:text-indigo-400" : "text-foreground"}`}
        >
          {startTime} - {endTime}
        </p>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
            <span
              className={`uppercase tracking-wider font-semibold border px-1 py-px text-[10px] ${
                isSleep
                  ? "text-indigo-600 border-indigo-200 bg-indigo-50 dark:text-indigo-300 dark:border-indigo-800 dark:bg-indigo-900/20"
                  : "text-foreground/70 border-border"
              }`}
            >
              {categoryLabel}
            </span>
            <span className="truncate">{description || ""}</span>
          </div>

          {repeatLabel && (
            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground/70">
              <RepeatIcon className="w-3 h-3" />
              <p className="text-[10px] font-medium truncate uppercase tracking-wide">{repeatLabel}</p>
            </div>
          )}
        </div>
      </div>

      {(onEdit || onRemove) && (
        <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t("list.editAriaLabel")}
              className="text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none h-6 w-6 cursor-pointer disabled:opacity-50"
              onClick={onEdit}
              disabled={disabled}
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </Button>
          )}
          {onRemove && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t("list.removeAriaLabel")}
              className="text-muted-foreground hover:text-destructive hover:bg-transparent rounded-none h-6 w-6 cursor-pointer disabled:opacity-50"
              onClick={onRemove}
              disabled={disabled}
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
