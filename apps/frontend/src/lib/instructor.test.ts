import { describe, expect, it } from "vitest";

import { formatInstructorName } from "@repo/common";

describe("formatInstructorName", () => {
  it("puts initials first with periods and capitalizes the family name", () => {
    expect(
      formatInstructorName({ familyName: "RAWLINGS", givenName: "J B" })
    ).toBe("J. B. Rawlings");
    expect(formatInstructorName({ familyName: "SALEEM", givenName: "M" })).toBe(
      "M. Saleem"
    );
  });

  it("handles hyphens, apostrophes and Mc", () => {
    expect(
      formatInstructorName({ familyName: "ABU-OMAR", givenName: "M" })
    ).toBe("M. Abu-Omar");
    expect(
      formatInstructorName({ familyName: "D'ANTONIO", givenName: "R" })
    ).toBe("R. D'Antonio");
    expect(
      formatInstructorName({ familyName: "MCDONALD", givenName: "K" })
    ).toBe("K. McDonald");
    expect(
      formatInstructorName({ familyName: "FOUQUE", givenName: "J-P" })
    ).toBe("J.-P. Fouque");
  });

  it("handles names without initials and placeholders", () => {
    expect(
      formatInstructorName({ familyName: "HUANG YU", givenName: "" })
    ).toBe("Huang Yu");
    expect(formatInstructorName({ familyName: "STAFF", givenName: "" })).toBe(
      "Staff"
    );
    expect(formatInstructorName({ familyName: "T", givenName: "B A" })).toBe(
      "TBA"
    );
    expect(formatInstructorName({})).toBe("");
  });

  it("capitalizes full given names", () => {
    expect(
      formatInstructorName({ familyName: "ZHOU", givenName: "BOHAN" })
    ).toBe("Bohan Zhou");
  });
});
