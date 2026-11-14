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
    const updated = moment(time);
    return updated.isValid() ? updated.fromNow() : null;
  }, [time]);

  const hasData = enrolledCount != null && maxEnroll != null;

  if (!hasData) return null;

  // Never show a negative count, even if one slips into the data
  const enrolled = Math.max(0, enrolledCount);

  const percentage =
    maxEnroll === 0 ? 0 : Math.round((enrolled / maxEnroll) * 100);
  const color = getEnrollmentColor(enrolled, maxEnroll);

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
            {enrolled}/{maxEnroll}
          </span>{" "}
          students are enrolled in this class for this quarter.
          {/* Older classes have no seat-count time; leave the line out */}
          {formattedTime && (
            <>
              <br />
              <i>Updated {formattedTime}.</i>
            </>
          )}
        </>
      }
    />
  );

  return children ? children(content) : content;
}
