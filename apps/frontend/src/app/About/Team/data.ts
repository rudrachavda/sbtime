// The /about page's team grid and photo deck. Everything here is a
// placeholder until the team list and photos are decided: replace the names,
// roles and photos below.

export interface TeamMember {
  name: string;
  role: string;
  /** Photo path under /public, shown in black and white; an icon without one */
  photo?: string;
  /** Personal site, LinkedIn or X; makes the name a link */
  link?: string;
}

/** The four large cards on the left */
export const FEATURED_MEMBERS: TeamMember[] = [
  { name: "Team member", role: "Founder" },
  { name: "Team member", role: "Engineering Lead" },
  { name: "Team member", role: "Design Lead" },
  { name: "Team member", role: "Product Lead" },
];

/** The compact rows on the right, filled down the first column, then the second */
export const MEMBERS: TeamMember[] = [
  { name: "Team member", role: "Frontend Engineer" },
  { name: "Team member", role: "Frontend Engineer" },
  { name: "Team member", role: "Backend Engineer" },
  { name: "Team member", role: "Backend Engineer" },
  { name: "Team member", role: "Data Engineer" },
  { name: "Team member", role: "Designer" },
  { name: "Team member", role: "Designer" },
  { name: "Team member", role: "Product Manager" },
  { name: "Team member", role: "Marketing" },
  { name: "Team member", role: "Outreach" },
];

export interface TeamSignature {
  name: string;
  /** Personal site, LinkedIn or X; shows the name on hover either way */
  link?: string;
  /**
   * The signature as an SVG under /public, e.g. "/images/signatures/alex.svg",
   * with its viewBox width and height. Drawn in the text color, so any single
   * colour works. Without one, the name shows in italics instead.
   */
  signature?: { src: string; width: number; height: number };
  /** Drawn height on desktop in px (default 56); phones use about 3/4 of it */
  height?: number;
}

/** The signatures under the photos, three to a row (two on phones). Dummy
 * signatures for now */
export const SIGNATURES: TeamSignature[] = [
  {
    name: "Joseph",
    signature: { src: "/images/signatures/joseph.svg", width: 75, height: 51 },
  },
  {
    name: "Ethan",
    signature: { src: "/images/signatures/ethan.svg", width: 85, height: 51 },
  },
  {
    name: "Riley",
    signature: { src: "/images/signatures/riley.svg", width: 81.5, height: 51 },
  },
  {
    name: "John",
    signature: { src: "/images/signatures/john.svg", width: 65.5, height: 51 },
  },
  {
    name: "Jane",
    signature: { src: "/images/signatures/jane.svg", width: 63, height: 51 },
  },
  {
    name: "Rudra",
    signature: { src: "/images/signatures/rudra.svg", width: 93.2, height: 51 },
  },
];

/** Where "Join the team" goes. No page there yet, so it shows the 404 page */
export const JOIN_TEAM_LINK = "/join";

export interface TeamPhoto {
  src: string;
  caption: string;
  /** Shown under the caption, e.g. "September 12, 2025" */
  date: string;
}

// Berkeleytime's team photos, kept until SBTime has its own
export const TEAM_PHOTOS: TeamPhoto[] = [
  {
    src: "/images/about1.png",
    caption: "Berkeleytime team photo",
    date: "Replace with an SBTime photo",
  },
  {
    src: "/images/about2.png",
    caption: "Berkeleytime team photo",
    date: "Replace with an SBTime photo",
  },
  {
    src: "/images/about3.png",
    caption: "Berkeleytime team photo",
    date: "Replace with an SBTime photo",
  },
  {
    src: "/images/about4.png",
    caption: "Berkeleytime team photo",
    date: "Replace with an SBTime photo",
  },
  {
    src: "/images/about5.png",
    caption: "Berkeleytime team photo",
    date: "Replace with an SBTime photo",
  },
];
