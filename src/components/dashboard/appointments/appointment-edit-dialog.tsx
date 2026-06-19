import { useEffect, useState } from "react";
import type { AppointmentCategory, AppointmentInput, DayAppointment, DayId } from "@shared";
import { sortRepeatDays } from "@shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useI18n } from "@/i18n/useI18n";
import { CategorySelector } from "./form-category-selector";
import { TimeInputs } from "./form-time-inputs";
import { RecurrenceSection } from "./form-recurrence";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AppointmentEditDialogProps = {
  appointment: DayAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: AppointmentInput) => Promise<void>;
  existingAppointments: DayAppointment[];
};

/** Modal to edit an existing appointment (one-time or recurring template). */
export default function AppointmentEditDialog({
  appointment,
  open,
  onOpenChange,
  onSave,
  existingAppointments,
}: AppointmentEditDialogProps) {
  const { t } = useI18n();

  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory>("other");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<DayId[]>([]);
  const [areTimeInputsValid, setAreTimeInputsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The id to write: recurring instances target their template.
  const targetId = appointment ? (appointment.templateId ?? appointment.id) : "";

  useEffect(() => {
    if (!appointment) return;
    setSelectedCategory(appointment.category);
    setStartTime(appointment.startTime);
    setEndTime(appointment.endTime);
    setDescription(appointment.description ?? "");
    setIsRepeating(appointment.isRepeating);
    setRepeatDays(appointment.repeatDays.length > 0 ? sortRepeatDays(appointment.repeatDays) : []);
    setAreTimeInputsValid(true);
    setError(null);
  }, [appointment]);

  const handleSave = async () => {
    if (!appointment) return;
    const data: AppointmentInput = {
      startTime,
      endTime,
      category: selectedCategory,
      description: selectedCategory === "other" ? description.trim() || undefined : undefined,
      isRepeating,
      repeatDays: isRepeating ? sortRepeatDays(repeatDays) : [],
    };
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(targetId, data);
      onOpenChange(false);
    } catch (e) {
      const reason = e instanceof Error ? e.message : "overlap";
      const key = ["invalid-format", "end-before-start", "overlap", "no-days"].includes(reason)
        ? reason.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        : "overlap";
      setError(t(`form.validation.${key === "noDays" ? "invalidFormat" : key}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>{t("form.editTitle")}</DialogTitle>
          <DialogDescription>{t("form.editDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            disabled={isSubmitting}
            t={t}
          />

          <TimeInputs
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            disabled={isSubmitting}
            t={t}
            existingAppointments={existingAppointments}
            onValidationChange={setAreTimeInputsValid}
            isRepeating={isRepeating}
            repeatDays={repeatDays}
            excludeId={targetId}
          />

          {selectedCategory === "other" && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="edit-description" className="text-muted-foreground text-xs font-medium uppercase">
                {t("form.descriptionLabel")}
              </Label>
              <Input
                id="edit-description"
                type="text"
                placeholder={t("form.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-transparent border-border rounded-none h-10 text-sm"
                disabled={isSubmitting}
              />
            </div>
          )}

          <RecurrenceSection
            isRepeating={isRepeating}
            repeatDays={repeatDays}
            onRepeatingChange={setIsRepeating}
            onRepeatDaysChange={(days) => setRepeatDays(days.length > 0 ? sortRepeatDays(days) : [])}
            disabled={isSubmitting}
            t={t}
          />

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-none h-10 text-sm font-medium tracking-wide cursor-pointer"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !areTimeInputsValid}
            className="rounded-none h-10 text-sm font-medium tracking-wide cursor-pointer"
          >
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
