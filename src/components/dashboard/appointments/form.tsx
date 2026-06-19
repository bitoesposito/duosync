import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useUsers } from "@/features/users/useUsers";
import { useI18n } from "@/i18n/useI18n";
import { findFirstAvailableSlot, sortRepeatDays } from "@shared";
import type { AppointmentCategory, AppointmentInput, DayId } from "@shared";
import { CategorySelector } from "./form-category-selector";
import { TimeInputs } from "./form-time-inputs";
import { RecurrenceSection } from "./form-recurrence";

/** Form to create a new appointment for the active user. */
export default function AppointmentsForm() {
  const { addAppointment, appointments, isLoading, isSaving } = useAppointments();
  const { activeUser, isLoading: isLoadingUsers } = useUsers();
  const { t } = useI18n();
  const isBusy = isLoading || isSaving || isLoadingUsers;
  const [isOpen, setIsOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory>("other");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hasUserEditedTimes, setHasUserEditedTimes] = useState(false);
  const [description, setDescription] = useState("");
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<DayId[]>([]);
  const [areTimeInputsValid, setAreTimeInputsValid] = useState(false);

  // Reset the form when the active user changes.
  useEffect(() => {
    setStartTime("");
    setEndTime("");
    setDescription("");
    setIsRepeating(false);
    setRepeatDays([]);
    setSelectedCategory("other");
    setHasUserEditedTimes(false);
    setAreTimeInputsValid(false);
  }, [activeUser?.id]);

  // Auto-fill the start time with the first available slot.
  useEffect(() => {
    if (activeUser && !isLoading && !startTime && !hasUserEditedTimes) {
      const slot = findFirstAvailableSlot(appointments);
      if (slot) setStartTime(slot);
    }
  }, [activeUser, isLoading, startTime, hasUserEditedTimes, appointments]);

  const handleAdd = async () => {
    const payload: AppointmentInput = {
      startTime,
      endTime,
      category: selectedCategory,
      description: selectedCategory === "other" ? description.trim() || undefined : undefined,
      isRepeating,
      repeatDays: isRepeating ? sortRepeatDays(repeatDays) : [],
    };
    try {
      await addAppointment(payload);
      setSelectedCategory("other");
      setDescription("");
      setIsRepeating(false);
      setRepeatDays([]);
      setHasUserEditedTimes(false);
      setStartTime("");
      setEndTime("");
    } catch {
      // Server rejected (e.g. overlap) — keep the form so the user can adjust.
    }
  };

  return (
    <section className="w-full flex flex-col gap-0 border-b border-border md:border-b-0 bg-background md:bg-transparent">
      <header
        className="flex items-center justify-between py-3 md:pt-0 pt-3 md:cursor-default cursor-pointer hover:opacity-70 md:hover:opacity-100 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-medium tracking-tight text-foreground">{t("form.title")}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none h-8 w-8 cursor-pointer"
        >
          {isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </Button>
      </header>

      <div className={`${isOpen ? "block" : "hidden"} md:block`}>
        <div className="flex flex-col gap-4 pb-6 md:pb-0">
          <TimeInputs
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={(v) => {
              setStartTime(v);
              setHasUserEditedTimes(true);
            }}
            onEndTimeChange={(v) => {
              setEndTime(v);
              setHasUserEditedTimes(true);
            }}
            disabled={!activeUser}
            t={t}
            existingAppointments={appointments}
            onValidationChange={setAreTimeInputsValid}
            isRepeating={isRepeating}
            repeatDays={repeatDays}
          />

          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground text-xs font-medium uppercase">
              {t("form.categoryLabel")}
            </Label>
            <CategorySelector
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              disabled={!activeUser}
              t={t}
            />
          </div>

          {selectedCategory === "other" && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="description" className="text-muted-foreground text-xs font-medium uppercase">
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
            onRepeatDaysChange={(days) => setRepeatDays(days.length > 0 ? sortRepeatDays(days) : [])}
            disabled={!activeUser}
            t={t}
          />

          <Button
            className="w-full cursor-pointer font-medium tracking-wide h-10 rounded-none text-sm mt-1 disabled:opacity-60"
            variant="default"
            onClick={handleAdd}
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
