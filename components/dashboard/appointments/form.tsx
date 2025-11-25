"use client";

import { useState, useMemo, useCallback } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  MoonIcon,
  CalendarIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useAppointments, useI18n, useUsers } from "@/hooks";
import { buildAppointmentFormData } from "@/features/appointments";
import { AppointmentCategory, DayId } from "@/types";

// Form used to create a new appointment and push it into the shared context.
export default function AppointmentsForm() {
  const { addAppointment, isLoading, isSaving } = useAppointments();
  const { activeUser, isLoading: isLoadingUsers } = useUsers();
  const { t } = useI18n();
  const isBusy = isLoading || isSaving || isLoadingUsers;
  const [isOpen, setIsOpen] = useState(false); // Default collapsed on mobile

  // Selected category (defaults to "other")
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory>(
    "other"
  );
  // Start and end time state
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("00:00");
  // Free-text description entered by the user
  const [description, setDescription] = useState<string>("");
  // Recurrence toggle and selected days
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [repeatDays, setRepeatDays] = useState<DayId[]>([]);

  // Builds the data payload, sends it to the context, then resets the form.
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

    // Reset the form after adding the appointment
    setSelectedCategory("other");
    setStartTime("00:00");
    setEndTime("00:00");
    setDescription("");
    setIsRepeating(false);
    setRepeatDays([]);
  }, [
    startTime,
    endTime,
    selectedCategory,
    description,
    isRepeating,
    repeatDays,
    addAppointment,
  ]);

  // Memoized form content to prevent unnecessary re-renders that cause input focus loss
  const formContent = useMemo(
    () => (
      <div className="flex flex-col gap-4 pb-6">
        {/* Appointment category selector */}
        <ButtonGroup className="w-full overflow-x-auto border border-border rounded-none p-0.5">
          <Button
            className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm"
            variant={selectedCategory === "other" ? "secondary" : "ghost"}
            onClick={() => setSelectedCategory("other")}
            disabled={!activeUser}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {t("form.categoryOther")}
          </Button>
          <Button
            className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm"
            variant={selectedCategory === "sleep" ? "secondary" : "ghost"}
            onClick={() => setSelectedCategory("sleep")}
            disabled={!activeUser}
          >
            <MoonIcon className="w-3.5 h-3.5" />
            {t("form.categorySleep")}
          </Button>
        </ButtonGroup>

        {/* Start/end time inputs */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 w-full">
            <Label
              htmlFor="start-time"
              className="text-muted-foreground text-xs font-medium uppercase"
            >
              {t("form.startLabel")}
            </Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-transparent border-border rounded-none h-10 text-sm"
              lang="it-IT"
              min="00:00"
              max="23:59"
              step="60"
              disabled={!activeUser}
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <Label
              htmlFor="end-time"
              className="text-muted-foreground text-xs font-medium uppercase"
            >
              {t("form.endLabel")}
            </Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-transparent border-border rounded-none h-10 text-sm"
              lang="it-IT"
              min="00:00"
              max="23:59"
              step="60"
              disabled={!activeUser}
            />
          </div>
        </div>

        {/* Description field visible only when the "other" category is selected */}
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

        {/* Recurrence configuration */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="repeat-appointment"
              className="cursor-pointer text-muted-foreground text-xs font-medium uppercase"
            >
              {t("form.repeatLabel")}
            </Label>
            <Switch
              className="cursor-pointer rounded-full data-[state=checked]:bg-foreground scale-90 origin-right"
              id="repeat-appointment"
              checked={isRepeating}
              onCheckedChange={setIsRepeating}
              disabled={!activeUser}
            />
          </div>

          {isRepeating && (
            <ToggleGroup
              type="multiple"
              value={repeatDays}
              // Explicit cast because the component exposes a generic `string[]` signature
              onValueChange={setRepeatDays as (value: string[]) => void}
              className="overflow-x-auto w-full justify-between gap-px bg-border border border-border"
              disabled={!activeUser}
            >
              {["1", "2", "3", "4", "5", "6", "7"].map((day, i) => (
                <ToggleGroupItem
                  key={day}
                  className="text-xs text-muted-foreground flex-1 h-8 rounded-none bg-background data-[state=on]:bg-foreground data-[state=on]:text-background hover:bg-muted transition-colors cursor-pointer"
                  value={day}
                >
                  {["L", "M", "M", "G", "V", "S", "D"][i]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>

        {/* Action button that notifies the parent context */}
        <Button
          className="w-full cursor-pointer font-medium tracking-wide h-10 rounded-none text-sm mt-1 disabled:opacity-60"
          variant="default"
          onClick={handleAddAppointment}
          disabled={isBusy || !activeUser}
          aria-busy={isBusy}
        >
          <PlusIcon className="w-3.5 h-3.5 mr-2" />{" "}
          {isBusy ? t("form.addButtonSyncing") : t("form.addButtonDefault")}
        </Button>

        {/* User selection warning */}
        {!activeUser && (
          <div className="bg-muted border border-border p-3 rounded-none text-sm text-muted-foreground">
            {t("form.userRequired") || "Seleziona un utente dalla navbar per creare un impegno"}
          </div>
        )}
      </div>
    ),
    [
      selectedCategory,
      startTime,
      endTime,
      description,
      isRepeating,
      repeatDays,
      isBusy,
      activeUser,
      t,
      handleAddAppointment,
    ]
  );

  return (
    <section className="w-full flex flex-col gap-0 border-b border-border">
      {/* Unified header: toggle button visible only on mobile */}
      <header
        className="flex items-center justify-between py-3 md:cursor-default cursor-pointer hover:opacity-70 md:hover:opacity-100 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            {t("form.title")}
          </h2>
        </div>
        {/* Toggle button visible only on mobile */}
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

      {/* Unified content: always visible on desktop, collapsible on mobile */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } md:block`}
      >
        {formContent}
      </div>
    </section>
  );
}
