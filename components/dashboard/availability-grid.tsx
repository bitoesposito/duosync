"use client";

import { useMemo } from "react";
import { SparklesIcon, UserIcon } from "lucide-react";
import {
  buildTimelineSegments,
  buildSharedTimelineSegments,
} from "@/features/availability";
import { useAppointments } from "@/features/appointments";
import { useI18n } from "@/i18n";
import { useUsers } from "@/features/users";
import { TimelineSegmentCategory } from "@/types";
import { AvailabilityGridHeader } from "./availability-grid-header";
import { TimelineBar } from "./availability-timeline-bar";

// Color mappings chosen for higher clarity and accessibility.
// Match is a bold green, available is a soft blue, sleep a clear muted purple, and other is a neutral gray.
const personalColorMap: Record<TimelineSegmentCategory, string> = {
  match: "bg-emerald-500 dark:bg-emerald-600",     // strong green for overlapping availability
  available: "bg-emerald-500 dark:bg-emerald-600",   // soft blue for personal availability
  sleep: "bg-indigo-500 dark:bg-indigo-500", // distinct purple for sleep
  other: "bg-slate-500 dark:bg-slate-500", // neutral gray for busy/other
};

// For shared view, only match stands out. Others are transparent for visual focus.
const sharedColorMap: Record<TimelineSegmentCategory, string> = {
  match: "bg-emerald-500 dark:bg-emerald-600",     // consistent green for clarity
  available: "bg-slate-500 dark:bg-slate-500",
  sleep: "bg-transparent",
  other: "bg-transparent"
};

/**
 * Availability grid component that displays personal and shared timelines.
 * Shows when all users are free (match) and personal availability.
 */
export default function AvailabilityGrid() {
  const { appointments, isLoading, allOtherUsersAppointments } = useAppointments();
  const { users, activeUser } = useUsers();
  const { t } = useI18n();

  // Get all other users (excluding the active user)
  const otherUsers = users.filter((u) => u.id !== activeUser?.id);

  // Memoize timeline segments to avoid recalculating on every render
  const personalSegments = useMemo(
    () => buildTimelineSegments(appointments),
    [appointments]
  );

  // Build shared segments using all other users' appointments
  const allSharedSegments = useMemo(() => {
    if (!allOtherUsersAppointments || otherUsers.length === 0 || isLoading) {
      return [];
    }

    // Convert Record<number, Appointment[]> to Appointment[][]
    // Include all users, even if they have no appointments (empty array)
    const allOtherUsersAppointmentsArray = otherUsers.map(
      (user) => allOtherUsersAppointments[user.id] || []
    );

    return buildSharedTimelineSegments(appointments, allOtherUsersAppointmentsArray);
  }, [allOtherUsersAppointments, otherUsers, appointments, isLoading]);

  const sharedSegments = useMemo(
    () => allSharedSegments.filter((segment) => segment.category === "match"),
    [allSharedSegments]
  );

  const isLoadingGrid = isLoading;

  const legendItems: { category: TimelineSegmentCategory; label: string }[] = [
    { category: "available", label: t("availability.legendAvailable") },
    { category: "other", label: t("availability.legendBusy") },
    { category: "sleep", label: t("availability.legendSleep") },
  ];

  const getCategoryLabel = (category: TimelineSegmentCategory): string => {
    if (category === "available") return t("availability.legendAvailable");
    if (category === "sleep") return t("availability.legendSleep");
    return t("availability.legendBusy");
  };

  return (
    <section className="w-full flex flex-col gap-6 border-b border-border pb-6">
      <AvailabilityGridHeader
        title={t("availability.title")}
        legendItems={legendItems}
        colorMap={personalColorMap}
      />

      <div
        className={`relative w-full flex flex-col gap-4 ${
          isLoadingGrid ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {t("availability.personalTimeline")}
            </p>
          </div>
          <TimelineBar
            segments={personalSegments}
            colorMap={personalColorMap}
            getCategoryLabel={getCategoryLabel}
          />
        </div>

        {otherUsers.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-medium text-foreground">
                {t("availability.sharedTimeline")}
              </p>
              {sharedSegments.length > 0 && (
                <span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  {sharedSegments.length} {t("availability.freeSlots")}
                </span>
              )}
            </div>
            <TimelineBar
              segments={sharedSegments}
              colorMap={sharedColorMap}
              height="h-7"
              borderStyle="border"
              backgroundColor="bg-emerald-50/30 dark:bg-emerald-950/20"
              getCategoryLabel={() => t("availability.legendAvailable")}
              showIcon
              icon={<SparklesIcon className="w-3.5 h-3.5 text-emerald-500" />}
              emptyMessage={t("availability.noFreeTime")}
            />
          </div>
        )}
      </div>
    </section>
  );
}
