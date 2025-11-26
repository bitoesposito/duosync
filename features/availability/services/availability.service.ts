import dayjs, { TWENTY_FOUR_HOUR_FORMAT as HOUR_FORMAT } from "@/lib/time/dayjs";
import {
  Appointment,
  TimelineSegment,
  TimelineSegmentCategory,
} from "@/types";

const DAY_START = "00:00";
const DAY_END = "23:59";

const dayStart = dayjs(DAY_START, HOUR_FORMAT);
const dayEnd = dayjs(DAY_END, HOUR_FORMAT);
const dayDuration = dayEnd.diff(dayStart, "minute");

const timeToPercent = (time: string) => {
  return (
    (dayjs(time, HOUR_FORMAT).diff(dayStart, "minute") / dayDuration) * 100
  );
};

/**
 * Returns the appointments sorted by their start time.
 */
const sortByStart = (appointments: Appointment[]) => {
  return [...appointments].sort((a, b) =>
    dayjs(a.startTime, HOUR_FORMAT).diff(dayjs(b.startTime, HOUR_FORMAT))
  );
};

/**
 * Converts the appointments of the day into timeline segments,
 * filling the gaps with "available" blocks.
 * This is the single-user version (for personal view).
 */
export function buildTimelineSegments(
  appointments: Appointment[]
): TimelineSegment[] {
  const sorted = sortByStart(appointments);
  const segments: TimelineSegment[] = [];
  let currentTime = dayStart;

  sorted.forEach((appointment) => {
    const appointmentStart = dayjs(appointment.startTime, HOUR_FORMAT);
    const appointmentEnd = dayjs(appointment.endTime, HOUR_FORMAT);

    if (appointmentStart.isAfter(currentTime)) {
      segments.push({
        id: `available-${currentTime.format(HOUR_FORMAT)}`,
        left: timeToPercent(currentTime.format(HOUR_FORMAT)),
        width:
          timeToPercent(appointment.startTime) -
          timeToPercent(currentTime.format(HOUR_FORMAT)),
        category: "available",
        startTime: currentTime.format(HOUR_FORMAT),
        endTime: appointment.startTime,
      });
    }

    segments.push({
      id: appointment.id,
      left: timeToPercent(appointment.startTime),
      width:
        timeToPercent(appointment.endTime) -
        timeToPercent(appointment.startTime),
      category: appointment.category,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    });

    currentTime = appointmentEnd;
  });

  if (currentTime.isBefore(dayEnd)) {
    segments.push({
      id: `available-${currentTime.format(HOUR_FORMAT)}`,
      left: timeToPercent(currentTime.format(HOUR_FORMAT)),
      width:
        timeToPercent(DAY_END) -
        timeToPercent(currentTime.format(HOUR_FORMAT)),
      category: "available",
      startTime: currentTime.format(HOUR_FORMAT),
      endTime: DAY_END,
    });
  }

  return segments.filter((segment) => segment.width > 0);
}

/**
 * Checks if a time range overlaps with any appointment (excluding sleep, which is handled separately).
 */
function isTimeRangeOccupied(
  startTime: string,
  endTime: string,
  appointments: Appointment[]
): boolean {
  const start = dayjs(startTime, HOUR_FORMAT);
  const end = dayjs(endTime, HOUR_FORMAT);

  return appointments.some((appointment) => {
    // Skip sleep appointments - they are handled separately
    if (appointment.category === "sleep") {
      return false;
    }
    
    const appointmentStart = dayjs(appointment.startTime, HOUR_FORMAT);
    const appointmentEnd = dayjs(appointment.endTime, HOUR_FORMAT);

    // Check for overlap
    return (
      start.isBefore(appointmentEnd) && end.isAfter(appointmentStart)
    );
  });
}

/**
 * Gets the category for a time segment based on both users' appointments.
 * Priority: sleep (if either user is sleeping) > other (if current user is busy) > match (both free) > available (only current user free)
 */
function getSegmentCategory(
  startTime: string,
  endTime: string,
  currentUserAppointments: Appointment[],
  otherUserAppointments: Appointment[]
): TimelineSegmentCategory {
  // Check if either user is sleeping in this time range (check first, highest priority)
  const currentUserSleeping = currentUserAppointments.some(
    (apt) =>
      apt.category === "sleep" &&
      dayjs(apt.startTime, HOUR_FORMAT).isBefore(dayjs(endTime, HOUR_FORMAT)) &&
      dayjs(apt.endTime, HOUR_FORMAT).isAfter(dayjs(startTime, HOUR_FORMAT))
  );
  const otherUserSleeping = otherUserAppointments.some(
    (apt) =>
      apt.category === "sleep" &&
      dayjs(apt.startTime, HOUR_FORMAT).isBefore(dayjs(endTime, HOUR_FORMAT)) &&
      dayjs(apt.endTime, HOUR_FORMAT).isAfter(dayjs(startTime, HOUR_FORMAT))
  );

  // If either user is sleeping, show as sleep
  if (currentUserSleeping || otherUserSleeping) {
    return "sleep";
  }

  // Check if users are busy (excluding sleep, which we already handled)
  const currentUserBusy = isTimeRangeOccupied(
    startTime,
    endTime,
    currentUserAppointments
  );
  const otherUserBusy = isTimeRangeOccupied(
    startTime,
    endTime,
    otherUserAppointments
  );

  // If current user is busy, show as other (busy)
  if (currentUserBusy) {
    return "other";
  }

  // If both users are free, show as match
  if (!currentUserBusy && !otherUserBusy) {
    return "match";
  }

  // If only current user is free (other is busy), show as available
  return "available";
}

/**
 * Builds timeline segments comparing appointments from both users.
 * Shows "match" when both users are free, "available" when only current user is free,
 * "sleep" when either user is sleeping, and "other" when current user is busy.
 */
export function buildSharedTimelineSegments(
  currentUserAppointments: Appointment[],
  otherUserAppointments: Appointment[]
): TimelineSegment[] {
  // Collect all time points from both users' appointments
  const timePoints = new Set<string>([DAY_START, DAY_END]);
  currentUserAppointments.forEach((appointment) => {
    timePoints.add(appointment.startTime);
    timePoints.add(appointment.endTime);
  });
  otherUserAppointments.forEach((appointment) => {
    timePoints.add(appointment.startTime);
    timePoints.add(appointment.endTime);
  });

  // Sort time points, handling "23:59" specially (it should always be last)
  const sortedTimePoints = Array.from(timePoints)
    .map((time) => {
      // Keep "23:59" as is, don't convert with dayjs
      if (time === DAY_END) {
        return { time, sortValue: 23 * 60 + 59 }; // 23:59 = 1439 minutes
      }
      const dayjsTime = dayjs(time, HOUR_FORMAT);
      return {
        time,
        sortValue: dayjsTime.diff(dayStart, "minute"),
      };
    })
    .sort((a, b) => a.sortValue - b.sortValue)
    .map((item) => item.time);

  const segments: TimelineSegment[] = [];

  // Create segments between time points
  for (let i = 0; i < sortedTimePoints.length - 1; i++) {
    const segmentStart = sortedTimePoints[i];
    const segmentEnd = sortedTimePoints[i + 1];

    const category = getSegmentCategory(
      segmentStart,
      segmentEnd,
      currentUserAppointments,
      otherUserAppointments
    );

    const left = timeToPercent(segmentStart);
    const right = timeToPercent(segmentEnd);
    const width = right - left;
    
    // Only add segment if width is positive (should always be true, but safety check)
    if (width > 0) {
      segments.push({
        id: `${category}-${segmentStart}-${segmentEnd}`,
        left,
        width,
        category,
        startTime: segmentStart,
        endTime: segmentEnd,
      });
    }
  }

  return segments;
}