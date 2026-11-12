import { formatSubject } from "./subject";

interface ClassLinkable {
  subject: string;
  courseNumber: string;
}

/**
 * The course's page in the UCSB General Catalog, e.g.
 * https://catalog.ucsb.edu/courses/AS%20AM%20127. The catalog has one page
 * per course, not per quarter or section.
 */
export const getExternalLink = (classObj?: ClassLinkable | null) => {
  if (!classObj?.subject || !classObj.courseNumber) return "#";

  const courseId = `${formatSubject(classObj.subject)} ${classObj.courseNumber}`;
  return `https://catalog.ucsb.edu/courses/${encodeURIComponent(courseId)}`;
};
