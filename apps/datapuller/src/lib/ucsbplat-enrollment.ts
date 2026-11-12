import { DateTime } from "luxon";

import { ISectionItem } from "@repo/common/models";

import { toPlainText } from "./ucsb-course-catalog";
import { EnrollmentEntry } from "./ucsb-enrollment";
import { UCSBPLAT_BASE_URL } from "./ucsbplat-course";

/**
 * Reads past enrollment charts from UCSBPlat (https://ucsbplat.com), which has
 * recorded seat counts since early 2024. Each course has a "past enrollment
 * trends" page listing its earlier offerings, six charts per page.
 */

export const ENROLLMENT_SOURCE = "ucsbplat";

const DAY_SECONDS = 24 * 60 * 60;
const ZONE = "America/Los_Angeles";

/**
 * UCSBPlat names a class by its first discussion section's enroll code, or the
 * lecture's when the class has no discussions.
 */
export const ucsbplatClassCode = (
  sections: { number: string; sectionId: string; primary?: boolean }[]
) => {
  const ordered = [...sections].sort((a, b) =>
    a.number.localeCompare(b.number)
  );
  return (ordered.find((section) => !section.primary) ?? ordered[0])?.sectionId;
};

/** "2027 Winter" + "29157" -> .../past_enrollment_trends/WINTER%202027%2029157?page=2 */
export const pastEnrollmentUrl = (
  year: number,
  season: string,
  enrollCode: string,
  page = 1
) => {
  const path = `${UCSBPLAT_BASE_URL}/curriculum/past_enrollment_trends/${encodeURIComponent(
    `${season.toUpperCase()} ${year} ${enrollCode}`
  )}`;
  return page > 1 ? `${path}?page=${page}` : path;
};

export interface EnrollmentChart {
  /** "Winter 2024" */
  quarter: string;
  /** "Kumar S L", or "T B A" */
  instructor?: string;
  /** "LSB 1001" */
  location?: string;
  /** Monday-first flags, from the day badges. */
  days: boolean[];
  /** "15:30" */
  startTime?: string;
  /** Date labels as printed: "Jan 29 2024", sometimes without a year: "Sep 22". */
  labels: string[];
  enrolled: number[];
  capacity: number[];
}

const DAY_INDEX: Record<string, number> = {
  M: 0,
  T: 1,
  W: 2,
  R: 3,
  F: 4,
  S: 5,
  U: 6,
};

const parseJsonArray = <T>(text: string | undefined): T[] => {
  if (!text) return [];
  try {
    const parsed = JSON.parse(`[${text}]`);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const datasetValues = (script: string, label: string) =>
  parseJsonArray<number>(
    new RegExp(`label:\\s*'${label}'[\\s\\S]*?data:\\s*\\[([^\\]]*)\\]`).exec(
      script
    )?.[1]
  ).map((value) => (typeof value === "number" ? value : Number(value)));

/**
 * Every chart on a past enrollment trends page, plus the number of pages.
 */
export const parsePastEnrollmentPage = (
  html: string
): { charts: EnrollmentChart[]; lastPage: number } => {
  const charts: EnrollmentChart[] = [];
  const cards = html
    .split(/<small class="card-title text-secondary">/)
    .slice(1);

  for (const card of cards) {
    const header = toPlainText(/^([\s\S]*?)<\/small>/.exec(card)?.[1]) ?? "";
    const [quarter, ...rest] = header.split(" . ");
    const script = /<script>([\s\S]*?)<\/script>/.exec(card)?.[1];
    if (!quarter || !script || !/enrollment-chart-/.test(script)) continue;

    const days = Array(7).fill(false);
    for (const badge of card.matchAll(
      /<span class="badge[^"]*">\s*([MTWRFSU])\s*<\/span>/g
    )) {
      days[DAY_INDEX[badge[1]]] = true;
    }

    const labels = parseJsonArray<string>(
      /labels:\s*\[([^\]]*)\]/.exec(script)?.[1]
    );

    charts.push({
      quarter: quarter.trim(),
      instructor: rest.join(" . ").trim() || undefined,
      location: toPlainText(
        /bi-geo-alt-fill"><\/i>([\s\S]*?)<\/small>/.exec(card)?.[1]
      ),
      days,
      // "15:30 PM - 16:45 PM": the clock is already 24-hour.
      startTime: /(\d{1,2}:\d{2})\s*[AP]M\s*-/
        .exec(card)?.[1]
        ?.padStart(5, "0"),
      labels,
      enrolled: datasetValues(script, "Enrolled"),
      capacity: datasetValues(script, "Capacity"),
    });
  }

  const pages = [...html.matchAll(/[?&]page=(\d+)/g)].map((match) =>
    Number(match[1])
  );
  return { charts, lastPage: Math.max(1, ...pages) };
};

const SEASON_DIGIT: Record<string, string> = {
  winter: "1",
  spring: "2",
  summer: "3",
  fall: "4",
};

/** "Winter 2024" -> "20241" */
export const quarterLabelToTermId = (label: string): string | null => {
  const match = /^(winter|spring|summer|fall)\s+(\d{4})$/i.exec(label.trim());
  return match ? `${match[2]}${SEASON_DIGIT[match[1].toLowerCase()]}` : null;
};

/**
 * Turn a printed date into noon Pacific on that day. Labels without a year
 * get the year that puts them closest to the quarter's first day.
 */
export const parseChartDate = (
  label: string,
  quarterBegin: DateTime
): DateTime | null => {
  const text = label.trim();
  const withYear = DateTime.fromFormat(text, "LLL dd yyyy", { zone: ZONE });
  if (withYear.isValid) return withYear.set({ hour: 12 });

  const year = quarterBegin.year;
  const options = [year - 1, year, year + 1]
    .map((candidate) =>
      DateTime.fromFormat(`${text} ${candidate}`, "LLL dd yyyy", { zone: ZONE })
    )
    .filter((date) => date.isValid);
  if (options.length === 0) return null;

  options.sort(
    (a, b) =>
      Math.abs(a.diff(quarterBegin).toMillis()) -
      Math.abs(b.diff(quarterBegin).toMillis())
  );
  return options[0].set({ hour: 12 });
};

/**
 * A lone day whose capacity is less than half or more than double the same
 * capacity on the days either side. These are another section's numbers
 * (for example 2 of 25 seats in the middle of a 529-seat lecture).
 */
const isStrayPoint = (points: { capacity: number }[], index: number) => {
  const before = points[index - 1]?.capacity;
  const after = points[index + 1]?.capacity;
  const capacity = points[index].capacity;
  if (before === undefined || after === undefined || before !== after) {
    return false;
  }
  return capacity * 2 < before || capacity > before * 2;
};

/**
 * Convert a chart's daily points into history entries, merging runs of days
 * with the same numbers into one entry.
 */
export const chartToEntries = (
  chart: EnrollmentChart,
  quarterBegin: DateTime
): EnrollmentEntry[] => {
  const points = chart.labels
    .map((label, index) => ({
      date: parseChartDate(label, quarterBegin),
      enrolled: chart.enrolled[index],
      capacity: chart.capacity[index],
    }))
    .filter(
      (
        point
      ): point is { date: DateTime; enrolled: number; capacity: number } =>
        point.date !== null &&
        Number.isFinite(point.enrolled) &&
        Number.isFinite(point.capacity)
    )
    .sort((a, b) => a.date.toMillis() - b.date.toMillis())
    .filter((point, index, all) => !isStrayPoint(all, index));

  const entries: EnrollmentEntry[] = [];

  for (const point of points) {
    const last = entries[entries.length - 1];
    const sameNumbers =
      last &&
      last.enrolledCount === point.enrolled &&
      last.maxEnroll === point.capacity;
    const nextDay =
      last &&
      point.date.diff(DateTime.fromJSDate(last.endTime), "days").days <= 1.01;

    if (last && sameNumbers && nextDay) {
      last.endTime = point.date.toJSDate();
      continue;
    }

    entries.push({
      startTime: point.date.toJSDate(),
      endTime: point.date.toJSDate(),
      granularitySeconds: DAY_SECONDS,
      status:
        point.capacity > 0 && point.enrolled >= point.capacity ? "C" : "O",
      enrolledCount: point.enrolled,
      maxEnroll: point.capacity,
      waitlistedCount: 0,
      maxWaitlist: 0,
      source: ENROLLMENT_SOURCE,
    });
  }

  return entries;
};

const squash = (value: string | undefined) =>
  (value ?? "").replace(/\s+/g, "").toUpperCase();

/**
 * Pick the lecture a chart belongs to, from the course's lectures in that
 * quarter. Returns null unless one lecture is clearly the best match.
 */
export const matchChartToSection = (
  chart: EnrollmentChart,
  lectures: Pick<ISectionItem, "sectionId" | "meetings">[]
): string | null => {
  if (lectures.length === 0) return null;
  if (lectures.length === 1) return lectures[0].sectionId;

  const chartLocation = squash(chart.location);
  const chartFamily = squash(chart.instructor?.split(" ")[0]);

  const scored = lectures.map((lecture) => {
    const meeting = lecture.meetings?.[0];
    let score = 0;
    if (
      meeting?.days &&
      meeting.days.every((day, index) => day === chart.days[index])
    )
      score += 2;
    if (chart.startTime && meeting?.startTime?.startsWith(chart.startTime))
      score += 2;
    if (
      chartLocation &&
      chartLocation !== "TBA" &&
      squash(meeting?.location) === chartLocation
    )
      score += 2;
    if (
      chartFamily &&
      chartFamily !== "T" &&
      lecture.meetings?.some((m) =>
        m.instructors?.some(
          (instructor) => squash(instructor.familyName) === chartFamily
        )
      )
    ) {
      score += 1;
    }
    return { sectionId: lecture.sectionId, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const [best, second] = scored;

  // Need the time and days, or the room, to agree, and no tie.
  if (best.score < 4 || (second && second.score === best.score)) return null;
  return best.sectionId;
};
