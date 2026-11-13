import EnrollmentShowcase from "./EnrollmentShowcase";
import FeatureSection from "./FeatureSection";
import GradTrakShowcase from "./GradTrakShowcase";
import GradesShowcase from "./GradesShowcase";

// The home page's feature sections, under the hero. Copy is a first draft;
// each window is an animated mockup built from a fixed snapshot of real data.
export default function Features() {
  return (
    <>
      <FeatureSection
        title="Visualize your 4 year plan"
        description="SBTime will check your courses that you have taken against your major sheet, and UC requirements."
        features={[
          "Course planning",
          "Requirement checker",
          "Quarter-by-quarter view",
          "Unit totals",
        ]}
        showcase={<GradTrakShowcase />}
      />
      <FeatureSection
        title="See how classes are graded"
        description="Grade distributions for every class, across quarters and instructors, so you know what to expect before you enroll."
        features={[
          "Grade distributions",
          "Compare instructors",
          "Average GPA",
          "Past quarters",
        ]}
        showcase={<GradesShowcase />}
      />
      <FeatureSection
        title="Track every seat"
        description="See how fast classes fill, with seat counts updated every 15 minutes and an email when a spot opens."
        features={[
          "Live seat counts",
          "Enrollment history",
          "Seat alerts",
          "Updated every 15 minutes",
        ]}
        showcase={<EnrollmentShowcase />}
      />
    </>
  );
}
