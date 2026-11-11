import { redirect } from "react-router-dom";

/**
 * Feature switches for the UCSB conversion.
 *
 * These features still run on Berkeley data or have no UCSB equivalent yet, so
 * they are hidden from navigation and their routes redirect home. The code is
 * left in place: flip a switch to `true` once the feature has UCSB data.
 */
export const FEATURES = {
  /** Degree planner. Needs UCSB colleges, majors and requirements. */
  gradtrak: true,
  /** Grade distributions. Needs a UCSB grades source. */
  grades: true,
  /** Enrollment over time. Needs the UCSB seat-count puller. */
  enrollment: true,
  /** Staff-curated class lists. Berkeley content. */
  curatedClasses: false,
  /**
   * Extra navigation links (the staff-managed nav items and their fallback).
   * Today the only one is Berkeley's Clubs link.
   */
  extraNavItems: false,
} as const;

export type Feature = keyof typeof FEATURES;

/** Route loader: lets the route render if the feature is on, else sends the visitor home. */
export const requireFeature = (feature: Feature) => () =>
  FEATURES[feature] ? null : redirect("/");
