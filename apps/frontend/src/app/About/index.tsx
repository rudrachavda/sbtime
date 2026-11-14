import styles from "./About.module.scss";
import PhotoDeck from "./Team/PhotoDeck";
import TeamGrid from "./Team/TeamGrid";

// The /about page: the team grid, then the team photos.
// The team list and photos live in ./Team/data.ts.

export default function About() {
  return (
    <div className={styles.root}>
      <div className={styles.teamFrame}>
        <TeamGrid />
        <PhotoDeck />
      </div>
    </div>
  );
}
