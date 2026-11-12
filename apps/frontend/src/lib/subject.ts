import SUBJECT_CODES from "./subject-codes.json";

const OFFICIAL: Record<string, string> = SUBJECT_CODES;

/**
 * Subjects are stored without spaces ("ASAM"); show them the way GOLD does
 * ("AS AM"). Codes without a space are returned unchanged.
 */
export const formatSubject = (subject: string | null | undefined): string =>
  subject
    ? (OFFICIAL[subject.replace(/\s+/g, "").toUpperCase()] ?? subject)
    : "";
