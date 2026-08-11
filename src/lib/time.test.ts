import { describe, expect, it } from "vitest";
import { APP_TIME_ZONE, localDateKey, startOfLocalDay } from "./time";

describe("localDateKey", () => {
  it("uses the learner's calendar day, not the server's", () => {
    // 17:30Z is already the next morning in Taipei. The dashboard used to call
    // this "yesterday" while the stats chart called it "today".
    expect(localDateKey(new Date("2026-08-03T17:30:00.000Z"))).toBe("2026-08-04");
    expect(localDateKey(new Date("2026-08-03T15:59:00.000Z"))).toBe("2026-08-03");
  });
});

describe("startOfLocalDay", () => {
  it("returns the instant the local day began", () => {
    // Taipei is UTC+8 year-round, so local midnight is 16:00Z the day before.
    expect(startOfLocalDay(new Date("2026-08-04T09:00:00.000Z")).toISOString()).toBe("2026-08-03T16:00:00.000Z");
  });

  it("is stable anywhere inside the same local day", () => {
    const morning = startOfLocalDay(new Date("2026-08-03T16:00:00.000Z"));
    const evening = startOfLocalDay(new Date("2026-08-04T15:59:59.000Z"));

    expect(morning.toISOString()).toBe(evening.toISOString());
  });

  it("never returns an instant later than the moment it was given", () => {
    for (const iso of ["2026-01-01T00:00:00.000Z", "2026-08-04T15:59:00.000Z", "2026-12-31T23:59:59.000Z"]) {
      const now = new Date(iso);
      expect(startOfLocalDay(now).getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });

  it("agrees with localDateKey about which day it is", () => {
    const now = new Date("2026-08-03T17:30:00.000Z");

    expect(localDateKey(startOfLocalDay(now))).toBe(localDateKey(now));
  });

  it("handles a zone with a non-hour offset", () => {
    // Kathmandu is UTC+05:45; a whole-hour assumption would be 45 minutes off.
    expect(startOfLocalDay(new Date("2026-08-04T09:00:00.000Z"), "Asia/Kathmandu").toISOString()).toBe(
      "2026-08-03T18:15:00.000Z"
    );
  });

  it("defaults to the app timezone", () => {
    expect(APP_TIME_ZONE).toBe("Asia/Taipei");
    expect(startOfLocalDay(new Date("2026-08-04T09:00:00.000Z")).toISOString()).toBe(
      startOfLocalDay(new Date("2026-08-04T09:00:00.000Z"), APP_TIME_ZONE).toISOString()
    );
  });
});
