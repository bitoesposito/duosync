"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  buildTimelineSegments,
  type TimelineSegmentCategory,
} from "@/features/availability";
import { useAppointments, useI18n } from "@/hooks";
import AvailabilityGridSkeleton from "./availability-grid-skeleton";

const segmentColorMap: Record<TimelineSegmentCategory, string> = {
  available: "bg-emerald-400 dark:bg-emerald-600",
  sleep: "bg-indigo-200 dark:bg-indigo-900",
  other: "bg-slate-200 dark:bg-slate-700",
};

export default function AvailabilityGrid() {
  const { appointments, isLoading } = useAppointments();
  const { t } = useI18n();
  const segments = buildTimelineSegments(appointments);

  const legendItems: { category: TimelineSegmentCategory; label: string }[] = [
    { category: "available", label: t("availability.legendMatch") },
    { category: "other", label: t("availability.legendBusy") },
    { category: "sleep", label: t("availability.legendSleep") },
  ];

  return (
    <section className="w-full flex flex-col gap-4 border-b border-border">
      <header className="flex flex-col sm:flex-row justify-between gap-4 select-none">
        <h3 className="text-lg font-medium tracking-tight">
          {t("availability.title")}
        </h3>
        <ul className="flex gap-6 text-xs font-medium text-muted-foreground">
          {legendItems.map((item) => (
            <li key={item.category} className="flex items-center gap-2">
              <span
                className={`w-3 h-3 ${segmentColorMap[item.category]}`}
              ></span>
              {item.label}
            </li>
          ))}
        </ul>
      </header>

      <TooltipProvider>
        <div className="relative w-full">
          {isLoading ? (
            <AvailabilityGridSkeleton />
          ) : (
            <div className="relative w-full h-12 border border-border bg-muted/10">
              {segments.map((segment) => (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute h-full ${segmentColorMap[segment.category]} transition-opacity hover:opacity-90 cursor-pointer border-r border-background last:border-r-0`}
                      style={{
                        left: `${segment.left}%`,
                        width: `${segment.width}%`,
                        minWidth: "1px",
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="rounded-none border-border">
                    <p className="font-medium">
                      {segment.startTime} - {segment.endTime}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>
    </section>
  );
}
