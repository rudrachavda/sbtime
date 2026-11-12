import { Model, Schema, model } from "mongoose";

/*
 * Bookkeeping for enrollment history imported from another source (today
 * UCSBPlat), one record per course, so an import can be resumed and refreshed.
 */
export interface IEnrollmentImportItem {
  /** Same id as courses.courseId, for example "MATH 3A". */
  courseId: string;
  source: string;
  fetchedAt: Date;
  pages: number;
  charts: number;
  /** Charts whose history was kept for a lecture. */
  matched: number;
  /** Charts with no lecture they could be matched to. */
  unmatched: number;
  /** Exact repeats of another chart. */
  duplicates?: number;
  /** Charts for another lecture that overlapped a matched one. */
  overlapping?: number;
  /** Discussion-section charts, which are not kept. */
  sections?: number;
}

const enrollmentImportSchema = new Schema<IEnrollmentImportItem>({
  courseId: { type: String, required: true },
  source: { type: String, required: true },
  fetchedAt: { type: Date, required: true },
  pages: { type: Number, required: true },
  charts: { type: Number, required: true },
  matched: { type: Number, required: true },
  unmatched: { type: Number, required: true },
  duplicates: { type: Number },
  overlapping: { type: Number },
  sections: { type: Number },
});

enrollmentImportSchema.index({ source: 1, courseId: 1 }, { unique: true });

export const EnrollmentImportModel: Model<IEnrollmentImportItem> =
  model<IEnrollmentImportItem>("enrollmentImports", enrollmentImportSchema);
