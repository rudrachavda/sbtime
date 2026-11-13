// True on the UAT site (uat.ucsbtime.com, its Vercel branch address, or
// uat.localhost for trying it locally). Used to label UAT so it isn't
// mistaken for the live site.
const hostname = typeof window === "undefined" ? "" : window.location.hostname;

export const IS_UAT =
  hostname.startsWith("uat.") || hostname.includes("-git-uat-");

export const LIVE_SITE_URL = "https://ucsbtime.com";
