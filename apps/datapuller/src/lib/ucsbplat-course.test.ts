import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { CATALOG_USER_AGENT } from "./ucsb-course-catalog";
import {
  fetchUcsbplatCourse,
  parseUcsbplatCoursePage,
  ucsbplatCourseUrl,
} from "./ucsbplat-course";

// The ECE 122B course page, cut down to its header block.
const PAGE = readFileSync(
  new URL("./fixtures/ucsbplat-course-ece-122b.html", import.meta.url),
  "utf8"
);

const page = (heading: string, description: string, note: string) => `
  <h3 class="navy fw-bold mb-4">${heading}</h3>
  <p class="text-secondary">${description}</p>
  <h6 class="mb-0 text-info">
      ${note}
  </h6>`;

describe("ucsbplatCourseUrl", () => {
  it("encodes the course code into the page address", () => {
    assert.equal(
      ucsbplatCourseUrl("AS AM 127"),
      "https://ucsbplat.com/curriculum/course/AS%20AM%20127"
    );
  });
});

describe("parseUcsbplatCoursePage", () => {
  it("reads the title, description and prerequisites", () => {
    const course = parseUcsbplatCoursePage(PAGE);

    assert.equal(course?.title, "VLSI Architecture and Design");
    assert.match(
      course?.description ?? "",
      /^Practical issues in VLSI circuit design/
    );
    assert.equal(
      course?.prerequisites,
      "ECE 124A or ECE 123 or ECE 122A with a minimum grade of C-."
    );
  });

  it('treats "No Prerequisites" and an empty description as absent', () => {
    const course = parseUcsbplatCoursePage(
      page("ANTH 3 - Introductory Archaeology", "", "No Prerequisites")
    );

    assert.equal(course?.title, "Introductory Archaeology");
    assert.equal(course?.description, undefined);
    assert.equal(course?.prerequisites, undefined);
  });

  it("keeps hyphens inside a title and decodes entities", () => {
    const course = parseUcsbplatCoursePage(
      page(
        "AS AM 127 - Film &amp; Media - A Survey",
        "Text",
        "Prerequisites: Sophomore standing or higher."
      )
    );

    assert.equal(course?.title, "Film & Media - A Survey");
    assert.equal(course?.prerequisites, "Sophomore standing or higher.");
  });

  it("returns null when there is no course heading", () => {
    assert.equal(
      parseUcsbplatCoursePage("<html><body>404</body></html>"),
      null
    );
  });
});

describe("fetchUcsbplatCourse", () => {
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

    const result = await fetchUcsbplatCourse("ECE 122B", fetchImpl);

    assert.equal(result.status, "found");
    assert.equal(
      requested,
      "https://ucsbplat.com/curriculum/course/ECE%20122B"
    );
    assert.equal(sentAgent, CATALOG_USER_AGENT);
  });

  it("reports missing pages", async () => {
    assert.deepEqual(await fetchUcsbplatCourse("ZZZZ 999", respond(404)), {
      status: "missing",
    });
    assert.deepEqual(
      await fetchUcsbplatCourse(
        "X 1",
        respond(200, "<html>nothing here</html>")
      ),
      { status: "missing" }
    );
  });

  it("reports blocks and verification challenges so the reader stops", async () => {
    for (const status of [403, 405, 429]) {
      assert.deepEqual(await fetchUcsbplatCourse("X 1", respond(status)), {
        status: "blocked",
      });
    }
    assert.deepEqual(
      await fetchUcsbplatCourse(
        "X 1",
        respond(200, "<title>Human Verification</title>")
      ),
      { status: "blocked" }
    );
  });

  it("reports server and network errors without throwing", async () => {
    assert.deepEqual(await fetchUcsbplatCourse("X 1", respond(502)), {
      status: "error",
      message: "HTTP 502",
    });

    const failing = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    assert.deepEqual(await fetchUcsbplatCourse("X 1", failing), {
      status: "error",
      message: "network down",
    });
  });
});
