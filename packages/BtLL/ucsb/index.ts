import { UCSB_COMPUTER_SCIENCE_BTLL } from "./computer-science";
import { UCSB_ENGINEERING_GE_BTLL } from "./engineering";
import { UCSB_UNIVERSITY_REQ_BTLL } from "./university";

export {
  UCSB_COMPUTER_SCIENCE_BTLL,
  UCSB_ENGINEERING_GE_BTLL,
  UCSB_UNIVERSITY_REQ_BTLL,
};

/** One requirement set as stored in the planrequirements collection. */
export interface UcsbPlanRequirementSeed {
  name: string;
  code: string;
  isUcReq: boolean;
  /** Plan college value: "LnS", "CoE" or "CCS". */
  college: string | null;
  /** Major label as shown in GradTrak, e.g. "Computer Science (Engineering)". */
  major: string | null;
  minor: string | null;
  /** Academic year the rules come from, e.g. "2026-27". */
  catalogYear: string;
}

/**
 * UCSB requirement sets loaded by the datapuller's `plan-requirements` job.
 * Names are the keys: a new catalog year adds new entries rather than
 * overwriting the old ones.
 */
export const UCSB_PLAN_REQUIREMENTS: UcsbPlanRequirementSeed[] = [
  {
    name: "University Requirements",
    code: UCSB_UNIVERSITY_REQ_BTLL,
    isUcReq: true,
    college: null,
    major: null,
    minor: null,
    catalogYear: "2026-27",
  },
  {
    name: "College of Engineering GE (2026-27)",
    code: UCSB_ENGINEERING_GE_BTLL,
    isUcReq: false,
    college: "CoE",
    major: null,
    minor: null,
    catalogYear: "2026-27",
  },
  {
    name: "Computer Science (Engineering) (2026-27)",
    code: UCSB_COMPUTER_SCIENCE_BTLL,
    isUcReq: false,
    college: null,
    major: "Computer Science (Engineering)",
    minor: null,
    catalogYear: "2026-27",
  },
];
