import { useMemo } from "react";
import { SparklesIcon, UserIcon } from "lucide-react";
import { buildSharedTimelineSegments, buildTimelineSegments } from "@shared";
import type { TimelineSegmentCategory } from "@shared";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useUsers } from "@/features/users/useUsers";
import { useI18n } from "@/i18n/useI18n";
import { AvailabilityGridHeader } from "./availability-grid-header";
import { TimelineBar } from "./availability-timeline-bar";

// Personal view: match/available green, sleep indigo, other neutral gray.
const personalColorMap: Record<TimelineSegmentCategory, string> = {
  match: "bg-emerald-500 dark:bg-emerald-600",
  available: "bg-emerald-500 dark:bg-emerald-600",
  sleep: "bg-indigo-500 dark:bg-indigo-500",
  other: "bg-slate-500 dark:bg-slate-500",
};

// Shared view: only "match" stands out; the rest is transparent for focus.
const sharedColorMap: Record<TimelineSegmentCategory, string> = {
  match: "bg-emerald-500 dark:bg-emerald-600",
  available: "bg-slate-500 dark:bg-slate-500",
  sleep: "bg-transparent",
  other: "bg-transparent",
};

export default function AvailabilityGrid() {
  const { appointments, isLoading, allOtherUsersAppointments } = useAppointments();
  const { users, activeUser } = useUsers();
  const { t } = useI18n();

  const otherUsers = users.filter((u) => u.id !== activeUser?.id);

  const personalSegments = useMemo(
    () => buildTimelineSegments(appointments),
    [appointments],
  );

  const sharedSegments = useMemo(() => {
    if (otherUsers.length === 0 || isLoading) return [];
    const arrays = otherUsers.map((u) => allOtherUsersAppointments[u.id] || []);
    return buildSharedTimelineSegments(appointments, arrays).filter((s) => s.category === "match");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOtherUsersAppointments, appointments, isLoading, users, activeUser?.id]);

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
        className={`relative w-full flex flex-col gap-4 ${isLoading ? "opacity-40 pointer-events-none" : ""}`}
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
