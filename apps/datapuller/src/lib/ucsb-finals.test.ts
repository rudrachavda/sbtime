import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatFinalExam } from "./ucsb-finals";

describe("formatFinalExam", () => {
  it("stores a scheduled final", () => {
    assert.deepEqual(
      formatFinalExam({
        hasFinals: true,
        comments: "",
        examDay: "M",
        examDate: "20261207",
        beginTime: "16:00",
        endTime: "19:00",
      }),
      {
        finalExam: "Y",
        exams: [
          {
            number: 1,
            date: "20261207",
            startTime: "16:00:00",
            endTime: "19:00:00",
            type: "FIN",
          },
        ],
      }
    );
  });

  it("records classes without a final", () => {
    assert.deepEqual(
      formatFinalExam({
        hasFinals: false,
        comments: null,
        examDay: null,
        examDate: null,
        beginTime: null,
        endTime: null,
      }),
      { finalExam: "N", exams: [] }
    );
  });

  it("keeps a final with no date yet, and ignores missing answers", () => {
    assert.deepEqual(
      formatFinalExam({
        hasFinals: true,
        comments: null,
        examDay: null,
        examDate: null,
        beginTime: null,
        endTime: null,
      }),
      { finalExam: "Y", exams: [] }
    );
    assert.equal(formatFinalExam(null), null);
  });

  it("pads single-digit hours", () => {
    const result = formatFinalExam({
      hasFinals: true,
      comments: "",
      examDay: "S",
      examDate: "20270313",
      beginTime: "8:00",
      endTime: "11:00",
    });
    assert.equal(result?.exams[0].startTime, "08:00:00");
  });
});
