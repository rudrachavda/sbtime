import { Logger } from "tslog";

import { ITermItem } from "@repo/common/models";
import {
  UcsbClient,
  UcsbQuarter,
  getCurrentQuarter,
  getQuarters,
} from "@repo/ucsb-api";

/**
 * UCSB has one academic calendar for everyone, so each quarter is stored once
 * under the undergraduate career. Graduate courses are told apart per course.
 */
export const TERM_CAREER_CODE = "UGRD";

/** Earliest quarter pulled by the full ("terms-all") sync: Fall 2015. */
export const EARLIEST_QUARTER = "20154";

/** How many quarters past the current one to pull. */
export const FUTURE_QUARTERS = 2;

const SEASONS = {
  "1": "Winter",
  "2": "Spring",
  "3": "Summer",
  "4": "Fall",
} as const;

export type Season = (typeof SEASONS)[keyof typeof SEASONS];

/**
 * Split a UCSB quarter code into its parts: "20264" is Fall 2026.
 * Returns null for anything that is not a valid code.
 */
export const parseQuarterCode = (
  code: string
): { year: number; season: Season } | null => {
  const match = /^(\d{4})([1-4])$/.exec(code.trim());
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    season: SEASONS[match[2] as keyof typeof SEASONS],
  };
};

/** Move a quarter code forward (or back, with a negative offset) by whole quarters. */
export const shiftQuarterCode = (code: string, offset: number): string => {
  const parsed = /^(\d{4})([1-4])$/.exec(code.trim());
  if (!parsed) throw new Error(`Invalid quarter code: "${code}"`);

  const index = parseInt(parsed[1], 10) * 4 + (parseInt(parsed[2], 10) - 1);
  const shifted = index + offset;

  return `${Math.floor(shifted / 4)}${(shifted % 4) + 1}`;
};

/** "2026-09-24T00:00:00" -> "2026-09-24" */
const toDate = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : undefined;

/** Keeps the time of day, which matters for registration passes. */
const toDateTime = (value: string | null | undefined) => value ?? undefined;

const temporalPositionOf = (
  code: string,
  currentCode: string
): ITermItem["temporalPosition"] => {
  // Codes are fixed width, so comparing them as strings is chronological.
  if (code === currentCode) return "Current";
  return code < currentCode ? "Past" : "Future";
};

/**
 * Convert a quarter from UCSB's calendar into a stored term. Returns null when
 * the quarter lacks the dates the app relies on (common for very old ones).
 */
export const formatQuarter = (
  quarter: UcsbQuarter,
  currentCode: string
): ITermItem | null => {
  const code = quarter.quarter?.trim();
  const parsed = code ? parseQuarterCode(code) : null;
  const beginDate = toDate(quarter.firstDayOfClasses);
  const endDate = toDate(quarter.lastDayOfFinals ?? quarter.lastDayOfClasses);

  if (!code || !parsed || !beginDate || !endDate) return null;

  const temporalPosition = temporalPositionOf(code, currentCode);

  return {
    academicCareerCode: TERM_CAREER_CODE,
    temporalPosition,
    id: code,
    // The backend looks terms up by this exact "<year> <season>" format.
    name: `${parsed.year} ${parsed.season}`,
    academicYear: quarter.academicYear?.trim() ?? "",
    beginDate,
    endDate,
    hasCatalogData: false,
    selfServiceEnrollBeginDate: toDate(quarter.pass1Begin),
    firstDayOfQuarter: toDate(quarter.firstDayOfQuarter),
    lastDayOfClasses: toDate(quarter.lastDayOfClasses),
    firstDayOfFinals: toDate(quarter.firstDayOfFinals),
    lastDayOfFinals: toDate(quarter.lastDayOfFinals),
    lastDayOfSchedule: toDate(quarter.lastDayOfSchedule),
    pass1Begin: toDateTime(quarter.pass1Begin),
    pass2Begin: toDateTime(quarter.pass2Begin),
    pass3Begin: toDateTime(quarter.pass3Begin),
    feeDeadline: toDate(quarter.feeDeadline),
    lastDayToAddUndergrad: toDate(quarter.lastDayToAddUnderGrad),
    lastDayToAddGrad: toDate(quarter.lastDayToAddGrad),
    // Summer sessions (A, B, ...) are added once UCSB publishes them; every
    // quarter has at least its regular session.
    sessions: [
      {
        temporalPosition,
        id: "1",
        name: "Regular Academic Session",
        beginDate,
        endDate,
      },
    ],
  };
};

/**
 * Pick and convert the quarters between two codes (inclusive), oldest first.
 */
export const selectTerms = (
  quarters: UcsbQuarter[],
  currentCode: string,
  fromCode: string,
  toCode: string
): { terms: ITermItem[]; skipped: string[] } => {
  const terms: ITermItem[] = [];
  const skipped: string[] = [];

  for (const quarter of quarters) {
    const code = quarter.quarter?.trim();
    if (!code || code < fromCode || code > toCode) continue;

    const term = formatQuarter(quarter, currentCode);
    if (term) terms.push(term);
    else skipped.push(code);
  }

  terms.sort((a, b) => a.id.localeCompare(b.id));

  return { terms, skipped };
};

const fetchTerms = async (
  logger: Logger<unknown>,
  apiKey: string,
  range: (currentCode: string) => { from: string; to: string }
) => {
  const client = new UcsbClient({ apiKey });

  logger.trace("Fetching UCSB quarter calendar...");

  const [quarters, current] = await Promise.all([
    getQuarters(client),
    getCurrentQuarter(client),
  ]);

  const currentCode = current?.quarter?.trim();
  if (!currentCode || !parseQuarterCode(currentCode)) {
    throw new Error("UCSB did not report a valid current quarter.");
  }

  const { from, to } = range(currentCode);
  const { terms, skipped } = selectTerms(quarters, currentCode, from, to);

  if (skipped.length > 0) {
    logger.warn(
      `Skipped ${skipped.length} quarters with missing dates: ${skipped.join(", ")}`
    );
  }

  logger.info(
    `Fetched ${terms.length} terms from ${from} to ${to} (current: ${currentCode}).`
  );

  return terms;
};

/**
 * The previous quarter, the current one, and the next few.
 */
export const getNearbyTerms = (logger: Logger<unknown>, apiKey: string) =>
  fetchTerms(logger, apiKey, (currentCode) => ({
    from: shiftQuarterCode(currentCode, -1),
    to: shiftQuarterCode(currentCode, FUTURE_QUARTERS),
  }));

/**
 * Every quarter from EARLIEST_QUARTER through the next few.
 */
export const getAllTerms = (logger: Logger<unknown>, apiKey: string) =>
  fetchTerms(logger, apiKey, (currentCode) => ({
    from: EARLIEST_QUARTER,
    to: shiftQuarterCode(currentCode, FUTURE_QUARTERS),
  }));
