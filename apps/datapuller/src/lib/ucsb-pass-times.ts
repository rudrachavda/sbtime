import { DateTime } from "luxon";

import { parseQuarterCode } from "./terms";

const CAMPUS_ZONE = "America/Los_Angeles";

export interface PassTimeTerm {
  id: string;
  pass1Begin?: string | null;
  pass2Begin?: string | null;
  pass3Begin?: string | null;
  lastDayToAddUndergrad?: string | null;
}

export interface PassTimeframe {
  termId: string;
  year: number;
  semester: string;
  phase: number;
  isAdjustment: false;
  group: "all";
  startDate: Date;
  endDate?: Date;
  startEventSummary: string;
}

/** Read a campus-local date or date-time ("2026-05-11T09:00:00") as an instant. */
const toCampusDate = (value: string | null | undefined): Date | undefined => {
  if (!value) return undefined;
  const parsed = DateTime.fromISO(value.trim(), { zone: CAMPUS_ZONE });
  return parsed.isValid ? parsed.toJSDate() : undefined;
};

/**
 * Turn a quarter's registration pass dates into enrollment timeframes, the
 * shape the Enrollment graph uses for its phase markers. UCSB has three
 * passes open to all students; each runs until the next one starts, and
 * Pass 3 runs until the last day to add.
 */
export const buildPassTimeframes = (term: PassTimeTerm): PassTimeframe[] => {
  const quarter = parseQuarterCode(term.id);
  if (!quarter) return [];

  const starts = [term.pass1Begin, term.pass2Begin, term.pass3Begin].map(
    toCampusDate
  );
  const lastDayToAdd = toCampusDate(term.lastDayToAddUndergrad);

  const timeframes: PassTimeframe[] = [];
  starts.forEach((startDate, index) => {
    if (!startDate) return;
    const endDate = starts.slice(index + 1).find(Boolean) ?? lastDayToAdd;
    timeframes.push({
      termId: term.id,
      year: quarter.year,
      semester: quarter.season,
      phase: index + 1,
      isAdjustment: false,
      group: "all",
      startDate,
      ...(endDate && endDate > startDate ? { endDate } : {}),
      startEventSummary: `Pass ${index + 1} begins`,
    });
  });

  return timeframes;
};
