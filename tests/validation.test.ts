import { describe, expect, it } from "vitest";
import { validateOneTime, validateRecurring, validateUserName, wouldOverlap } from "../shared/validation";
import type { Appointment, AppointmentInput, DayId } from "../shared/types";

const input = (over: Partial<AppointmentInput> = {}): AppointmentInput => ({
  startTime: "09:00",
  endTime: "10:00",
  category: "other",
  isRepeating: false,
  repeatDays: [],
  ...over,
});

const existing = (startTime: string, endTime: string, id = "x"): Appointment => ({
  id,
  startTime,
  endTime,
  category: "other",
  isRepeating: false,
  repeatDays: [],
});

describe("validateOneTime", () => {
  it("rejects invalid time format", () => {
    expect(validateOneTime(input({ startTime: "9am" }), [])).toEqual({ ok: false, reason: "invalid-format" });
  });
  it("rejects end before start", () => {
    expect(validateOneTime(input({ startTime: "10:00", endTime: "09:00" }), [])).toEqual({
      ok: false,
      reason: "end-before-start",
    });
  });
  it("accepts an afternoon appointment ending at 00:00 (end-of-day)", () => {
    expect(validateOneTime(input({ startTime: "22:00", endTime: "00:00" }), [])).toEqual({ ok: true });
  });
  it("detects overlap and allows touching edges", () => {
    const list = [existing("09:00", "11:00")];
    expect(validateOneTime(input({ startTime: "10:00", endTime: "12:00" }), list)).toEqual({
      ok: false,
      reason: "overlap",
    });
    expect(validateOneTime(input({ startTime: "11:00", endTime: "12:00" }), list)).toEqual({ ok: true });
  });
  it("excludes the appointment being edited from its own overlap check", () => {
    const list = [existing("09:00", "11:00", "self")];
    expect(validateOneTime(input({ startTime: "09:00", endTime: "11:00" }), list, "self")).toEqual({ ok: true });
  });
});

describe("wouldOverlap", () => {
  it("normalizes the new end time before comparing", () => {
    // 22:00–00:00 (end-of-day) overlaps a 23:00–23:30 block
    expect(wouldOverlap("22:00", "00:00", [existing("23:00", "23:30")])).toBe(true);
  });
});

describe("validateRecurring", () => {
  const days = (...d: DayId[]) => d;

  it("requires at least one weekday", () => {
    expect(validateRecurring(input({ isRepeating: true, repeatDays: [] }), [], [])).toEqual({
      ok: false,
      reason: "no-days",
    });
  });
  it("conflicts only with templates that share a weekday", () => {
    const monWed = { id: "m", startTime: "09:00", endTime: "10:00", repeatDays: days(1, 3) };
    // New on Tue/Thu — no shared day → ok despite same time
    expect(
      validateRecurring(input({ isRepeating: true, repeatDays: days(2, 4) }), [monWed], []),
    ).toEqual({ ok: true });
    // New on Mon — shares a day and overlaps in time → conflict
    expect(
      validateRecurring(input({ isRepeating: true, repeatDays: days(1) }), [monWed], []),
    ).toEqual({ ok: false, reason: "overlap" });
  });
  it("conflicts with one-time appointments on a selected weekday", () => {
    const oneTimeMon = { id: "o", startTime: "09:30", endTime: "10:30", dayOfWeek: 1 as DayId };
    expect(
      validateRecurring(input({ isRepeating: true, repeatDays: days(1) }), [], [oneTimeMon]),
    ).toEqual({ ok: false, reason: "overlap" });
  });
});

describe("validateUserName", () => {
  it("requires a non-empty name", () => {
    expect(validateUserName("")).toBe("name-required");
    expect(validateUserName("   ")).toBe("name-required");
  });
  it("rejects overly long names", () => {
    expect(validateUserName("a".repeat(61))).toBe("name-too-long");
  });
  it("accepts a normal name", () => {
    expect(validateUserName("Alice")).toBeNull();
  });
});
