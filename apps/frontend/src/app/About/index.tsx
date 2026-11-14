import styles from "./About.module.scss";
import PhotoDeck from "./Team/PhotoDeck";
import TeamGrid from "./Team/TeamGrid";

// The /about page: the team grid, then the team photos.
// The team list and photos live in ./Team/data.ts.

// Experimental: a soft UCSB navy and gold glow around the team frame, in the
// hero's colors. Set to false to turn it off.
const SHOW_GLOW = false;

export default function About() {
  return (
    // Full width, so the glow can spread past the column without making the
    // page scroll sideways
    <div className={styles.page}>
      <div className={styles.root}>
        <div className={SHOW_GLOW ? styles.glow : undefined}>
          <div className={styles.teamFrame}>
            <TeamGrid />
            <PhotoDeck />
          </div>
        </div>
      </div>
    </div>
  );
}
