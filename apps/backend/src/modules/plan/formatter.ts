import { Types } from "mongoose";

import {
  LabelType,
  PlanTermType,
  PlanType,
  SelectedCourseType,
  SelectedPlanRequirementType,
} from "@repo/common/models";

import { Colleges, Status, Terms } from "../../generated-types/graphql";
import { PlanModule } from "./generated-types/module-types";

const KNOWN_COLLEGES = new Set<string>([
  "LnS",
  "CoE",
  "CCS",
  "OTHER",
] satisfies Colleges[]);

// Plans can hold colleges this campus no longer offers (or Berkeley's, from
// imported data); show those as Other instead of failing the whole plan.
const toCollege = (college: string): Colleges =>
  KNOWN_COLLEGES.has(college) ? (college as Colleges) : "OTHER";

export function formatPlan(plan: PlanType): PlanModule.Plan {
  return {
    _id: (plan._id as Types.ObjectId).toString(),
    userEmail: plan.userEmail,
    planTerms: plan.planTerms.map(formatPlanTerm),
    majors: plan.majors,
    minors: plan.minors,
    colleges: [...new Set(plan.colleges.map(toCollege))],
    created: plan.createdAt.toISOString(),
    revised: plan.updatedAt.toISOString(),
    labels: plan.labels.map(formatLabel),
    selectedPlanRequirements: (plan.selectedPlanRequirements || []).map(
      formatSelectedPlanRequirement
    ),
  };
}

function formatSelectedPlanRequirement(
  spr: SelectedPlanRequirementType
): PlanModule.SelectedPlanRequirement & { planRequirementId: string } {
  return {
    planRequirementId: spr.planRequirementId.toString(),
    manualOverrides: spr.manualOverrides,
  } as PlanModule.SelectedPlanRequirement & { planRequirementId: string };
}

export function formatPlanTerm(planTerm: PlanTermType): PlanModule.PlanTerm {
  return {
    _id: (planTerm._id as Types.ObjectId).toString(),
    name: planTerm.name,
    userEmail: planTerm.userEmail,
    courses: planTerm.courses.map(formatCourse),
    year: planTerm.year,
    term: planTerm.term as Terms,
    hidden: planTerm.hidden,
    status: planTerm.status as Status,
    pinned: planTerm.pinned,
  };
}

function formatCourse(course: SelectedCourseType): PlanModule.SelectedCourse {
  return {
    courseID: course.courseID,
    courseName: course.courseName,
    courseTitle: course.courseTitle,
    courseUnits: course.courseUnits,
    labels: course.labels,
    pnp: course.pnp,
    transfer: course.transfer,
  };
}

function formatLabel(label: LabelType): PlanModule.Label {
  return {
    name: label.name,
    color: label.color,
  };
}
