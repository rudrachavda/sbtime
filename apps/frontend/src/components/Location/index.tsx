import { useMemo } from "react";

import { resolveLocation } from "@/lib/location";

import styles from "./Location.module.scss";
import { LocationHoverCard } from "./LocationHoverCard";

interface LocationProps {
  location?: string | null;
}

export default function Location({ location }: LocationProps) {
  const resolved = useMemo(() => resolveLocation(location), [location]);

  if (!resolved || resolved.placeholder) {
    return (
      <p className={styles.placeholder}>
        {resolved?.label ?? "To be determined"}
      </p>
    );
  }

  // Buildings without a map pin are shown as text.
  if (!resolved.building || !resolved.coordinates || !resolved.link) {
    return <p>{resolved.label}</p>;
  }

  return (
    <LocationHoverCard link={resolved.link} coordinates={resolved.coordinates}>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={resolved.link}
        className={styles.root}
      >
        {resolved.label}
      </a>
    </LocationHoverCard>
  );
}
