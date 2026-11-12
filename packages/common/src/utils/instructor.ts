/**
 * Instructor names arrive the way UCSB's Registrar stores them: an upper-case
 * family name and initials ("RAWLINGS", "J B"). Shown as "J. B. Rawlings".
 */

const capitalizeWord = (word: string) =>
  word
    .toLowerCase()
    // Capitalize after a hyphen or apostrophe too: Abu-Omar, D'Antonio.
    .replace(
      /(^|[-'])([a-z])/g,
      (_, before: string, letter: string) => `${before}${letter.toUpperCase()}`
    )
    .replace(/^Mc([a-z])/, (_, letter: string) => `Mc${letter.toUpperCase()}`);

/** "J B" -> "J. B.", "J-P" -> "J.-P."; full given names are capitalized. */
export const formatGivenName = (givenName: string | null | undefined) =>
  (givenName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      /^[A-Za-z](-[A-Za-z])*$/.test(part)
        ? part
            .split("-")
            .map((initial) => `${initial.toUpperCase()}.`)
            .join("-")
        : capitalizeWord(part)
    )
    .join(" ");

/** "RAWLINGS" -> "Rawlings", "ABU-OMAR" -> "Abu-Omar". */
export const formatFamilyName = (familyName: string | null | undefined) =>
  (familyName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");

/** "J. B. Rawlings". Placeholders such as "T B A" become "TBA". */
export const formatInstructorName = ({
  givenName,
  familyName,
}: {
  givenName?: string | null;
  familyName?: string | null;
}) => {
  const raw = `${familyName ?? ""}${givenName ?? ""}`.replace(/\s+/g, "");
  if (raw.toUpperCase() === "TBA") return "TBA";

  return [formatGivenName(givenName), formatFamilyName(familyName)]
    .filter(Boolean)
    .join(" ");
};
