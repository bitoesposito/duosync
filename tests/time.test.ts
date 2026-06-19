import { describe, expect, it } from "vitest";
import {
  DAY_MINUTES,
  isValidTime,
  minutesToTime,
  normalizeEndTime,
  overlaps,
  timeToMinutes,
  timeToPercent,
} from "../shared/time";

describe("isValidTime", () => {
  it("accepts strict HH:mm in 00:00–23:59", () => {
    for (const t of ["00:00", "09:30", "12:00", "23:59"]) expect(isValidTime(t)).toBe(true);
  });
  it("rejects 24:00, out-of-range, and malformed", () => {
    for (const t of ["24:00", "9:30", "23:60", "24:01", "ab:cd", "", "1230"]) {
      expect(isValidTime(t)).toBe(false);
    }
  });
});

describe("timeToMinutes", () => {
  it("maps times to minutes since midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("12:00")).toBe(720);
  });
  it("treats 23:59 and the 24:00 sentinel as end-of-day (1439)", () => {
    expect(timeToMinutes("23:59")).toBe(DAY_MINUTES);
    expect(timeToMinutes("24:00")).toBe(DAY_MINUTES);
  });
  it("returns NaN for invalid input", () => {
    expect(Number.isNaN(timeToMinutes("nope"))).toBe(true);
  });
});

describe("minutesToTime", () => {
  it("inverts timeToMinutes and clamps the end of day", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(720)).toBe("12:00");
    expect(minutesToTime(DAY_MINUTES)).toBe("23:59");
    expect(minutesToTime(5000)).toBe("23:59");
  });
});

describe("timeToPercent", () => {
  it("positions times on the 0–100 axis", () => {
    expect(timeToPercent("00:00")).toBe(0);
    expect(timeToPercent("23:59")).toBe(100);
    expect(timeToPercent("12:00")).toBeCloseTo((720 / 1439) * 100, 5);
  });
});

describe("normalizeEndTime", () => {
  it("normalizes 24:00 to 23:59", () => {
    expect(normalizeEndTime("13:00", "24:00")).toBe("23:59");
  });
  it("treats 00:00 end as end-of-day only when start is in the afternoon/evening", () => {
    expect(normalizeEndTime("13:00", "00:00")).toBe("23:59");
    expect(normalizeEndTime("10:00", "00:00")).toBe("00:00");
  });
  it("leaves ordinary end times unchanged", () => {
    expect(normalizeEndTime("10:00", "11:00")).toBe("11:00");
  });
});

describe("overlaps", () => {
  it("is true for intersecting half-open intervals", () => {
    expect(overlaps(540, 660, 600, 720)).toBe(true);
  });
  it("is false for merely touching intervals", () => {
    expect(overlaps(540, 600, 600, 660)).toBe(false);
  });
});
