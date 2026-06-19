import { describe, expect, it } from "vitest";
import { buildSharedTimelineSegments, buildTimelineSegments } from "../shared/timeline";
import type { Appointment, AppointmentCategory } from "../shared/types";

let counter = 0;
const appt = (
  startTime: string,
  endTime: string,
  category: AppointmentCategory = "other",
): Appointment => ({
  id: `a${counter++}`,
  startTime,
  endTime,
  category,
  isRepeating: false,
  repeatDays: [],
});

/** Category of the segment that starts at a given time. */
const catAt = (segments: { startTime: string; category: string }[], startTime: string) =>
  segments.find((s) => s.startTime === startTime)?.category;

describe("buildTimelineSegments (personal)", () => {
  it("fills an empty day with a single full-width available segment", () => {
    const segments = buildTimelineSegments([]);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ category: "available", startTime: "00:00", endTime: "23:59" });
    expect(segments[0].width).toBeCloseTo(100, 5);
  });

  it("brackets a midday appointment with available gaps", () => {
    const segments = buildTimelineSegments([appt("09:00", "10:00", "other")]);
    expect(segments.map((s) => s.category)).toEqual(["available", "other", "available"]);
    expect(segments.map((s) => s.startTime)).toEqual(["00:00", "09:00", "10:00"]);
  });

  it("omits the leading gap when the day starts with an appointment", () => {
    const segments = buildTimelineSegments([appt("00:00", "08:00", "sleep")]);
    expect(segments.map((s) => s.category)).toEqual(["sleep", "available"]);
  });

  it("omits the trailing gap when an appointment ends at end-of-day", () => {
    const segments = buildTimelineSegments([appt("22:00", "23:59", "sleep")]);
    expect(segments.map((s) => s.category)).toEqual(["available", "sleep"]);
  });
});

describe("buildSharedTimelineSegments (priority cascade)", () => {
  it("is all match when everyone is free", () => {
    const segments = buildSharedTimelineSegments([], []);
    expect(segments).toHaveLength(1);
    expect(segments[0].category).toBe("match");
  });

  it("marks the current user's busy slot as other, rest match", () => {
    const segments = buildSharedTimelineSegments([appt("09:00", "10:00", "other")], []);
    expect(catAt(segments, "00:00")).toBe("match");
    expect(catAt(segments, "09:00")).toBe("other");
    expect(catAt(segments, "10:00")).toBe("match");
  });

  it("marks a slot available when current is free but another user is busy", () => {
    const segments = buildSharedTimelineSegments([], [[appt("09:00", "10:00", "other")]]);
    expect(catAt(segments, "09:00")).toBe("available");
    expect(catAt(segments, "00:00")).toBe("match");
  });

  it("treats ANY user's sleep as sleep (current or other)", () => {
    const a = buildSharedTimelineSegments([appt("23:00", "23:59", "sleep")], []);
    expect(catAt(a, "23:00")).toBe("sleep");
    const b = buildSharedTimelineSegments([], [[appt("23:00", "23:59", "sleep")]]);
    expect(catAt(b, "23:00")).toBe("sleep");
  });

  it("does not let another user's sleep read as 'available' (sleep wins, not busy)", () => {
    const segments = buildSharedTimelineSegments([], [[appt("09:00", "10:00", "sleep")]]);
    expect(catAt(segments, "09:00")).toBe("sleep");
  });

  it("prefers 'other' over 'available' when current user is also busy", () => {
    const segments = buildSharedTimelineSegments(
      [appt("09:00", "10:00", "other")],
      [[appt("09:00", "10:00", "other")]],
    );
    expect(catAt(segments, "09:00")).toBe("other");
  });
});
