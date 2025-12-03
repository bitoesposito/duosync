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
 * Pre-parsed appointment time range for efficient overlap checking.
 */
type ParsedAppointmentRange = {
  startMinutes: number;
  endMinutes: number;
  category: string;
};

/**
 * Converts time string to minutes since midnight for efficient comparison.
 */
function timeToMinutes(time: string): number {
  if (time === DAY_END) {
    return 23 * 60 + 59; // 1439 minutes
  }
  const parsed = dayjs(time, HOUR_FORMAT);
  return parsed.diff(dayStart, "minute");
}

/**
 * Pre-parses appointments into minute-based ranges for efficient overlap checking.
 */
function parseAppointmentsToRanges(appointments: Appointment[]): ParsedAppointmentRange[] {
  return appointments.map((apt) => ({
    startMinutes: timeToMinutes(apt.startTime),
    endMinutes: timeToMinutes(apt.endTime),
    category: apt.category,
  }));
}

/**
 * Checks if a time range overlaps with any appointment (excluding sleep, which is handled separately).
 * Optimized version using pre-parsed minute ranges.
 */
function isTimeRangeOccupied(
  startMinutes: number,
  endMinutes: number,
  parsedRanges: ParsedAppointmentRange[]
): boolean {
  return parsedRanges.some((range) => {
    // Skip sleep appointments - they are handled separately
    if (range.category === "sleep") {
      return false;
    }
    
    // Check for overlap: start < rangeEnd && end > rangeStart
    return startMinutes < range.endMinutes && endMinutes > range.startMinutes;
  });
}

/**
 * Gets the category for a time segment based on all users' appointments.
 * Priority: sleep (if any user is sleeping) > other (if current user is busy) > match (all users free) > available (only current user free)
 * Optimized version using pre-parsed appointment ranges.
 * @param startMinutes - Start time in minutes since midnight
 * @param endMinutes - End time in minutes since midnight
 * @param currentUserRanges - Pre-parsed appointment ranges for current user
 * @param allOtherUsersRanges - Array of pre-parsed appointment ranges for all other users
 * @returns Category for the segment
 */
function getSegmentCategory(
  startMinutes: number,
  endMinutes: number,
  currentUserRanges: ParsedAppointmentRange[],
  allOtherUsersRanges: ParsedAppointmentRange[][]
): TimelineSegmentCategory {
  // Check if current user is sleeping in this time range
  const currentUserSleeping = currentUserRanges.some(
    (range) =>
      range.category === "sleep" &&
      range.startMinutes < endMinutes &&
      range.endMinutes > startMinutes
  );

  // Check if any other user is sleeping (early exit on first match)
  if (!currentUserSleeping) {
    for (const userRanges of allOtherUsersRanges) {
      if (userRanges.some(
        (range) =>
          range.category === "sleep" &&
          range.startMinutes < endMinutes &&
          range.endMinutes > startMinutes
      )) {
        return "sleep";
      }
    }
  } else {
    return "sleep";
  }

  // Check if current user is busy (excluding sleep, which we already handled)
  const currentUserBusy = isTimeRangeOccupied(
    startMinutes,
    endMinutes,
    currentUserRanges
  );

  // If current user is busy, show as other (busy) - early exit
  if (currentUserBusy) {
    return "other";
  }

  // Check if all other users are free (early exit on first busy user)
  for (const userRanges of allOtherUsersRanges) {
    if (isTimeRangeOccupied(startMinutes, endMinutes, userRanges)) {
      // At least one other user is busy, current user is free
      return "available";
    }
  }

  // All users are free
  return "match";
}

/**
 * Builds timeline segments comparing appointments from current user and all other users.
 * Shows "match" when all users are free, "available" when only current user is free,
 * "sleep" when any user is sleeping, and "other" when current user is busy.
 * Optimized version that pre-parses appointments and uses minute-based comparisons.
 * @param currentUserAppointments - Appointments of the current user
 * @param allOtherUsersAppointments - Array of appointments arrays for all other users (each inner array represents one user's appointments)
 * @returns Array of timeline segments
 */
export function buildSharedTimelineSegments(
  currentUserAppointments: Appointment[],
  allOtherUsersAppointments: Appointment[][] | Appointment[]
): TimelineSegment[] {
  // Handle backward compatibility: if second parameter is a single array, convert to array of arrays
  const otherUsersAppointmentsArray: Appointment[][] = 
    allOtherUsersAppointments.length > 0 && Array.isArray(allOtherUsersAppointments[0])
      ? (allOtherUsersAppointments as Appointment[][])
      : [allOtherUsersAppointments as Appointment[]];

  // Pre-parse all appointments to minute-based ranges (one-time cost)
  const currentUserRanges = parseAppointmentsToRanges(currentUserAppointments);
  const allOtherUsersRanges = otherUsersAppointmentsArray.map(parseAppointmentsToRanges);

  // Collect all time points from all users' appointments
  const timePointsSet = new Set<string>([DAY_START, DAY_END]);
  currentUserAppointments.forEach((appointment) => {
    timePointsSet.add(appointment.startTime);
    timePointsSet.add(appointment.endTime);
  });
  otherUsersAppointmentsArray.forEach((userAppointments) => {
    userAppointments.forEach((appointment) => {
      timePointsSet.add(appointment.startTime);
      timePointsSet.add(appointment.endTime);
    });
  });

  // Convert time points to minutes and sort (more efficient than parsing multiple times)
  const timePointsWithMinutes = Array.from(timePointsSet).map((time) => ({
    time,
    minutes: timeToMinutes(time),
  }));

  // Sort by minutes (handles "23:59" correctly since it's 1439 minutes)
  timePointsWithMinutes.sort((a, b) => a.minutes - b.minutes);

  const segments: TimelineSegment[] = [];

  // Create segments between time points using pre-parsed ranges
  for (let i = 0; i < timePointsWithMinutes.length - 1; i++) {
    const segmentStart = timePointsWithMinutes[i];
    const segmentEnd = timePointsWithMinutes[i + 1];

    const category = getSegmentCategory(
      segmentStart.minutes,
      segmentEnd.minutes,
      currentUserRanges,
      allOtherUsersRanges
    );

    const left = timeToPercent(segmentStart.time);
    const right = timeToPercent(segmentEnd.time);
    const width = right - left;
    
    // Only add segment if width is positive (should always be true, but safety check)
    if (width > 0) {
      segments.push({
        id: `${category}-${segmentStart.time}-${segmentEnd.time}`,
        left,
        width,
        category,
        startTime: segmentStart.time,
        endTime: segmentEnd.time,
      });
    }
  }

  return segments;
}