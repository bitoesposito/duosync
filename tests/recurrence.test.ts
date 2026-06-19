import { describe, expect, it } from "vitest";
import { appliesOn, dayOfWeek, expandRecurringForDate, expandRecurringList } from "../shared/recurrence";
import type { Appointment } from "../shared/types";

const template = (repeatDays: Appointment["repeatDays"]): Appointment => ({
  id: "tmpl",
  startTime: "09:00",
  endTime: "10:00",
  category: "other",
  isRepeating: true,
  repeatDays,
});

describe("dayOfWeek", () => {
  it("maps dates to 1–7 (Mon–Sun)", () => {
    expect(dayOfWeek("2025-01-20")).toBe(1); // Monday
    expect(dayOfWeek("2025-01-22")).toBe(3); // Wednesday
    expect(dayOfWeek("2025-01-25")).toBe(6); // Saturday
    expect(dayOfWeek("2025-01-19")).toBe(7); // Sunday
  });
});

describe("appliesOn", () => {
  it("matches the date's weekday against repeatDays", () => {
    expect(appliesOn(template([1, 3, 5]), "2025-01-20")).toBe(true); // Monday
    expect(appliesOn(template([1, 3, 5]), "2025-01-21")).toBe(false); // Tuesday
  });
});

describe("expandRecurringForDate", () => {
  it("produces a date-suffixed instance preserving the template fields", () => {
    const instance = expandRecurringForDate(template([1]), "2025-01-20");
    expect(instance.id).toBe("tmpl-2025-01-20");
    expect(instance.startTime).toBe("09:00");
    expect(instance.category).toBe("other");
  });
});

describe("expandRecurringList", () => {
  it("keeps only templates that apply on the date", () => {
    const monday = template([1]);
    const tuesday = { ...template([2]), id: "tue" };
    const result = expandRecurringList([monday, tuesday], "2025-01-20"); // Monday
    expect(result.map((r) => r.id)).toEqual(["tmpl-2025-01-20"]);
  });
});
