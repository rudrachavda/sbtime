import { ICourseCatalogDetailItem } from "@repo/common/models";

/**
 * Reads course details from UCSB's public General Catalog pages. The
 * developer API has no prerequisites or full titles; the catalog does.
 *
 * Pages are fetched one at a time, slowly, by a client that says what it is.
 * Do not point this at the catalog vendor's internal API.
 */

export const CATALOG_BASE_URL = "https://catalog.ucsb.edu";

export const CATALOG_USER_AGENT =
  "sbtime-catalog-reader/0.1 (student course-planning project)";

/** Pause between page requests. */
export const CATALOG_REQUEST_DELAY_MS = 1000;

export type ParsedCatalogCourse = Omit<
  ICourseCatalogDetailItem,
  "courseId" | "found" | "fetchedAt"
>;

export const catalogCourseUrl = (courseId: string) =>
  `${CATALOG_BASE_URL}/courses/${encodeURIComponent(courseId)}`;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Catalog text fields are sometimes HTML ("<p>None</p>"); flatten to text. */
export const toPlainText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;

  const text = value
    .replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(
      /&([a-z]+);/gi,
      (match, name) => ENTITIES[name.toLowerCase()] ?? match
    )
    .replace(/\s+/g, " ")
    .trim();

  return text || undefined;
};

const toStringList = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;

// Wrapper tags the page's serializer puts around reactive values.
const WRAPPERS = new Set([
  "Reactive",
  "ShallowReactive",
  "Ref",
  "ShallowRef",
  "EmptyRef",
  "EmptyShallowRef",
]);

const MAX_DEPTH = 8;

/**
 * The page embeds its data as one flat JSON array in which objects and arrays
 * refer to their values by index. Rebuild the value stored at `index`.
 */
const resolve = (payload: unknown[], index: number, depth = 0): unknown => {
  const value = payload[index];
  if (depth > MAX_DEPTH) return undefined;

  const follow = (entry: unknown) =>
    typeof entry === "number" && Number.isInteger(entry) && entry >= 0
      ? resolve(payload, entry, depth + 1)
      : entry;

  if (Array.isArray(value)) {
    if (typeof value[0] === "string" && WRAPPERS.has(value[0])) {
      return typeof value[1] === "number" ? follow(value[1]) : undefined;
    }
    return value.map(follow);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, follow(entry)])
    );
  }

  return value;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * Pull the course record out of a General Catalog course page. Returns null
 * when the page has no embedded course (for example a "not found" page).
 */
export const parseCatalogCoursePage = (
  html: string
): ParsedCatalogCourse | null => {
  const match = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(
    html
  );
  if (!match) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(match[1]);
  } catch {
    return null;
  }
  if (!Array.isArray(payload)) return null;

  const index = payload.findIndex(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      "courseGroupId" in entry &&
      "description" in entry &&
      "requisites" in entry
  );
  if (index === -1) return null;

  const course = asRecord(resolve(payload, index));
  const customFields = asRecord(course.customFields);
  const requisites = asRecord(asRecord(course.requisites).requisitesFreeform);
  const credits = asRecord(course.credits);

  let prerequisites = toPlainText(requisites.value);
  // "None" is how the catalog says a course has no prerequisites.
  if (prerequisites && /^none\.?$/i.test(prerequisites))
    prerequisites = undefined;

  const units = credits.numberOfCredits;

  return {
    title: toPlainText(course.longName) ?? toPlainText(course.name),
    description: toPlainText(course.description),
    prerequisites,
    repeatComments: toPlainText(customFields.repeatComments),
    generalSubjectAreas: toStringList(customFields.generalSubjectAreas),
    specialSubjectAreas: toStringList(customFields.specialSubjectAreas),
    college: toPlainText(course.college),
    units: typeof units === "number" ? units : undefined,
  };
};

export type CatalogFetchResult =
  | { status: "found"; course: ParsedCatalogCourse }
  | { status: "missing" }
  /** The site asked for human verification. Stop; do not retry or work around it. */
  | { status: "blocked" }
  | { status: "error"; message: string };

/**
 * Fetch and parse one course page. A 404, or a page without a course record,
 * means the catalog does not list the course.
 */
export const fetchCatalogCourse = async (
  courseId: string,
  fetchImpl: typeof fetch = fetch
): Promise<CatalogFetchResult> => {
  try {
    const response = await fetchImpl(catalogCourseUrl(courseId), {
      headers: { "user-agent": CATALOG_USER_AGENT, accept: "text/html" },
    });

    if (response.status === 404) return { status: "missing" };
    // The catalog's firewall answers automated traffic with a CAPTCHA page.
    if (response.headers.get("x-amzn-waf-action")) return { status: "blocked" };
    if (!response.ok) {
      return { status: "error", message: `HTTP ${response.status}` };
    }

    const course = parseCatalogCoursePage(await response.text());
    return course ? { status: "found", course } : { status: "missing" };
  } catch (error) {
    return { status: "error", message: (error as Error).message };
  }
};
