import { Model, Schema, model } from "mongoose";

/*
 * Course details read from public course pages: UCSB's General Catalog
 * (https://catalog.ucsb.edu/courses/<course code>) or UCSBPlat
 * (https://ucsbplat.com/curriculum/course/<course code>). The developer API
 * has no prerequisites or full course titles, so these are fetched once per
 * course, cached here, and merged into courses and classes by the datapuller.
 */
export interface ICourseCatalogDetailItem {
  /** Same id as courses.courseId, for example "CMPSC 130A". */
  courseId: string;
  /** False when the catalog has no page for the course. */
  found: boolean;
  fetchedAt: Date;
  /** Where the details were read from: "catalog" (catalog.ucsb.edu) or "ucsbplat". */
  source?: string;
  /** Full title, for example "Data Structures and Algorithms". */
  title?: string;
  description?: string;
  /** Plain text. */
  prerequisites?: string;
  repeatComments?: string;
  generalSubjectAreas?: string[];
  specialSubjectAreas?: string[];
  college?: string;
  units?: number;
}

const courseCatalogDetailSchema = new Schema<ICourseCatalogDetailItem>({
  courseId: { type: String, required: true },
  found: { type: Boolean, required: true },
  fetchedAt: { type: Date, required: true },
  source: { type: String },
  title: { type: String },
  description: { type: String },
  prerequisites: { type: String },
  repeatComments: { type: String },
  generalSubjectAreas: { type: [String] },
  specialSubjectAreas: { type: [String] },
  college: { type: String },
  units: { type: Number },
});

courseCatalogDetailSchema.index({ courseId: 1 }, { unique: true });

export const CourseCatalogDetailModel: Model<ICourseCatalogDetailItem> =
  model<ICourseCatalogDetailItem>(
    "courseCatalogDetails",
    courseCatalogDetailSchema
  );
