// The release log: "The Latest" on the home page shows the first three,
// /changelog shows them all, and each has its own page at /changelog/<slug>.
// Newest first. Add an entry at the top to publish a release; don't change a
// slug once it's out, since links to it would break.

export interface ReleaseAuthor {
  name: string;
  role: string;
  /** Photo path under /public; without one the avatar shows initials */
  avatar?: string;
}

export interface Release {
  slug: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  /** One or two sentences for the home page card */
  summary: string;
  /** The changelog article, one string per paragraph */
  body: string[];
  /** Image at 2400×1260 (or the same shape); a placeholder shows without one */
  image?: { src: string; alt: string };
  /** Defaults to SBTIME_AUTHOR */
  author?: ReleaseAuthor;
}

export const SBTIME_AUTHOR: ReleaseAuthor = { name: "SBTime", role: "Team" };

export const RELEASES: Release[] = [
  {
    slug: "new-home-page",
    date: "2026-11-13",
    title: "A new home page",
    summary:
      "The home page now shows what SBTime does, with live previews of the scheduler, GradTrak, grades and enrollment, and a simpler sign-in.",
    body: [
      "The home page has been rebuilt around the things you come to SBTime for. Each part of the site gets its own preview, drawn from real UCSB data: a Fall 2024 schedule coming together, a GradTrak plan filling in its requirements, two instructors' grade distributions side by side, and a lecture's seats filling up across registration passes.",
      "Signing in is simpler too. Enter your UCSB email or continue with Google, and you'll land back on the page you were on.",
    ],
  },
  {
    slug: "ucsbtime-launch",
    date: "2026-11-12",
    title: "SBTime is live at ucsbtime.com",
    summary:
      "SBTime now runs at ucsbtime.com, with seat counts refreshed every 15 minutes and a public status page.",
    body: [
      "SBTime has a home: ucsbtime.com. Sign in with your UCSB Google account to save schedules, bookmarks and GradTrak plans.",
      "Seat counts are refreshed from UCSB every 15 minutes, so the numbers you see during registration stay close to what GOLD shows. If something looks off, the status page linked in the footer shows whether SBTime is up.",
    ],
  },
  {
    slug: "seat-alerts",
    date: "2026-11-12",
    title: "Seat alerts",
    summary:
      "Tap the bell on a full class and SBTime emails your @ucsb.edu address when a seat opens up.",
    body: [
      "Full class? Tap the bell on it and SBTime will email your @ucsb.edu address when a seat opens up.",
      "Watching a class turns alerts on for you, and they turn off again once you're not watching anything. You can see and change them any time under Notifications in your profile.",
    ],
  },
  {
    slug: "gradtrak-engineering",
    date: "2026-11-11",
    title: "GradTrak for College of Engineering majors",
    summary:
      "Plan your degree quarter by quarter and check it against your major's requirements, starting with the College of Engineering.",
    body: [
      "GradTrak lays out your degree quarter by quarter and checks your plan against your requirements as you go: UCSB's university requirements, General Education, and your major.",
      "We're starting with the College of Engineering's 2026-27 majors: Computer Science, Artificial Intelligence, Chemical, Computer, Electrical and Mechanical Engineering, including the CS science elective lists. More majors are on the way.",
    ],
  },
  {
    slug: "grades-and-enrollment",
    date: "2026-11-11",
    title: "Grades and enrollment for UCSB",
    summary:
      "Compare grade distributions across instructors and quarters, and see how fast a class fills across registration passes.",
    body: [
      "Grades shows how a class has been graded, for every instructor and quarter we have data for. Add a few to compare them side by side.",
      "Enrollment charts a class's seats day by day, with each registration pass marked, so you can see how quickly it filled last time and plan your pass time around it.",
    ],
  },
  {
    slug: "scheduler",
    date: "2026-11-11",
    title: "The Scheduler, now for UCSB",
    summary:
      "Build your quarter's schedule with discussions matched to their lectures, final exam times, and every class on a campus map.",
    body: [
      "Pick your classes and the Scheduler lays out your week. Discussions and labs are matched to their lectures, and each class shows its final exam time so you can spot clashes early.",
      "Every class also appears on a map of campus, so you can see how far you'll walk between them.",
    ],
  },
];

/** "November 12, 2026" */
export const formatReleaseDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const releaseLink = (slug: string) => `/changelog/${slug}`;
