import { FormEvent, useEffect, useRef, useState } from "react";

import { Link, Navigate, useSearchParams } from "react-router-dom";

import useUser from "@/hooks/useUser";
import { signIn } from "@/lib/api";

import styles from "./Login.module.scss";
import Showcase from "./Showcase";

// Only same-site paths, so the link can't send people elsewhere after sign-in.
const safeRedirect = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

// Left arrow from the design reference
function ReturnArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 10C17 10.4142 16.6642 10.75 16.25 10.75L5.61208 10.75L9.76983 14.7094C10.0684 14.9965 10.0777 15.4713 9.79062 15.7698C9.50353 16.0684 9.02875 16.0777 8.73017 15.7906L3.23017 10.5406C3.08311 10.3992 3 10.204 3 10C3 9.79599 3.08311 9.60078 3.23017 9.45938L8.73017 4.20938C9.02875 3.92228 9.50353 3.93159 9.79062 4.23017C10.0777 4.52875 10.0684 5.00353 9.76983 5.29063L5.61208 9.25L16.25 9.25C16.6642 9.25 17 9.58579 17 10Z"
      />
    </svg>
  );
}

export default function Login() {
  const { user, loading } = useUser();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const emailRef = useRef(email);
  emailRef.current = email;

  // Sign-in is Google only. A typed email is passed along so Google
  // pre-selects that account; Google also creates the account on first
  // sign-in, so "Get started" does the same thing.
  const continueWithGoogle = (withEmail = emailRef.current) =>
    signIn(window.location.origin + redirectTo, withEmail);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    continueWithGoogle(email);
  };

  // Return (Enter) signs in from anywhere on the page, as the key hint
  // says; inside the email field the form's submit handles it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat) return;
      if (event.target instanceof HTMLElement && event.target.closest("form"))
        return;
      continueWithGoogle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redirectTo]);

  if (!loading && user) return <Navigate to={redirectTo} replace />;

  return (
    <div className={styles.root}>
      <div className={styles.panelColumn}>
        <main className={styles.panel}>
          <div className={styles.content}>
            {/* Back to the page that sent you here (or the home page) */}
            <header className={styles.header}>
              <nav>
                <Link to={redirectTo} className={styles.returnLink}>
                  <ReturnArrow />
                  Return
                </Link>
              </nav>
            </header>
            <div className={styles.center}>
              <form className={styles.form} noValidate onSubmit={onSubmit}>
                <h1 className={styles.title}>Welcome to SBTime</h1>
                <div className={styles.fields}>
                  <label htmlFor="login-email" className={styles.srOnly}>
                    UCSB email
                  </label>
                  <input
                    id="login-email"
                    className={styles.input}
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="UCSB email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <button type="submit" className={styles.continue}>
                    Continue with Google
                    <kbd className={styles.kbd} aria-hidden="true">
                      return
                    </kbd>
                  </button>
                </div>
              </form>
            </div>
            <p className={styles.footer}>
              Don't have an account?{" "}
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => continueWithGoogle()}
              >
                Get started
              </button>
            </p>
          </div>
        </main>
      </div>
      <Showcase />
    </div>
  );
}
