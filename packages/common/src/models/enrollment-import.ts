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
  matched: number;
  unmatched: number;
}

const enrollmentImportSchema = new Schema<IEnrollmentImportItem>({
  courseId: { type: String, required: true },
  source: { type: String, required: true },
  fetchedAt: { type: Date, required: true },
  pages: { type: Number, required: true },
  charts: { type: Number, required: true },
  matched: { type: Number, required: true },
  unmatched: { type: Number, required: true },
});

enrollmentImportSchema.index({ source: 1, courseId: 1 }, { unique: true });

export const EnrollmentImportModel: Model<IEnrollmentImportItem> =
  model<IEnrollmentImportItem>("enrollmentImports", enrollmentImportSchema);
