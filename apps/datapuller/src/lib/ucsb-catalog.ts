import {
  IClassItem,
  ICourseCatalogDetailItem,
  ICourseItem,
  IEnrollmentHistoryItem,
  ISectionItem,
} from "@repo/common/models";
import {
  UcsbClass,
  UcsbClassInstructor,
  UcsbClassSection,
  UcsbClassTimeLocation,
  UcsbDepartment,
  UcsbGeneralEducation,
  UcsbSubject,
} from "@repo/ucsb-api";

import { buildVocabulary, repairDescription } from "./ucsb-description";

/**
 * Pure mapping from UCSB's class search response into the collections the
 * rest of the app reads: courses, classes, sections and enrollment snapshots.
 */

export interface CatalogTerm {
  /** Quarter code, for example "20264". */
  id: string;
  year: number;
  semester: string;
  beginDate: string;
  endDate: string;
}

export type CourseDetails = Pick<
  ICourseCatalogDetailItem,
  "title" | "description" | "prerequisites" | "repeatComments"
>;

export type EnrollmentSnapshot = Omit<IEnrollmentHistoryItem, "history"> & {
  snapshot: IEnrollmentHistoryItem["history"][number];
};

/**
 * Full names for subject and department codes, from the Registrar's lookup
 * tables. Subjects are keyed by the stored subject ("ASAM"), departments by
 * their trimmed code ("EALCS").
 */
export interface CatalogNames {
  subjects: Map<string, string>;
  departments: Map<string, string>;
}

export const EMPTY_NAMES: CatalogNames = {
  subjects: new Map(),
  departments: new Map(),
};

/** Lookup codes can contain runs of spaces ("ART  CS"); match without them. */
const normalizeCode = (code: string) => code.replace(/\s+/g, "").toUpperCase();

export const buildCatalogNames = (
  subjects: UcsbSubject[],
  departments: UcsbDepartment[]
): CatalogNames => ({
  subjects: new Map(
    subjects
      .filter((subject) => subject.subjectCode && subject.subjectTranslation)
      .map((subject) => [
        normalizeCode(subject.subjectCode),
        subject.subjectTranslation.trim(),
      ])
  ),
  departments: new Map(
    departments
      .filter((department) => department.deptCode && department.deptTranslation)
      .map((department) => [
        department.deptCode.trim(),
        department.deptTranslation.trim(),
      ])
  ),
});

export interface MappedQuarter {
  courses: ICourseItem[];
  classes: IClassItem[];
  sections: ISectionItem[];
  enrollments: EnrollmentSnapshot[];
  /** Instruction types UCSB sent that the app has no name for. */
  unknownInstructionTypes: string[];
}

/** Every regular-quarter class uses the term's single session. */
export const REGULAR_SESSION_ID = "1";

// Section types the GraphQL schema accepts (its Component enum).
const KNOWN_COMPONENTS = new Set([
  "CLN",
  "COL",
  "CON",
  "DEM",
  "DIS",
  "FLD",
  "GRP",
  "IND",
  "INT",
  "LAB",
  "LEC",
  "PRA",
  "REA",
  "REC",
  "SEM",
  "SES",
  "SLF",
  "STD",
  "SUP",
  "TUT",
  "VOL",
  "WBD",
  "WBL",
  "WOR",
]);

// Instruction methods the GraphQL schema accepts for a course.
const KNOWN_INSTRUCTION_METHODS = new Set([
  "CLC",
  "CLN",
  "COL",
  "CON",
  "DEM",
  "DIS",
  "FLD",
  "GRP",
  "IND",
  "INT",
  "LAB",
  "LEC",
  "PRA",
  "REA",
  "REC",
  "SEM",
  "SES",
  "SLF",
  "STD",
  "TUT",
  "WBD",
  "WBL",
  "WOR",
]);

/** Courses stay active until a later pull says otherwise. */
const OPEN_ENDED_DATE = "2099-12-31";

const COLLEGE_LABELS: Record<string, string> = {
  "L&S": "L&S",
  ENGR: "Engineering",
  CRST: "Creative Studies",
};

// Names for the special-subject codes. Lettered areas (B, C, D, ...) are shown
// as "Area D" until their per-college names are confirmed against the
// Registrar's requirement tables.
const SPECIAL_SUBJECT_LABELS: Record<string, string> = {
  WRT: "Writing",
  ETH: "Ethnicity",
  EUR: "European Traditions",
  NWC: "World Cultures",
  QNT: "Quantitative Relationships",
};

// Campus-wide requirements, stored as the class's requirement designation.
const UNIVERSITY_REQUIREMENT_LABELS: Record<string, string> = {
  AMH: "American History & Institutions",
};

const trim = (value: string | null | undefined) => value?.trim() ?? "";

/**
 * Split UCSB's fixed-width course id: 8 characters of subject, then the
 * course number. "ANTH      3  " -> { subject: "ANTH", number: "3" }.
 * Subjects can contain a space ("AS AM", "ART  CS").
 */
export const parseCourseId = (
  courseId: string,
  subjectArea?: string | null
): {
  courseId: string;
  subjectName: string;
  subject: string;
  number: string;
} | null => {
  const subjectName = (
    trim(subjectArea) || courseId.slice(0, 8).trim()
  ).replace(/\s+/g, " ");
  const number = courseId.slice(8).trim().replace(/\s+/g, "");

  if (!subjectName || !number) return null;

  return {
    // Readable and matches the catalog's own course codes ("CMPSC 130A").
    courseId: `${subjectName} ${number}`,
    subjectName,
    // The app stores subjects without whitespace ("ASAM").
    subject: subjectName.replace(/\s+/g, "").toUpperCase(),
    number,
  };
};

/** "M W F  " -> [Mon, Tue, Wed, Thu, Fri, Sat, Sun] */
export const parseDays = (days: string | null | undefined): boolean[] => {
  const padded = (days ?? "").padEnd(7, " ");
  return Array.from({ length: 7 }, (_, index) => padded[index] !== " ");
};

/** "14:00" -> "14:00:00", the format the rest of the app stores. */
const toTime = (time: string | null | undefined) => {
  const value = trim(time);
  if (!value) return undefined;
  return /^\d{1,2}:\d{2}$/.test(value) ? `${value}:00` : value;
};

/**
 * "SMITH S T" -> { familyName: "SMITH", givenName: "S T" }. UCSB only
 * publishes initials, so trailing one-letter words are treated as given names.
 */
export const parseInstructorName = (
  name: string | null | undefined
): { familyName: string; givenName: string } | null => {
  const words = trim(name).split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  let split = words.length;
  while (split > 1 && words[split - 1].length === 1) split--;

  return {
    familyName: words.slice(0, split).join(" "),
    givenName: words.slice(split).join(" "),
  };
};

const formatInstructors = (instructors: UcsbClassInstructor[] | null) =>
  (instructors ?? []).flatMap((instructor) => {
    const name = parseInstructorName(instructor.instructor);
    if (!name) return [];

    return [
      {
        printInScheduleOfClasses: true,
        ...name,
        role:
          trim(instructor.functionCode) === "Teaching and in charge"
            ? "PI"
            : "TNIC",
      },
    ];
  });

const formatLocation = (timeLocation: UcsbClassTimeLocation) =>
  [trim(timeLocation.building), trim(timeLocation.room)]
    .filter(Boolean)
    .join(" ") || undefined;

const isCancelled = (section: UcsbClassSection) =>
  trim(section.courseCancelled) !== "";

/** "0101" belongs to lecture "0100": the first two digits name the group. */
const lectureGroupOf = (section: string) => section.slice(0, 2);

const gradingBasisOf = (gradingOption: string | null | undefined) => {
  switch (trim(gradingOption)) {
    case "L":
      return "GRD";
    case "P":
      return "PNP";
    default:
      return "OPT";
  }
};

const careerOf = (objLevelCode: string | null | undefined) =>
  trim(objLevelCode) === "G" ? "GRAD" : "UGRD";

const unitsOf = (ucsbClass: UcsbClass) => {
  if (ucsbClass.unitsFixed != null) {
    return { minimum: ucsbClass.unitsFixed, maximum: ucsbClass.unitsFixed };
  }

  const low = ucsbClass.unitsVariableLow ?? ucsbClass.unitsVariableHigh;
  const high = ucsbClass.unitsVariableHigh ?? ucsbClass.unitsVariableLow;
  if (low == null || high == null) return undefined;

  return { minimum: Math.min(low, high), maximum: Math.max(low, high) };
};

interface GeneralEducationTags {
  /** Stored on the primary section; the catalog's requirement filter reads these. */
  sectionAttributes: NonNullable<ISectionItem["sectionAttributes"]>;
  requirementDesignation: IClassItem["requirementDesignation"];
  /** "L&S:D" style codes kept on the course. */
  codes: string[];
}

export const formatGeneralEducation = (
  generalEducation: UcsbGeneralEducation[] | null | undefined
): GeneralEducationTags => {
  const sectionAttributes: GeneralEducationTags["sectionAttributes"] = [];
  const codes: string[] = [];
  let requirementDesignation: GeneralEducationTags["requirementDesignation"];
  const seen = new Set<string>();

  for (const entry of generalEducation ?? []) {
    const code = trim(entry.geCode);
    const college = trim(entry.geCollege);
    if (!code) continue;

    const key = `${college}:${code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    codes.push(key);

    if (college === "UCSB" || UNIVERSITY_REQUIREMENT_LABELS[code]) {
      const description = UNIVERSITY_REQUIREMENT_LABELS[code] ?? code;
      requirementDesignation ??= {
        code,
        description,
        formalDescription: description,
      };
      continue;
    }

    const collegeLabel = COLLEGE_LABELS[college] ?? college;
    const areaLabel = SPECIAL_SUBJECT_LABELS[code] ?? `Area ${code}`;
    const description = `${collegeLabel}: ${areaLabel}`;

    sectionAttributes.push({
      attribute: {
        code: "GE",
        description: "General Education",
        formalDescription: "General Education",
      },
      value: { code: key, description, formalDescription: description },
    });
  }

  sectionAttributes.sort((a, b) =>
    a.value.description.localeCompare(b.value.description)
  );

  return { sectionAttributes, requirementDesignation, codes };
};

const formatCourse = (
  ucsbClass: UcsbClass,
  parsed: NonNullable<ReturnType<typeof parseCourseId>>,
  details: CourseDetails | undefined,
  apiDescription: string,
  geCodes: string[],
  term: CatalogTerm,
  updatedDate: string,
  names: CatalogNames
): ICourseItem => {
  const units = unitsOf(ucsbClass);
  const deptCode = trim(ucsbClass.deptCode);
  const instructionType = trim(ucsbClass.instructionType);

  return {
    courseId: parsed.courseId,
    subject: parsed.subject,
    // Full names, as Berkeley's data has them ("Computer Science"). The code
    // stands in until the lookup tables know the subject or department.
    subjectName: names.subjects.get(parsed.subject) ?? parsed.subjectName,
    number: parsed.number,
    // The developer API only has an abbreviated, upper-case title and a
    // description with stray spaces; prefer the General Catalog's when cached.
    // Title, description, dates and instruction method are required by the
    // GraphQL schema, so each always gets a value.
    title: details?.title || trim(ucsbClass.title) || parsed.courseId,
    description: details?.description || apiDescription,
    academicCareer: careerOf(ucsbClass.objLevelCode),
    primaryInstructionMethod: KNOWN_INSTRUCTION_METHODS.has(instructionType)
      ? instructionType
      : "UNK",
    fromDate: term.beginDate,
    toDate: OPEN_ENDED_DATE,
    gradingBasis: gradingBasisOf(ucsbClass.gradingOption),
    status: "ACTIVE",
    printInCatalog: true,
    academicGroup: trim(ucsbClass.college) || undefined,
    academicOrganization: deptCode || undefined,
    academicOrganizationName: deptCode
      ? (names.departments.get(deptCode) ?? deptCode)
      : undefined,
    preparation: details?.prerequisites
      ? { requiredText: details.prerequisites }
      : undefined,
    requirementsFulfilled: geCodes,
    credit: units
      ? units.minimum === units.maximum
        ? { type: "fixed", value: { fixed: units.minimum } }
        : {
            type: "range",
            value: {
              range: { minUnits: units.minimum, maxUnits: units.maximum },
            },
          }
      : undefined,
    contactHours: ucsbClass.contactHours ?? undefined,
    updatedDate,
  };
};

/**
 * Convert one quarter of UCSB classes. Each lecture ("0100", "0200") becomes
 * its own class, with the sections that share its first two digits attached.
 * Cancelled sections are dropped, and a lecture group whose lecture is
 * cancelled is dropped entirely.
 */
export const mapQuarter = (
  ucsbClasses: UcsbClass[],
  term: CatalogTerm,
  details: Map<string, CourseDetails> = new Map(),
  now: Date = new Date(),
  names: CatalogNames = EMPTY_NAMES
): MappedQuarter => {
  const courses = new Map<string, ICourseItem>();
  const classes: IClassItem[] = [];
  const sections: ISectionItem[] = [];
  const enrollments: EnrollmentSnapshot[] = [];
  const unknownInstructionTypes = new Set<string>();
  const updatedDate = now.toISOString().slice(0, 10);

  // The API's descriptions have a stray space every 75 characters. Learn the
  // vocabulary from the whole quarter, plus the clean General Catalog text
  // already cached, to tell split words from real word breaks.
  const vocabulary = buildVocabulary([
    ...ucsbClasses.map((ucsbClass) => ucsbClass.description),
    ...[...details.values()].map((detail) => detail.description),
  ]);

  for (const ucsbClass of ucsbClasses) {
    const parsed = parseCourseId(
      ucsbClass.courseId ?? "",
      ucsbClass.subjectArea
    );
    if (!parsed) continue;

    const courseDetails = details.get(parsed.courseId);
    const generalEducation = formatGeneralEducation(ucsbClass.generalEducation);
    const units = unitsOf(ucsbClass);
    const online = ucsbClass.onLineCourse === true;
    const apiDescription = repairDescription(ucsbClass.description, vocabulary);

    courses.set(
      parsed.courseId,
      formatCourse(
        ucsbClass,
        parsed,
        courseDetails,
        apiDescription,
        generalEducation.codes,
        term,
        updatedDate,
        names
      )
    );

    // Group sections by lecture.
    const groups = new Map<string, UcsbClassSection[]>();
    for (const section of ucsbClass.classSections ?? []) {
      const code = trim(section.section);
      if (!code || !trim(section.enrollCode) || isCancelled(section)) continue;

      const group = lectureGroupOf(code);
      groups.set(group, [...(groups.get(group) ?? []), section]);
    }

    for (const groupSections of groups.values()) {
      groupSections.sort((a, b) =>
        trim(a.section).localeCompare(trim(b.section))
      );

      // The lecture ends in "00". If it was cancelled, the group goes with it.
      const primary = groupSections.find((section) =>
        trim(section.section).endsWith("00")
      );
      if (!primary) continue;

      const classNumber = trim(primary.section);
      const secondaryIds = groupSections
        .filter((section) => section !== primary)
        .map((section) => trim(section.enrollCode));

      classes.push({
        courseId: parsed.courseId,
        courseNumber: parsed.number,
        year: term.year,
        semester: term.semester,
        termId: term.id,
        sessionId: REGULAR_SESSION_ID,
        number: classNumber,
        subject: parsed.subject,
        title: courseDetails?.title || trim(ucsbClass.title) || undefined,
        description: courseDetails?.description || apiDescription || undefined,
        allowedUnits: units,
        gradingBasis: gradingBasisOf(
          primary.gradingOptionCode ?? ucsbClass.gradingOption
        ),
        instructionMode: online ? "O" : "P",
        anyPrintInScheduleOfClasses: true,
        contactHours: ucsbClass.contactHours ?? undefined,
        requirementDesignation: generalEducation.requirementDesignation,
        requisites: courseDetails?.prerequisites || undefined,
      });

      for (const section of groupSections) {
        const isPrimary = section === primary;
        const sectionId = trim(section.enrollCode);
        const number = trim(section.section);

        const rawType =
          trim(section.typeInstruction) ||
          (isPrimary ? trim(ucsbClass.instructionType) : "");
        let component = rawType;
        if (!KNOWN_COMPONENTS.has(component)) {
          if (rawType) unknownInstructionTypes.add(rawType);
          component = isPrimary ? "LEC" : "DIS";
        }

        sections.push({
          courseId: parsed.courseId,
          classNumber,
          sessionId: REGULAR_SESSION_ID,
          termId: term.id,
          sectionId,
          number,
          subject: parsed.subject,
          courseNumber: parsed.number,
          year: term.year,
          semester: term.semester,
          component,
          instructionMode: online ? "O" : "P",
          printInScheduleOfClasses: true,
          startDate: term.beginDate,
          endDate: term.endDate,
          primary: isPrimary,
          associatedSectionIds: isPrimary ? secondaryIds : undefined,
          meetings: (section.timeLocations ?? []).map(
            (timeLocation, index) => ({
              number: index + 1,
              days: parseDays(timeLocation.days),
              startTime: toTime(timeLocation.beginTime),
              endTime: toTime(timeLocation.endTime),
              startDate: term.beginDate,
              endDate: term.endDate,
              location: formatLocation(timeLocation),
              instructors: formatInstructors(section.instructors),
            })
          ),
          sectionAttributes: isPrimary
            ? generalEducation.sectionAttributes
            : undefined,
        });

        const enrolledCount = section.enrolledTotal ?? 0;
        const maxEnroll = section.maxEnroll ?? 0;
        const closed =
          trim(section.classClosed) === "Y" ||
          (maxEnroll > 0 && enrolledCount >= maxEnroll);

        enrollments.push({
          termId: term.id,
          year: term.year,
          semester: term.semester,
          sessionId: REGULAR_SESSION_ID,
          sectionId,
          subject: parsed.subject,
          courseNumber: parsed.number,
          sectionNumber: number,
          snapshot: {
            startTime: now,
            endTime: now,
            granularitySeconds: 0,
            status: closed ? "C" : "O",
            enrolledCount,
            maxEnroll,
            // UCSB does not publish waitlist sizes.
            waitlistedCount: 0,
            maxWaitlist: 0,
            instructorAddConsentRequired:
              section.instructorApprovalRequired ?? undefined,
          },
        });
      }
    }
  }

  return {
    courses: [...courses.values()],
    classes,
    sections,
    enrollments,
    unknownInstructionTypes: [...unknownInstructionTypes].sort(),
  };
};
