import { Model, Schema, model } from "mongoose";

/*
 * The term schema is used to store information about the academic term, such as
 * the academic year, begin date, end date, and deadlines for various actions.
 * Populated from UCSB's Academic Quarter Calendar API:
 * https://developer.ucsb.edu/content/academic-quarter-calendar
 */

export interface ISessionItem {
  temporalPosition: "Current" | "Past" | "Future";
  id: string;
  name: string;
  beginDate: string;
  endDate: string;
  weeksOfInstruction?: number;
  holidayScheduleCode?: string;
  censusDate?: string;
  sixtyPercentPoint?: string;
  openEnrollmentDate?: string;
  enrollBeginDate?: string;
  enrollEndDate?: string;
  waitListEndDate?: string;
  fullyEnrolledDeadline?: string;
  dropDeletedFromRecordDeadline?: string;
  dropRetainedOnRecordDeadline?: string;
  dropWithPenaltyDeadline?: string;
  cancelDeadline?: string;
  withdrawNoPenaltyDeadline?: string;
  withdrawWithPenaltyDeadline?: string;
  timePeriods?: {
    periodDescription: string;
    endDate: string;
  }[];
}

// TODO: WORK IN PROGRESS
export interface ITermItem {
  academicCareerCode: string;
  temporalPosition: "Current" | "Past" | "Future";
  id: string;
  name: string;
  academicYear: string;
  beginDate: string;
  endDate: string;
  weeksOfInstruction?: number;
  holidayScheduleCode?: string;
  censusDate?: string;
  fullyEnrolledDeadline?: string;
  fullyGradedDeadline?: string;
  cancelDeadline?: string;
  withdrawNoPenaltyDeadline?: string;
  degreeConferDate?: string;
  selfServicePlanBeginDate?: string;
  selfServicePlanEndDate?: string;
  selfServiceEnrollBeginDate?: string;
  selfServiceEnrollEndDate?: string;
  sessions?: ISessionItem[];
  hasCatalogData: boolean;

  // UCSB quarter calendar. Dates are "YYYY-MM-DD"; the registration passes
  // keep their time of day ("YYYY-MM-DDTHH:mm:ss", Pacific).
  firstDayOfQuarter?: string;
  lastDayOfClasses?: string;
  firstDayOfFinals?: string;
  lastDayOfFinals?: string;
  lastDayOfSchedule?: string;
  pass1Begin?: string;
  pass2Begin?: string;
  pass3Begin?: string;
  feeDeadline?: string;
  lastDayToAddUndergrad?: string;
  lastDayToAddGrad?: string;
}

const termSchema = new Schema<ITermItem>({
  academicCareerCode: { type: String, required: true },
  temporalPosition: {
    type: String,
    enum: ["Current", "Past", "Future"],
    required: true,
  },
  id: { type: String, required: true },
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  beginDate: { type: String, required: true },
  endDate: { type: String, required: true },
  weeksOfInstruction: { type: Number },
  holidayScheduleCode: { type: String },
  censusDate: { type: String },
  fullyEnrolledDeadline: { type: String },
  fullyGradedDeadline: { type: String },
  cancelDeadline: { type: String },
  withdrawNoPenaltyDeadline: { type: String },
  degreeConferDate: { type: String },
  selfServicePlanBeginDate: { type: String },
  selfServicePlanEndDate: { type: String },
  selfServiceEnrollBeginDate: { type: String },
  selfServiceEnrollEndDate: { type: String },
  sessions: {
    type: [
      {
        temporalPosition: {
          type: String,
          enum: ["Current", "Past", "Future"],
          required: true,
        },
        id: { type: String, required: true },
        name: { type: String, required: true },
        beginDate: { type: String, required: true },
        endDate: { type: String, required: true },
        weeksOfInstruction: { type: Number },
        holidayScheduleCode: { type: String },
        censusDate: { type: String },
        sixtyPercentPoint: { type: String },
        openEnrollmentDate: { type: String },
        enrollBeginDate: { type: String },
        enrollEndDate: { type: String },
        waitListEndDate: { type: String },
        fullyEnrolledDeadline: { type: String },
        dropDeletedFromRecordDeadline: { type: String },
        dropRetainedOnRecordDeadline: { type: String },
        dropWithPenaltyDeadline: { type: String },
        cancelDeadline: { type: String },
        withdrawNoPenaltyDeadline: { type: String },
        withdrawWithPenaltyDeadline: { type: String },
        timePeriods: {
          type: [
            {
              periodDescription: { type: String, required: true },
              endDate: { type: String, required: true },
            },
          ],
        },
      },
    ],
  },
  hasCatalogData: { type: Boolean, required: true, default: true },
  firstDayOfQuarter: { type: String },
  lastDayOfClasses: { type: String },
  firstDayOfFinals: { type: String },
  lastDayOfFinals: { type: String },
  lastDayOfSchedule: { type: String },
  pass1Begin: { type: String },
  pass2Begin: { type: String },
  pass3Begin: { type: String },
  feeDeadline: { type: String },
  lastDayToAddUndergrad: { type: String },
  lastDayToAddGrad: { type: String },
});

// for catalog, grade distribution by semester, scheduler, and terms controllers
termSchema.index({ name: 1 });

// for efficiently querying terms with catalog data
termSchema.index({ hasCatalogData: 1, temporalPosition: 1 });

// below is a valid uniqueness constraint, but the index is not needed for
// any queries, so we don't use it
/*
termSchema.index({ id: 1, academicCareerCode: 1 }, { unique: true });
*/

export const TermModel: Model<ITermItem> = model<ITermItem>(
  "terms",
  termSchema
);
