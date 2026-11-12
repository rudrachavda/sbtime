import { UCSB_ARTIFICIAL_INTELLIGENCE_BTLL } from "./artificial-intelligence";
import { UCSB_CHEMICAL_ENGINEERING_BTLL } from "./chemical-engineering";
import { UCSB_COMPUTER_ENGINEERING_BTLL } from "./computer-engineering";
import { UCSB_COMPUTER_SCIENCE_BTLL } from "./computer-science";
import { UCSB_ELECTRICAL_ENGINEERING_BTLL } from "./electrical-engineering";
import { UCSB_ENGINEERING_GE_BTLL } from "./engineering";
import { UCSB_MECHANICAL_ENGINEERING_BTLL } from "./mechanical-engineering";
import { UCSB_UNIVERSITY_REQ_BTLL } from "./university";

export {
  UCSB_ARTIFICIAL_INTELLIGENCE_BTLL,
  UCSB_CHEMICAL_ENGINEERING_BTLL,
  UCSB_COMPUTER_ENGINEERING_BTLL,
  UCSB_COMPUTER_SCIENCE_BTLL,
  UCSB_ELECTRICAL_ENGINEERING_BTLL,
  UCSB_ENGINEERING_GE_BTLL,
  UCSB_MECHANICAL_ENGINEERING_BTLL,
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

/** A 2026-27 GEAR major, keyed by its GradTrak label. */
const gearMajor = (major: string, code: string): UcsbPlanRequirementSeed => ({
  name: `${major} (2026-27)`,
  code,
  isUcReq: false,
  college: null,
  major,
  minor: null,
  catalogYear: "2026-27",
});

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
  gearMajor("Computer Science (Engineering)", UCSB_COMPUTER_SCIENCE_BTLL),
  gearMajor("Artificial Intelligence", UCSB_ARTIFICIAL_INTELLIGENCE_BTLL),
  gearMajor("Chemical Engineering", UCSB_CHEMICAL_ENGINEERING_BTLL),
  gearMajor("Computer Engineering", UCSB_COMPUTER_ENGINEERING_BTLL),
  gearMajor("Electrical Engineering", UCSB_ELECTRICAL_ENGINEERING_BTLL),
  gearMajor("Mechanical Engineering", UCSB_MECHANICAL_ENGINEERING_BTLL),
];
