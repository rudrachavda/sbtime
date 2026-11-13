import styles from "./Showcase.module.scss";

// Tilted screenshots on the right of the login page: one large screenshot in
// a frame and two cards in front of it. The images in public/images/login are
// temporary placeholders (the design mockups); replace them with real
// screenshots of SBTime later, keeping the same file names.
export default function Showcase() {
  return (
    <div className={styles.showcase} aria-hidden="true">
      <div className={styles.showcaseStage}>
        <div className={styles.showcaseFrame}>
          <div className={styles.showcaseMain}>
            <img
              src="/images/login/showcase-home.webp"
              alt=""
              width={1512}
              height={982}
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
        <div className={`${styles.showcaseCard} ${styles.showcaseCardTop}`}>
          <img
            src="/images/login/showcase-login-light.webp"
            alt=""
            width={440}
            height={304}
            decoding="async"
            draggable={false}
          />
        </div>
        <div className={`${styles.showcaseCard} ${styles.showcaseCardBottom}`}>
          <img
            src="/images/login/showcase-login-dark.webp"
            alt=""
            width={440}
            height={302}
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
      <div className={styles.showcaseFade} />
    </div>
  );
}
