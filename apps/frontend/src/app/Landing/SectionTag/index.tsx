import styles from "./SectionTag.module.scss";

// The small Departure Mono number ("01") above a home page section's title.
// Decorative, so screen readers skip it. Place it 16px above the title.
export default function SectionTag({ children }: { children: string }) {
  return (
    <p className={styles.tag} aria-hidden="true">
      {children}
    </p>
  );
}
