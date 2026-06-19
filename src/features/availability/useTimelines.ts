import { useMemo } from "react";
import { buildSharedTimelineSegments, buildTimelineSegments } from "@shared";
import type { DayAppointment, TimelineSegment } from "@shared";

interface Timelines {
  personal: TimelineSegment[];
  shared: TimelineSegment[];
}

export function useTimelines(
  batch: Record<number, DayAppointment[]> | undefined,
  activeUserId: number | null,
): Timelines {
  return useMemo(() => {
    if (!batch || activeUserId == null) return { personal: [], shared: [] };
    const mine = batch[activeUserId] ?? [];
    const others = Object.entries(batch)
      .filter(([id]) => Number(id) !== activeUserId)
      .map(([, list]) => list);
    return {
      personal: buildTimelineSegments(mine),
      shared: buildSharedTimelineSegments(mine, others),
    };
  }, [batch, activeUserId]);
}
