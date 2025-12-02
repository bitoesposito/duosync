"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useAppointments } from "@/features/appointments";
import { useI18n } from "@/i18n";
import { useUsers } from "@/features/users";
import { buildAppointmentFormData, sortRepeatDays } from "@/features/appointments";
import { findFirstAvailableSlot } from "@/features/appointments/services/appointments-slot-finder.service";
import { AppointmentCategory, DayId } from "@/types";
import { CategorySelector } from "./form-category-selector";
import { TimeInputs } from "./form-time-inputs";
import { RecurrenceSection } from "./form-recurrence";

// Form used to create a new appointment and push it into the shared context.
export default function AppointmentsForm() {
  const { addAppointment, appointments, isLoading, isSaving } = useAppointments();
  const { activeUser, isLoading: isLoadingUsers } = useUsers();
  const { t } = useI18n();
  const isBusy = isLoading || isSaving || isLoadingUsers;
  const [isOpen, setIsOpen] = useState(false); // Default collapsed on mobile

  // Selected category (defaults to "other")
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory>(
    "other"
  );
  // Start and end time state - initialized with smart defaults
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  // Track if user has manually edited times (to avoid overwriting)
  const [hasUserEditedTimes, setHasUserEditedTimes] = useState<boolean>(false);
  // Free-text description entered by the user
  const [description, setDescription] = useState<string>("");
  // Recurrence toggle and selected days
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [repeatDays, setRepeatDays] = useState<DayId[]>([]);
  // Track if time inputs are valid
  const [areTimeInputsValid, setAreTimeInputsValid] = useState<boolean>(false);

  // Reset form when user changes
  useEffect(() => {
    if (activeUser && !isLoading) {
      setHasUserEditedTimes(false);
      // Reset to empty - fields will be filled automatically
      setStartTime("");
      setEndTime("");
      setDescription("");
      setIsRepeating(false);
      setRepeatDays([]);
      setSelectedCategory("other");
      setAreTimeInputsValid(false);
    }
  }, [activeUser?.id, isLoading]);

  // Auto-set start time to first available slot when empty and appointments are loaded
  useEffect(() => {
    if (activeUser && !isLoading && !startTime && !hasUserEditedTimes) {
      const firstSlot = findFirstAvailableSlot(appointments || []);
      if (firstSlot) {
        setStartTime(firstSlot);
        // Don't set hasUserEditedTimes to true for auto-initialization
      }
    }
  }, [activeUser, isLoading, startTime, hasUserEditedTimes, appointments]);

  // Track when user manually changes times
  const handleStartTimeChange = useCallback(
    (value: string) => {
      setStartTime(value);
      setHasUserEditedTimes(true);
    },
    []
  );

  const handleEndTimeChange = useCallback(
    (value: string) => {
      setEndTime(value);
      setHasUserEditedTimes(true);
    },
    []
  );

  /**
   * Handles repeat days change, ensuring they are always sorted.
   */
  const handleRepeatDaysChange = useCallback((days: DayId[]) => {
    setRepeatDays(days.length > 0 ? sortRepeatDays(days) : []);
  }, []);

  /**
   * Handles form submission: builds payload, sends to context, resets form.
   */
  const handleAddAppointment = useCallback(() => {
    const payload = buildAppointmentFormData({
      startTime,
      endTime,
      category: selectedCategory,
      description,
      isRepeating,
      repeatDays,
    });

    addAppointment(payload);

    // Reset form after submission - leave time fields empty
    setSelectedCategory("other");
    setDescription("");
    setIsRepeating(false);
    setRepeatDays([]);
    setHasUserEditedTimes(false);
    setStartTime("");
    setEndTime("");
  }, [
    startTime,
    endTime,
    selectedCategory,
    description,
    isRepeating,
    repeatDays,
    addAppointment,
    appointments,
  ]);

  return (
    <section className="w-full flex flex-col gap-0 border-b border-border md:border-b-0 bg-background md:bg-transparent">
      <header
        className="flex items-center justify-between py-3 md:pt-0 pt-3 md:cursor-default cursor-pointer hover:opacity-70 md:hover:opacity-100 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {t("form.title")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none h-8 w-8 cursor-pointer"
        >
          {isOpen ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </Button>
      </header>

      <div className={`${isOpen ? "block" : "hidden"} md:block`}>
        <div className="flex flex-col gap-4 pb-6 md:pb-0">
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            disabled={!activeUser}
            t={t}
          />

          <TimeInputs
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
            disabled={!activeUser}
            t={t}
            existingAppointments={appointments}
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
                disabled={!activeUser}
              />
            </div>
          )}

          <RecurrenceSection
            isRepeating={isRepeating}
            repeatDays={repeatDays}
            onRepeatingChange={setIsRepeating}
            onRepeatDaysChange={handleRepeatDaysChange as (days: string[]) => void}
            disabled={!activeUser}
            t={t}
          />

          <Button
            className="w-full cursor-pointer font-medium tracking-wide h-10 rounded-none text-sm mt-1 disabled:opacity-60 cursor-pointer"
            variant="default"
            onClick={handleAddAppointment}
            disabled={isBusy || !activeUser || !areTimeInputsValid}
            aria-busy={isBusy}
          >
            <PlusIcon className="w-3.5 h-3.5 mr-2" />
            {isBusy ? t("form.addButtonSyncing") : t("form.addButtonDefault")}
          </Button>

          {!activeUser && (
            <div className="bg-muted border border-border p-3 rounded-none text-sm text-muted-foreground">
              {t("form.userRequired")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
