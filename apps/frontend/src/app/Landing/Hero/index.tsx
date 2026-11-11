import styles from "./Hero.module.scss";
import StorkeTower from "./StorkeTower";

export default function Hero() {
  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>
        UCSB's
        <br />
        course discovery
        <br className={styles.tabletBreak} /> platform
      </h1>
      <StorkeTower className={styles.tower} />
    </div>
  );
}
