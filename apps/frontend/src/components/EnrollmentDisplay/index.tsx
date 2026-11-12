import { ReactNode, useMemo } from "react";

import moment from "moment";

import { Tooltip } from "@repo/theme";

import { getEnrollmentColor } from "@/components/Capacity";

import styles from "./EnrollmentDisplay.module.scss";

interface EnrollmentDisplayProps {
  enrolledCount?: number;
  maxEnroll?: number;
  time?: string;
  children?: (content: ReactNode) => ReactNode;
}

export default function EnrollmentDisplay({
  enrolledCount,
  maxEnroll,
  time,
  children,
}: EnrollmentDisplayProps) {
  const formattedTime = useMemo(() => {
    if (!time) return null;
    return moment(time).fromNow();
  }, [time]);

  const hasData = enrolledCount != null && maxEnroll != null;

  if (!hasData) return null;

  const percentage =
    maxEnroll === 0 ? 0 : Math.round((enrolledCount / maxEnroll) * 100);
  const color = getEnrollmentColor(enrolledCount, maxEnroll);

  // Waitlist numbers are hidden on SBTime.
  const content = (
    <Tooltip
      trigger={
        <span className={styles.trigger} style={{ color }}>
          {percentage}% enrolled
        </span>
      }
      title="Enrollment"
      description={
        <>
          <span style={{ color }}>
            {enrolledCount}/{maxEnroll}
          </span>{" "}
          students are enrolled in this class for this quarter.
          <br />
          <i>Updated {formattedTime}.</i>
        </>
      }
    />
  );

  return children ? children(content) : content;
}
