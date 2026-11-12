import { describe, expect, it } from "vitest";

import { buildings, resolveLocation } from "./location";

describe("resolveLocation", () => {
  it("names the building and keeps the room number", () => {
    const resolved = resolveLocation("PHELP 2524");
    expect(resolved?.label).toBe("Phelps Hall 2524");
    expect(resolved?.room).toBe("2524");
    expect(resolved?.coordinates).toEqual(buildings.PHELP.location);
    expect(resolved?.link).toMatch(
      /^https:\/\/www\.google\.com\/maps\/search\//
    );
  });

  it("handles codes with a hyphen", () => {
    expect(resolveLocation("PSB-N 2637")?.label).toBe(
      "Physical Sciences Building North 2637"
    );
  });

  it("shows named rooms by their name", () => {
    expect(resolveLocation("CAMPB HALL")?.label).toBe("Campbell Hall");
    expect(resolveLocation("MUSIC LLCH")?.label).toBe(
      "Lotte Lehmann Concert Hall"
    );
    expect(resolveLocation("IV THEA1")?.label).toBe("Isla Vista Theater 1");
  });

  it("turns UCSB's placeholders into readable text without a pin", () => {
    expect(resolveLocation("ON LINE")).toEqual({
      label: "Online",
      placeholder: true,
    });
    expect(resolveLocation("NO ROOM")?.label).toBe("To be determined");
    expect(resolveLocation("DEPT ROOM")?.label).toBe("Arranged by department");
    expect(resolveLocation("  OFF   CAMP ")?.label).toBe("Off campus");
  });

  it("shows unknown or unpinned buildings as text", () => {
    expect(resolveLocation("ZZZ 101")).toEqual({
      label: "ZZZ 101",
      room: "101",
      placeholder: false,
    });
    const unpinned = resolveLocation("NCEAS 101");
    expect(unpinned?.label).toBe(
      "NCEAS (1021 Anacapa St, downtown Santa Barbara) 101"
    );
    expect(unpinned?.coordinates).toBeUndefined();
  });

  it("returns null for empty input", () => {
    expect(resolveLocation(null)).toBeNull();
    expect(resolveLocation("  ")).toBeNull();
  });

  it("only pins buildings on or near campus", () => {
    for (const building of Object.values(buildings)) {
      if (!building.location) continue;
      const [lng, lat] = building.location;
      expect(lng).toBeGreaterThan(-119.87);
      expect(lng).toBeLessThan(-119.83);
      expect(lat).toBeGreaterThan(34.4);
      expect(lat).toBeLessThan(34.43);
    }
  });
});
