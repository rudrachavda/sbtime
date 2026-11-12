import {
  CATALOG_USER_AGENT,
  CatalogFetchResult,
  ParsedCatalogCourse,
  toPlainText,
} from "./ucsb-course-catalog";

/**
 * Reads course details (full title, description, prerequisites) from
 * UCSBPlat's public course pages, a UCSB student project
 * (https://ucsbplat.com/about).
 *
 * Only the course facts are read. Professor reviews and predicted grade
 * distributions shown on the site are not ours to copy and are ignored.
 * It is a small student-run server: one page at a time, slowly, and stop at
 * the first sign that automated reads are unwelcome.
 */

export const UCSBPLAT_BASE_URL = "https://ucsbplat.com";

/** Pause between page requests. */
export const UCSBPLAT_REQUEST_DELAY_MS = 2000;

export const ucsbplatCourseUrl = (courseId: string) =>
  `${UCSBPLAT_BASE_URL}/curriculum/course/${encodeURIComponent(courseId)}`;

const firstMatch = (html: string, pattern: RegExp) =>
  toPlainText(pattern.exec(html)?.[1]);

/**
 * Pull the course record out of a UCSBPlat course page. Returns null when
 * the page has no course heading.
 */
export const parseUcsbplatCoursePage = (
  html: string
): ParsedCatalogCourse | null => {
  // <h3 class="navy fw-bold mb-4">ECE 122B - VLSI Architecture and Design</h3>
  const heading = firstMatch(
    html,
    /<h3[^>]*class="[^"]*navy[^"]*"[^>]*>([\s\S]*?)<\/h3>/
  );
  if (!heading) return null;

  const separator = heading.indexOf(" - ");
  const title =
    separator === -1 ? undefined : heading.slice(separator + 3).trim();

  const description = firstMatch(
    html,
    /<p[^>]*class="[^"]*text-secondary[^"]*"[^>]*>([\s\S]*?)<\/p>/
  );

  // Either "Prerequisites: ..." or "No Prerequisites".
  const note = firstMatch(
    html,
    /<h6[^>]*class="[^"]*text-info[^"]*"[^>]*>([\s\S]*?)<\/h6>/
  );
  const prerequisites = note
    ? /^prerequisites?:\s*(.+)$/i.exec(note)?.[1]?.trim()
    : undefined;

  return {
    title: title || undefined,
    description,
    prerequisites:
      prerequisites && !/^none\.?$/i.test(prerequisites)
        ? prerequisites
        : undefined,
  };
};

const BLOCKED_STATUSES = new Set([401, 403, 405, 429]);

const looksLikeChallenge = (body: string) =>
  /captcha|human verification|verify you are human|just a moment|access denied|rate limit/i.test(
    body.slice(0, 4000)
  );

/**
 * Fetch and parse one course page. Anything that looks like a block or a
 * verification challenge is reported as "blocked" so the caller stops.
 */
export type PageFetchResult =
  | { status: "ok"; body: string }
  | { status: "missing" }
  | { status: "blocked" }
  | { status: "error"; message: string };

/**
 * Fetch one UCSBPlat page. Anything that looks like a block, rate limit or
 * verification challenge comes back as "blocked" so callers stop at once.
 */
export const fetchUcsbplatPage = async (
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<PageFetchResult> => {
  try {
    const response = await fetchImpl(url, {
      headers: { "user-agent": CATALOG_USER_AGENT, accept: "text/html" },
    });

    if (response.status === 404) return { status: "missing" };
    if (BLOCKED_STATUSES.has(response.status)) return { status: "blocked" };
    if (!response.ok) {
      return { status: "error", message: `HTTP ${response.status}` };
    }

    return { status: "ok", body: await response.text() };
  } catch (error) {
    return { status: "error", message: (error as Error).message };
  }
};

/** Whether a page body is a challenge rather than content. */
export const isChallengePage = looksLikeChallenge;

/**
 * Fetch and parse one course page. Anything that looks like a block or a
 * verification challenge is reported as "blocked" so the caller stops.
 */
export const fetchUcsbplatCourse = async (
  courseId: string,
  fetchImpl: typeof fetch = fetch
): Promise<CatalogFetchResult> => {
  const page = await fetchUcsbplatPage(ucsbplatCourseUrl(courseId), fetchImpl);
  if (page.status !== "ok") return page;

  const course = parseUcsbplatCoursePage(page.body);
  if (course) return { status: "found", course };

  return looksLikeChallenge(page.body)
    ? { status: "blocked" }
    : { status: "missing" };
};
