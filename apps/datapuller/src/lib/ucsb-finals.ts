import { ISectionItem } from "@repo/common/models";
import { UcsbFinalExam } from "@repo/ucsb-api";

type Exam = NonNullable<ISectionItem["exams"]>[number];

/** "16:00" -> "16:00:00", the format the rest of the app stores. */
const toTime = (time: string | null | undefined) => {
  const value = time?.trim();
  if (!value) return undefined;
  return /^\d{1,2}:\d{2}$/.test(value) ? `${value.padStart(5, "0")}:00` : value;
};

/**
 * Convert UCSB's final exam answer into the stored exam list and the class's
 * final exam code: "Y" (written final in finals week) or "N" (none). Returns
 * null when UCSB gives no answer either way.
 */
export const formatFinalExam = (
  exam: UcsbFinalExam | null | undefined
): { finalExam: "Y" | "N"; exams: Exam[] } | null => {
  if (!exam || exam.hasFinals === null || exam.hasFinals === undefined) {
    return null;
  }

  if (!exam.hasFinals) return { finalExam: "N", exams: [] };

  const date = exam.examDate?.trim();
  if (!date || !/^\d{8}$/.test(date)) return { finalExam: "Y", exams: [] };

  return {
    finalExam: "Y",
    exams: [
      {
        number: 1,
        // Kept as "YYYYMMDD"; the class page already reads that format.
        date,
        startTime: toTime(exam.beginTime),
        endTime: toTime(exam.endTime),
        type: "FIN",
      },
    ],
  };
};
