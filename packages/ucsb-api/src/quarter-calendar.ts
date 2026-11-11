import { UcsbClient } from "./client.ts";

/**
 * A quarter from the Academic Quarter Calendar API
 * (https://developer.ucsb.edu/content/academic-quarter-calendar).
 *
 * Dates are local (Pacific) timestamps without an offset, such as
 * "2026-09-24T00:00:00". Older quarters leave many of them null.
 */
export interface UcsbQuarter {
  /** Year followed by 1 (Winter), 2 (Spring), 3 (Summer) or 4 (Fall). */
  quarter: string;
  /** Short code, for example "F26". */
  qyy: string;
  /** For example "FALL 2026". */
  name: string;
  category: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  /** For example "2026-2027". */
  academicYear: string;
  firstDayOfClasses: string | null;
  lastDayOfClasses: string | null;
  firstDayOfFinals: string | null;
  lastDayOfFinals: string | null;
  firstDayOfQuarter: string | null;
  lastDayOfSchedule: string | null;
  pass1Begin: string | null;
  pass2Begin: string | null;
  pass3Begin: string | null;
  feeDeadline: string | null;
  lastDayToAddUnderGrad: string | null;
  lastDayToAddGrad: string | null;
  lastDayThirdWeek: string | null;
}

const BASE_PATH = "/academics/quartercalendar/v1";

/** Every quarter UCSB publishes, past and future. */
export const getQuarters = (client: UcsbClient) =>
  client.get<UcsbQuarter[]>(`${BASE_PATH}/quarters`);

/** The quarter UCSB considers current today. */
export const getCurrentQuarter = async (client: UcsbClient) => {
  const response = await client.get<UcsbQuarter | UcsbQuarter[]>(
    `${BASE_PATH}/quarters/current`
  );

  // The live API returns a single object; its documentation shows an array.
  return Array.isArray(response) ? response[0] : response;
};
