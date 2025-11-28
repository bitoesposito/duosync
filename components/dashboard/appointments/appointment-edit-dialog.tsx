"use client";

import { useState, useEffect, useCallback } from "react";
import { Appointment, AppointmentFormData, AppointmentCategory, DayId } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useI18n } from "@/i18n";
import { toast } from "sonner";
import { buildAppointmentFormData, validateAppointmentSlot } from "@/features/appointments";
import { CategorySelector } from "@/components/dashboard/appointments/form-category-selector";
import { TimeInputs } from "@/components/dashboard/appointments/form-time-inputs";
import { RecurrenceSection } from "@/components/dashboard/appointments/form-recurrence";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppointmentEditDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appointmentId: string, updatedAppointment: Appointment) => Promise<void>;
  existingAppointments: Appointment[];
}

/**
 * Dialog for editing an appointment.
 * Allows modifying all appointment fields (time, category, description, recurrence).
 */
export default function AppointmentEditDialog({
  appointment,
  open,
  onOpenChange,
  onSave,
  existingAppointments,
}: AppointmentEditDialogProps) {
  const { t } = useI18n();
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory>("other");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [repeatDays, setRepeatDays] = useState<DayId[]>([]);
  const [areTimeInputsValid, setAreTimeInputsValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment) {
      setSelectedCategory(appointment.category);
      setStartTime(appointment.startTime);
      setEndTime(appointment.endTime);
      setDescription(appointment.description || "");
      setIsRepeating(appointment.isRepeating);
      setRepeatDays(appointment.repeatDays || []);
      setAreTimeInputsValid(true);
    }
  }, [appointment]);

  /**
   * Handles saving the updated appointment.
   */
  const handleSave = useCallback(async () => {
    if (!appointment) return;

    const formData: AppointmentFormData = buildAppointmentFormData({
      startTime,
      endTime,
      category: selectedCategory,
      description,
      isRepeating,
      repeatDays,
    });

    // Validate appointment slot (exclude current appointment from overlap check)
    const otherAppointments = existingAppointments.filter((apt) => apt.id !== appointment.id);
    const validation = validateAppointmentSlot(formData, otherAppointments);
    if (!validation.ok) {
      const reasonKeyMap = {
        "invalid-format": "toasts.invalidSlot.descriptionInvalidFormat",
        "end-before-start": "toasts.invalidSlot.descriptionEndBeforeStart",
        overlap: "toasts.invalidSlot.descriptionOverlap",
      } as const;
      const descriptionKey = reasonKeyMap[validation.reason];
      toast.warning(t("toasts.invalidSlot.title"), {
        description: t(descriptionKey),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedAppointment: Appointment = {
        ...appointment,
        ...formData,
      };
      
      await onSave(appointment.id, updatedAppointment);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    appointment,
    startTime,
    endTime,
    selectedCategory,
    description,
    isRepeating,
    repeatDays,
    existingAppointments,
    onSave,
    onOpenChange,
  ]);

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.users.appointments.editTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin.users.appointments.editDescription")}
          </DialogDescription>
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
            existingAppointments={existingAppointments.filter((apt) => apt.id !== appointment.id)}
            onValidationChange={setAreTimeInputsValid}
          />

          {selectedCategory === "other" && (
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="description"
                className="text-muted-foreground text-xs font-medium uppercase"
              >
                {t("form.descriptionLabel")}
              </Label>
              <Input
                id="description"
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
            onRepeatDaysChange={setRepeatDays as (days: string[]) => void}
            disabled={isSubmitting}
            t={t}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-none h-10 text-sm font-medium tracking-wide"
          >
            {t("admin.users.deleteModal.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !areTimeInputsValid}
            className="rounded-none h-10 text-sm font-medium tracking-wide"
          >
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {t("admin.users.details.update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

