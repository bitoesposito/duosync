import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Appointment, AppointmentCategory } from "@/types";

dayjs.extend(customParseFormat);

const HOUR_FORMAT = "HH:mm";
const DAY_START = "00:00";
const DAY_END = "24:00";

export type TimelineSegmentCategory = AppointmentCategory | "available";

export type TimelineSegment = {
  id: string;
  left: number;
  width: number;
  category: TimelineSegmentCategory;
  startTime: string;
  endTime: string;
};

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


