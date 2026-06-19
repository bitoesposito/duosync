import { describe, expect, it } from "vitest";
import { findFirstAvailableSlot, getAvailableSlots } from "../shared/slots";

const block = (startTime: string, endTime: string) => ({ startTime, endTime });

describe("findFirstAvailableSlot", () => {
  it("returns the start of the day when empty", () => {
    expect(findFirstAvailableSlot([])).toBe("00:00");
  });
  it("jumps past an appointment you start inside of", () => {
    expect(findFirstAvailableSlot([block("09:00", "10:00")], "09:00")).toBe("10:00");
  });
  it("returns null when the day is full from the search point", () => {
    expect(findFirstAvailableSlot([block("00:00", "23:59")])).toBeNull();
  });
});

describe("getAvailableSlots", () => {
  it("lists the gaps around appointments", () => {
    expect(getAvailableSlots([block("09:00", "10:00")])).toEqual([
      { start: "00:00", end: "09:00" },
      { start: "10:00", end: "23:59" },
    ]);
  });
  it("returns no gaps for a fully booked day", () => {
    expect(getAvailableSlots([block("00:00", "23:59")])).toEqual([]);
  });
});
