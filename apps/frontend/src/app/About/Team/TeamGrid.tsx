import { User } from "iconoir-react";

import { FEATURED_MEMBERS, MEMBERS, TeamMember } from "./data";
import styles from "./TeamGrid.module.scss";

// "Our Team": four large cards on the left, then the rest of the team in two
// columns of compact rows on the right. One column on phones.

function Name({ member }: { member: TeamMember }) {
  return (
    <div>
      <p className={styles.name}>
        {member.link ? (
          <a href={member.link} target="_blank" rel="noopener noreferrer">
            {member.name}
          </a>
        ) : (
          member.name
        )}
      </p>
      <p className={styles.role}>{member.role}</p>
    </div>
  );
}

export default function TeamGrid() {
  const half = Math.ceil(MEMBERS.length / 2);
  const columns = [MEMBERS.slice(0, half), MEMBERS.slice(half)];

  return (
    <section aria-label="Our team" className={styles.team}>
      <h2 className={styles.label}>Our Team</h2>

      <div className={styles.featuredHalf}>
        <ul className={styles.featured}>
          {FEATURED_MEMBERS.map((member, index) => (
            <li key={index} className={styles.featuredItem}>
              <div aria-hidden="true" className={styles.media}>
                {member.photo ? (
                  <img src={member.photo} alt="" loading="lazy" />
                ) : (
                  <User />
                )}
              </div>
              <Name member={member} />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.membersHalf}>
        {columns.map((column, columnIndex) => (
          <ul key={columnIndex} className={styles.column}>
            {column.map((member, index) => (
              <li key={index} className={styles.memberItem}>
                <Name member={member} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
