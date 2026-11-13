import { useEffect } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import styles from "./GetStartedButton.module.scss";

// The one "Get started" button, used in the navigation bar (home page) and on
// the signed-out Scheduler and GradTrak pages. It opens the login page and
// comes back here after Google sign-in; pressing G does the same (except
// while typing in a field).

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export default function GetStartedButton() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const to =
    pathname === "/"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(pathname + search)}`;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
        return;
      if (isTypingTarget(event.target)) return;
      if (event.key.toLowerCase() === "g") navigate(to);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, to]);

  return (
    <Link to={to} className={styles.root}>
      Get started <kbd className={styles.kbd}>G</kbd>
    </Link>
  );
}
