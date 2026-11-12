/**
 * UCSB class (lecture) numbers are four digits, "0100", "0200", and appear
 * that way in GOLD, so they are shown as-is.
 */
export const formatClassNumber = (number: string | undefined | null): string =>
  number?.trim() ?? "";
