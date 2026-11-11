import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  CATALOG_USER_AGENT,
  catalogCourseUrl,
  fetchCatalogCourse,
  parseCatalogCoursePage,
  toPlainText,
} from "./ucsb-course-catalog";

// The CMPSC 130A page, cut down to its embedded course record.
const PAGE = readFileSync(
  new URL("./fixtures/catalog-course-cmpsc-130a.html", import.meta.url),
  "utf8"
);

describe("catalogCourseUrl", () => {
  it("encodes the course code into the page address", () => {
    assert.equal(
      catalogCourseUrl("CMPSC 130A"),
      "https://catalog.ucsb.edu/courses/CMPSC%20130A"
    );
    assert.equal(
      catalogCourseUrl("AS AM 127"),
      "https://catalog.ucsb.edu/courses/AS%20AM%20127"
    );
  });
});

describe("toPlainText", () => {
  it("strips tags and decodes entities", () => {
    assert.equal(
      toPlainText(
        "<p>CMPSC 40 &amp; MATH&nbsp;8;<br>grade of C&#39;s or better</p>"
      ),
      "CMPSC 40 & MATH 8; grade of C's or better"
    );
  });

  it("collapses whitespace and returns undefined for empty input", () => {
    assert.equal(toPlainText("  a   b \n c "), "a b c");
    assert.equal(toPlainText("<p> </p>"), undefined);
    assert.equal(toPlainText(null), undefined);
    assert.equal(toPlainText(42), undefined);
  });
});

describe("parseCatalogCoursePage", () => {
  const course = parseCatalogCoursePage(PAGE);

  it("reads the full title and description", () => {
    assert.equal(course?.title, "Data Structures and Algorithms");
    assert.match(
      course?.description ?? "",
      /^Data structures and applications/
    );
    assert.equal(course?.units, 4);
  });

  it("returns prerequisites as plain text", () => {
    assert.match(
      course?.prerequisites ?? "",
      /^CMPSC 40 or CMPSC 41 or MATH 8/
    );
    assert.doesNotMatch(course?.prerequisites ?? "", /[<>]/);
  });

  it("returns null when the page has no course record", () => {
    assert.equal(
      parseCatalogCoursePage("<html><body>Not found</body></html>"),
      null
    );
    assert.equal(
      parseCatalogCoursePage(
        '<script id="__NUXT_DATA__">[{"other":1},"x"]</script>'
      ),
      null
    );
    assert.equal(
      parseCatalogCoursePage('<script id="__NUXT_DATA__">not json</script>'),
      null
    );
  });

  it('treats "None" as no prerequisites', () => {
    const page =
      '<script id="__NUXT_DATA__">' +
      JSON.stringify([
        { courseGroupId: 1, description: 2, requisites: 3, longName: 6 },
        "X 1",
        "Text",
        { requisitesFreeform: 4 },
        { value: 5 },
        "<p>None</p>",
        "Title",
      ]) +
      "</script>";

    const parsed = parseCatalogCoursePage(page);
    assert.equal(parsed?.title, "Title");
    assert.equal(parsed?.prerequisites, undefined);
  });
});

describe("fetchCatalogCourse", () => {
  const respond = (status: number, body = "") =>
    (async () => new Response(body, { status })) as unknown as typeof fetch;

  it("identifies itself and parses a found page", async () => {
    let sentAgent: string | null = null;
    let requested = "";
    const fetchImpl = (async (url: string, init: RequestInit) => {
      requested = String(url);
      sentAgent = new Headers(init.headers).get("user-agent");
      return new Response(PAGE, { status: 200 });
    }) as unknown as typeof fetch;

    const result = await fetchCatalogCourse("CMPSC 130A", fetchImpl);

    assert.equal(result.status, "found");
    assert.equal(requested, "https://catalog.ucsb.edu/courses/CMPSC%20130A");
    assert.equal(sentAgent, CATALOG_USER_AGENT);
  });

  it("reports missing courses and errors without throwing", async () => {
    assert.deepEqual(await fetchCatalogCourse("ZZZZ 999", respond(404)), {
      status: "missing",
    });
    assert.deepEqual(
      await fetchCatalogCourse("X 1", respond(200, "<html></html>")),
      {
        status: "missing",
      }
    );
    assert.deepEqual(await fetchCatalogCourse("X 1", respond(503)), {
      status: "error",
      message: "HTTP 503",
    });

    const challenged = (async () =>
      new Response("<title>Human Verification</title>", {
        status: 405,
        headers: { "x-amzn-waf-action": "captcha" },
      })) as unknown as typeof fetch;
    assert.deepEqual(await fetchCatalogCourse("X 1", challenged), {
      status: "blocked",
    });

    const failing = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    assert.deepEqual(await fetchCatalogCourse("X 1", failing), {
      status: "error",
      message: "network down",
    });
  });
});
